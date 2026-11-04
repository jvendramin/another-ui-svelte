<script lang="ts">
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import * as Collapsible from "$lib/registry/ui/collapsible/index.js";
	import { Spinner } from "$lib/registry/ui/spinner/index.js";
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	// Several calls folded behind a summary line: "Used 3 tools", or "Using tools" while any is running. Svelte
	// cannot read its children's props, so pass `count`, `running` and `errors` from the same list you render.
	let {
		count,
		running = false,
		errors = 0,
		label,
		open = $bindable(false),
		children,
		class: className,
	}: {
		count: number;
		running?: boolean;
		errors?: number;
		/** Replaces the default summary. */
		label?: string;
		open?: boolean;
		children?: Snippet;
		class?: string;
	} = $props();

	const summary = $derived(
		label ?? (running ? "Using tools" : `Used ${count} ${count === 1 ? "tool" : "tools"}`)
	);
</script>

<Collapsible.Root
	bind:open
	data-slot="tool-call-group"
	class={cn("group/tools flex w-full min-w-0 flex-col", className)}
>
	<Collapsible.Trigger
		class="flex w-fit max-w-full cursor-pointer items-center gap-1.5 rounded-md py-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
	>
		{#if running}
			<Spinner class="size-3.5" />
		{:else}
			<IconPlaceholder
				lucide="WrenchIcon"
				tabler="IconTool"
				hugeicons="Wrench01Icon"
				phosphor="WrenchIcon"
				remixicon="RiToolsLine"
				class="size-4"
			/>
		{/if}
		<span>{summary}</span>
		{#if errors > 0}
			<Badge variant="destructive" class="h-4 px-1.5 text-[10px]">{errors} failed</Badge>
		{/if}
		<IconPlaceholder
			lucide="ChevronDownIcon"
			tabler="IconChevronDown"
			hugeicons="ArrowDown01Icon"
			phosphor="CaretDownIcon"
			remixicon="RiArrowDownSLine"
			class="size-3.5 transition-transform group-data-[state=open]/tools:-scale-y-100"
		/>
	</Collapsible.Trigger>
	<Collapsible.Content>
		<div class="flex min-w-0 flex-col gap-2 pt-2">{@render children?.()}</div>
	</Collapsible.Content>
</Collapsible.Root>
