<script lang="ts">
	import * as Resizable from "$lib/registry/ui/resizable/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	// A list beside a detail pane, such as an inbox's thread list and the open thread. Wide: two resizable panes with a
	// drag handle (arrow keys work on it too), a size range, optional collapse and a saved layout. Narrow: one column that
	// shows the list or the detail, switched by `showDetail`. Composed from Resizable (Paneforge).
	let {
		ref = $bindable(null),
		list,
		detail,
		empty,
		showDetail = $bindable(false),
		listSize = 35,
		minListSize = 22,
		maxListSize = 60,
		collapsible = false,
		listCollapsed = $bindable(false),
		stackBelow = 640,
		autoSaveId,
		listLabel = "List",
		detailLabel = "Detail",
		class: className,
		...restProps
	}: Omit<WithElementRef<HTMLAttributes<HTMLDivElement>>, "children"> & {
		/** The list pane. */
		list: Snippet<[{ narrow: boolean }]>;
		/** The detail pane. Receives `back`, which sets `showDetail` to false for a back button in the narrow layout. */
		detail: Snippet<[{ narrow: boolean; back: () => void }]>;
		/** Shown in the detail pane in the wide layout while `showDetail` is false, such as "Select a thread". */
		empty?: Snippet;
		/** Whether an item is open. In the narrow layout it picks the detail over the list. Bindable. */
		showDetail?: boolean;
		/** Width of the list as a percent of the whole. Default 35. */
		listSize?: number;
		minListSize?: number;
		maxListSize?: number;
		/** Let the list be dragged shut, or closed with `listCollapsed`. Wide layout only. */
		collapsible?: boolean;
		/** Whether the list is collapsed. Bindable. */
		listCollapsed?: boolean;
		/** Width in px below which the panes stack into one column. Default 640. */
		stackBelow?: number;
		/** Saves the dragged width in localStorage under this id. */
		autoSaveId?: string;
		listLabel?: string;
		detailLabel?: string;
	} = $props();

	let width = $state(0);
	// Until the width is measured, render the wide layout so the server and first paint match.
	const narrow = $derived(width > 0 && width < stackBelow);
	let listPane = $state<{ collapse: () => void; expand: () => void; isCollapsed: () => boolean }>();

	$effect(() => {
		if (!listPane || narrow || !collapsible) return;
		if (listCollapsed && !listPane.isCollapsed()) listPane.collapse();
		else if (!listCollapsed && listPane.isCollapsed()) listPane.expand();
	});

	const back = () => (showDetail = false);
</script>

<div
	bind:this={ref}
	bind:clientWidth={width}
	data-slot="split-pane"
	data-layout={narrow ? "stacked" : "split"}
	class={cn("flex h-full min-h-0 w-full", className)}
	{...restProps}
>
	{#if narrow}
		<div
			class="min-w-0 flex-1 overflow-auto"
			role="region"
			aria-label={showDetail ? detailLabel : listLabel}
		>
			{#if showDetail}{@render detail({ narrow, back })}{:else}{@render list({ narrow })}{/if}
		</div>
	{:else}
		<Resizable.PaneGroup direction="horizontal" {autoSaveId}>
			<Resizable.Pane
				bind:this={listPane}
				defaultSize={listSize}
				minSize={minListSize}
				maxSize={maxListSize}
				{collapsible}
				collapsedSize={0}
				onCollapse={() => (listCollapsed = true)}
				onExpand={() => (listCollapsed = false)}
			>
				<div class="h-full overflow-auto" role="region" aria-label={listLabel}>
					{@render list({ narrow })}
				</div>
			</Resizable.Pane>
			<Resizable.Handle withHandle aria-label="Resize {listLabel.toLowerCase()}" />
			<Resizable.Pane defaultSize={100 - listSize}>
				<div class="h-full overflow-auto" role="region" aria-label={detailLabel}>
					{#if showDetail}{@render detail({ narrow, back })}{:else if empty}{@render empty()}{/if}
				</div>
			</Resizable.Pane>
		</Resizable.PaneGroup>
	{/if}
</div>
