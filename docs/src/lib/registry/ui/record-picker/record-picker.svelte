<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type RecordPickerOption = {
		id: string;
		label: string;
		/** A second line under the label: an email, a domain. */
		description?: string;
		/** Where the record lives. Used by RecordFields to render a link when the field is read only. */
		href?: string;
	};
</script>

<script lang="ts">
	import { tick } from "svelte";
	import * as Command from "$lib/registry/ui/command/index.js";
	import * as Popover from "$lib/registry/ui/popover/index.js";
	import { cn } from "$lib/utils.js";

	// Pick one record from a searchable list, in a popover. The list comes from `search(query)`, which may call your API:
	// it runs when the popover opens and after the user pauses typing, and only the answer to the latest query is shown.
	// Composed from Popover and Command (shouldFilter off, so the server decides what matches).
	let {
		value = $bindable(null),
		open = $bindable(false),
		search,
		onSelect,
		trigger,
		label = "Record",
		placeholder = "Search...",
		emptyLabel = "No results.",
		clearLabel,
		debounceMs = 200,
		class: className,
	}: {
		/** The picked record, or null. Bindable. */
		value?: RecordPickerOption | null;
		open?: boolean;
		/** Returns the options for a query ("" when the popover opens). May be async. */
		search: (query: string) => RecordPickerOption[] | Promise<RecordPickerOption[]>;
		/** Called with the picked option, or null for the clear row. Throw to keep the popover open and show an error. */
		onSelect?: (option: RecordPickerOption | null) => void | Promise<void>;
		/** The element that opens the popover. Spread `props` on a button. */
		trigger: Snippet<[{ props: Record<string, unknown>; open: boolean }]>;
		/** Names the list for screen readers. */
		label?: string;
		placeholder?: string;
		emptyLabel?: string;
		/** Shows a first row with this text (for example "No company") that clears the value. */
		clearLabel?: string;
		debounceMs?: number;
		class?: string;
	} = $props();

	let query = $state("");
	let options = $state<RecordPickerOption[]>([]);
	let loading = $state(false);
	let failed = $state(false);
	let saveFailed = $state(false);
	let saving = $state(false);
	let triggerRef = $state<HTMLElement | null>(null);
	let latest = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function run(q: string) {
		const mine = ++latest;
		loading = true;
		failed = false;
		try {
			const result = await search(q);
			if (mine === latest) options = result;
		} catch {
			if (mine === latest) {
				options = [];
				failed = true;
			}
		} finally {
			if (mine === latest) loading = false;
		}
	}

	// Open: reset the text and load the first page. Typing: wait for a pause, then ask again.
	$effect(() => {
		if (open) {
			query = "";
			saveFailed = false;
			run("");
		} else {
			latest++;
			clearTimeout(timer);
		}
	});

	function typed(next: string) {
		query = next;
		clearTimeout(timer);
		loading = true;
		timer = setTimeout(() => run(next), debounceMs);
	}

	async function pick(option: RecordPickerOption | null) {
		if (saving) return;
		saving = true;
		saveFailed = false;
		try {
			await onSelect?.(option);
			value = option;
			open = false;
			await tick();
			triggerRef?.focus();
		} catch {
			saveFailed = true;
		} finally {
			saving = false;
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			{@render trigger({ props, open })}
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class={cn("w-72 p-0", className)} align="start">
		<Command.Root shouldFilter={false} data-slot="record-picker" aria-label={label}>
			<Command.Input
				{placeholder}
				value={query}
				oninput={(e: Event) => typed((e.currentTarget as HTMLInputElement).value)}
			/>
			<Command.List>
				{#if loading && options.length === 0}
					<Command.Loading>
						<div class="px-3 py-6 text-center text-[13px] text-muted-foreground">Loading...</div>
					</Command.Loading>
				{:else if failed}
					<div role="alert" class="px-3 py-6 text-center text-[13px] text-destructive">
						Could not load. Try again.
					</div>
				{:else if options.length === 0 && !clearLabel}
					<Command.Empty>{emptyLabel}</Command.Empty>
				{/if}
				<Command.Group>
					{#if clearLabel && value}
						<Command.Item value="__clear__" onSelect={() => pick(null)}>
							<span class="text-muted-foreground">{clearLabel}</span>
						</Command.Item>
					{/if}
					{#each options as option (option.id)}
						<Command.Item
							value={option.id}
							data-checked={value?.id === option.id}
							onSelect={() => pick(option)}
						>
							<span class="flex min-w-0 flex-col">
								<span class="truncate">{option.label}</span>
								{#if option.description}
									<span class="truncate text-xs text-muted-foreground">{option.description}</span>
								{/if}
							</span>
						</Command.Item>
					{/each}
				</Command.Group>
				{#if !loading && !failed && options.length === 0 && clearLabel}
					<div class="px-3 py-4 text-center text-[13px] text-muted-foreground">{emptyLabel}</div>
				{/if}
				{#if saveFailed}
					<div role="alert" class="px-3 py-2 text-[13px] text-destructive">
						Could not save. Try again.
					</div>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
