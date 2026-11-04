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
		showDetail = false,
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
		/** The detail pane. Receives `narrow`, so you can show a back button that clears your own open state. */
		detail: Snippet<[{ narrow: boolean }]>;
		/** Shown in the detail pane in the wide layout while `showDetail` is false, such as "Select a thread". */
		empty?: Snippet;
		/** Whether an item is open. You own it. In the narrow layout it picks the detail over the list. */
		showDetail?: boolean;
		/** Width of the list as a percent of the whole. Default 35. */
		listSize?: number;
		minListSize?: number;
		maxListSize?: number;
		/** Let the list be dragged shut, or closed with `listCollapsed`. Wide layout only. `listCollapsed` needs this. */
		collapsible?: boolean;
		/** Whether the list is collapsed. Bindable. Has no effect unless `collapsible` is set. */
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
		if (collapsedNow && !listPane.isCollapsed()) listPane.collapse();
		else if (!collapsedNow && listPane.isCollapsed()) listPane.expand();
	});

	const collapsedNow = $derived(collapsible && listCollapsed);
	const lo = $derived(Math.min(minListSize, maxListSize));
	const hi = $derived(Math.max(minListSize, maxListSize));
	const startSize = $derived(Math.min(hi, Math.max(lo, listSize)));

	// In the stacked layout the list stays mounted (so its scroll position survives) and is hidden while a thread is open.
	// Opening moves focus to the detail; closing puts it back on the control that opened it.
	let detailEl = $state<HTMLElement | null>(null);
	let opener: Element | null = null;
	let wasOpen = false;
	$effect(() => {
		const open = narrow && showDetail;
		if (open && !wasOpen) {
			opener = document.activeElement;
			queueMicrotask(() => detailEl?.focus());
		} else if (!open && wasOpen && opener instanceof HTMLElement && opener.isConnected) {
			const target = opener;
			queueMicrotask(() => target.focus());
		}
		wasOpen = open;
	});
</script>

<div
	bind:this={ref}
	bind:clientWidth={width}
	data-slot="split-pane"
	data-layout={narrow ? "stacked" : "split"}
	class={cn("flex h-full min-h-0 w-full", width === 0 && "invisible", className)}
	{...restProps}
>
	{#if narrow}
		<div
			class="min-w-0 flex-1 overflow-auto"
			role="region"
			aria-label={listLabel}
			hidden={showDetail}
		>
			{@render list({ narrow })}
		</div>
		<div
			bind:this={detailEl}
			tabindex="-1"
			class="min-w-0 flex-1 overflow-auto outline-none"
			role="region"
			aria-label={detailLabel}
			hidden={!showDetail}
		>
			{@render detail({ narrow })}
		</div>
	{:else}
		<Resizable.PaneGroup direction="horizontal" {autoSaveId}>
			<Resizable.Pane
				bind:this={listPane}
				defaultSize={startSize}
				minSize={lo}
				maxSize={hi}
				{collapsible}
				collapsedSize={0}
				onCollapse={() => (listCollapsed = true)}
				onExpand={() => (listCollapsed = false)}
			>
				<div
					class="h-full overflow-auto"
					role="region"
					aria-label={listLabel}
					inert={collapsedNow || undefined}
					aria-hidden={collapsedNow || undefined}
				>
					{@render list({ narrow })}
				</div>
			</Resizable.Pane>
			<Resizable.Handle withHandle aria-label="Resize {listLabel.toLowerCase()}" />
			<Resizable.Pane defaultSize={100 - startSize}>
				<div class="h-full overflow-auto" role="region" aria-label={detailLabel}>
					{#if showDetail}{@render detail({ narrow })}{:else if empty}{@render empty()}{/if}
				</div>
			</Resizable.Pane>
		</Resizable.PaneGroup>
	{/if}
</div>
