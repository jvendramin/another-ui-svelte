<script lang="ts" module>
	import type { BadgeTone } from "$lib/registry/ui/badge/badge.svelte";

	export type FilterOption = { value: string; label: string; tone?: BadgeTone };
	export type FilterFacet = { id: string; label: string; options: FilterOption[] };
	/** The chosen values per facet id. A facet with no values, or missing, is not filtering. */
	export type FilterValue = Record<string, string[]>;
</script>

<script lang="ts">
	import * as Command from "$lib/registry/ui/command/index.js";
	import * as Popover from "$lib/registry/ui/popover/index.js";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { Button } from "$lib/registry/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	// A row of filter chips, one per facet (stage, owner, status). Click a chip to pick values from a list, several at a time;
	// an active chip shows what is picked and has a button to clear it. Composed from Popover, Command, Button and Badge.
	// Pair it with RecordTable's `filters` prop,.
	let {
		facets,
		value = $bindable({}),
		onChange,
		clearLabel = "Clear filters",
		searchFrom = 8,
		class: className,
	}: {
		facets: FilterFacet[];
		/** The picked values per facet id. Bindable. */
		value?: FilterValue;
		/** Called with the new value after the user changes a chip. */
		onChange?: (value: FilterValue) => void;
		/** The text of the button that clears every chip, shown while any chip is active. */
		clearLabel?: string;
		/** Show a search box in a chip's list once it has this many options. Default 8. */
		searchFrom?: number;
		class?: string;
	} = $props();

	const picked = (facet: FilterFacet) => value[facet.id] ?? [];
	const active = $derived(facets.some((f) => (value[f.id] ?? []).length > 0));

	function set(next: FilterValue) {
		// Drop empty facets so `value` only holds real filters.
		const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v.length > 0));
		value = clean;
		onChange?.(clean);
	}

	function toggle(facet: FilterFacet, optionValue: string) {
		const current = picked(facet);
		set({
			...value,
			[facet.id]: current.includes(optionValue)
				? current.filter((v) => v !== optionValue)
				: [...current, optionValue],
		});
	}

	// Written as an escape: the registry build trims every double-quoted string, which would turn ", " into ",".
	const SEPARATOR = ",\u0020";

	function summary(facet: FilterFacet) {
		const labels = picked(facet).map((v) => facet.options.find((o) => o.value === v)?.label ?? v);
		return labels.length > 2
			? `${labels.slice(0, 2).join(SEPARATOR)} +${labels.length - 2}`
			: labels.join(SEPARATOR);
	}
</script>

<div
	data-slot="filter-chips"
	role="group"
	aria-label="Filters"
	class={cn("flex flex-wrap items-center gap-2", className)}
>
	{#each facets as facet (facet.id)}
		{@const chosen = picked(facet)}
		<div data-facet={facet.id} class="flex items-center">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							type="button"
							variant={chosen.length ? "secondary" : "outline"}
							size="sm"
							aria-label={chosen.length
								? `${facet.label} filter: ${summary(facet)}`
								: `${facet.label} filter`}
							class={cn("gap-1.5 font-normal", chosen.length > 0 && "rounded-e-none")}
						>
							<span class={cn(!chosen.length && "text-muted-foreground")}>{facet.label}</span>
							{#if chosen.length}
								<span class="max-w-40 truncate font-medium">{summary(facet)}</span>
							{:else}
								<IconPlaceholder
									lucide="PlusIcon"
									tabler="IconPlus"
									hugeicons="PlusSignIcon"
									phosphor="PlusIcon"
									remixicon="RiAddLine"
									class="size-3.5 text-muted-foreground"
								/>
							{/if}
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-56 p-0" align="start">
					<Command.Root aria-label="{facet.label} values">
						{#if facet.options.length >= searchFrom}
							<Command.Input placeholder="Search {facet.label.toLowerCase()}..." />
						{/if}
						<Command.List>
							<Command.Empty>No matches.</Command.Empty>
							<Command.Group>
								{#each facet.options as option (option.value)}
									{@const on = chosen.includes(option.value)}
									<Command.Item
										value={option.label}
										data-checked={on}
										onSelect={() => toggle(facet, option.value)}
									>
										<span class="truncate">{option.label}</span>
										{#if on}
											<IconPlaceholder
												lucide="CheckIcon"
												tabler="IconCheck"
												hugeicons="Tick02Icon"
												phosphor="CheckIcon"
												remixicon="RiCheckLine"
												class="ms-auto size-3.5 shrink-0"
											/>
											<span class="sr-only">(selected)</span>
										{/if}
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
			{#if chosen.length}
				<Button
					type="button"
					variant="secondary"
					size="sm"
					aria-label="Clear {facet.label} filter"
					class="rounded-s-none border-s border-border px-1.5"
					onclick={() => set({ ...value, [facet.id]: [] })}
				>
					<IconPlaceholder
						lucide="XIcon"
						tabler="IconX"
						hugeicons="Cancel01Icon"
						phosphor="XIcon"
						remixicon="RiCloseLine"
						class="size-3.5"
					/>
				</Button>
			{/if}
		</div>
	{/each}
	{#if active}
		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="text-muted-foreground"
			onclick={() => set({})}
		>
			{clearLabel}
		</Button>
	{/if}
</div>
