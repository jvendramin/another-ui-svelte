<script lang="ts">
	import { onMount, untrack, type Snippet } from "svelte";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// A list beside a detail pane, such as an inbox's thread list and the open thread. Wide: the two panes sit side by side
	// with a drag handle (arrow keys work on it too), a size range, optional collapse and an optional saved width. Narrow: one
	// column that shows the list or the detail, switched by `showDetail`. The list and the detail are rendered once and stay
	// mounted in both layouts, so crossing `stackBelow` keeps the list's scroll position and focus.
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
		handleLabel = `Resize ${listLabel}`,
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
		/** Name of the drag handle. Default "Resize" plus `listLabel`. */
		handleLabel?: string;
	} = $props();

	const lo = $derived(Math.min(minListSize, maxListSize));
	const hi = $derived(Math.max(minListSize, maxListSize));
	const clamp = (n: number) => Math.min(hi, Math.max(lo, n));

	// The width is measured once on mount, before the first paint of a client render, and then follows the element.
	let width = $state(0);
	const narrow = $derived(width > 0 && width < stackBelow);
	// Collapsing is a wide layout feature; in the stacked layout the list is always usable.
	const collapsedNow = $derived(!narrow && collapsible && listCollapsed);

	let pct = $state(untrack(() => Math.min(hi, Math.max(lo, listSize))));
	let dragging = $state(false);
	let listEl = $state<HTMLElement | null>(null);
	let detailEl = $state<HTMLElement | null>(null);
	let handleEl = $state<HTMLElement | null>(null);

	function storageKey() {
		return autoSaveId ? `split-pane:${autoSaveId}` : null;
	}
	onMount(() => {
		if (ref) width = ref.clientWidth;
		const key = storageKey();
		try {
			const saved = key ? Number(localStorage.getItem(key)) : NaN;
			if (Number.isFinite(saved) && saved > 0) pct = clamp(saved);
			else pct = clamp(pct);
		} catch {
			pct = clamp(pct);
		}
	});
	function save() {
		const key = storageKey();
		if (!key) return;
		try {
			localStorage.setItem(key, String(Math.round(pct * 10) / 10));
		} catch {
			// Storage can be blocked; the width is simply not kept.
		}
	}

	function setFromPointer(clientX: number) {
		if (!ref) return;
		const box = ref.getBoundingClientRect();
		if (box.width <= 0) return;
		const next = ((clientX - box.left) / box.width) * 100;
		if (collapsible && next < lo / 2) {
			listCollapsed = true;
			return;
		}
		if (collapsible) listCollapsed = false;
		pct = clamp(next);
	}
	function onPointerDown(event: PointerEvent) {
		if (event.button !== 0) return;
		dragging = true;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		event.preventDefault();
	}
	function onPointerMove(event: PointerEvent) {
		if (dragging) setFromPointer(event.clientX);
	}
	function onPointerUp() {
		if (!dragging) return;
		dragging = false;
		save();
	}
	function onKeyDown(event: KeyboardEvent) {
		const step = event.shiftKey ? 10 : 2;
		let next: number | null = null;
		if (event.key === "ArrowLeft") {
			// Left never opens a collapsed list; Right and Enter do.
			if (collapsedNow) {
				event.preventDefault();
				return;
			}
			next = pct - step;
		} else if (event.key === "ArrowRight") next = pct + step;
		else if (event.key === "Home") next = lo;
		else if (event.key === "End") next = hi;
		else if (event.key === "Enter" && collapsible) {
			listCollapsed = !listCollapsed;
			event.preventDefault();
			return;
		} else return;
		event.preventDefault();
		if (collapsedNow) listCollapsed = false;
		pct = clamp(next);
		save();
	}

	// Focus: opening a thread in the stacked layout moves focus to the detail; closing puts it back on the row that opened it,
	// or else on the selected row, so keyboard users are never dropped on the page.
	const SELECTED = "[aria-current='true'], [data-selected]:not([data-selected='false'])";
	let opener: Element | null = null;
	let lastShowDetail = untrack(() => showDetail);
	$effect(() => {
		const open = showDetail;
		if (open === lastShowDetail) return;
		lastShowDetail = open;
		if (!narrow) {
			opener = null;
			return;
		}
		if (open) {
			opener = document.activeElement;
			queueMicrotask(() => detailEl?.focus());
		} else {
			const target =
				opener instanceof HTMLElement && opener.isConnected
					? opener
					: (listEl?.querySelector<HTMLElement>(SELECTED) ?? listEl);
			opener = null;
			queueMicrotask(() => target?.focus());
		}
	});

	// If the layout stacks mid-drag, or with focus in the list or on the handle, the pane the focus was in goes away.
	// Read where focus is just before the DOM changes (a pre effect), then put it where it can stay afterwards: on the
	// detail when a thread is open, else on the list.
	let focusBefore: { handle: boolean; inList: Element | null } = { handle: false, inList: null };
	$effect.pre(() => {
		void narrow;
		const active = document.activeElement;
		focusBefore = {
			handle: !!active && active === handleEl,
			inList: active && listEl?.contains(active) ? active : null,
		};
	});
	$effect(() => {
		if (!narrow) return;
		dragging = false;
		const before = focusBefore;
		focusBefore = { handle: false, inList: null };
		if (!before.handle && !before.inList) return;
		if (untrack(() => showDetail)) {
			if (before.inList) opener = before.inList;
			queueMicrotask(() => detailEl?.focus());
		} else {
			queueMicrotask(() => listEl?.focus());
		}
	});

	// Making the list inert while focus is inside it would drop focus to the page; move it to the handle first.
	$effect(() => {
		if (collapsedNow && listEl?.contains(document.activeElement)) handleEl?.focus();
	});
</script>

<div
	bind:this={ref}
	bind:clientWidth={width}
	data-slot="split-pane"
	data-layout={narrow ? "stacked" : "split"}
	class={cn("flex h-full min-h-0 w-full", dragging && "select-none", className)}
	{...restProps}
>
	<div
		bind:this={listEl}
		data-slot="split-pane-list"
		role="region"
		aria-label={listLabel}
		tabindex="-1"
		hidden={narrow && showDetail}
		inert={collapsedNow || undefined}
		aria-hidden={collapsedNow || undefined}
		class={cn("min-w-0 overflow-auto outline-none", narrow ? "flex-1" : "shrink-0")}
		style={narrow ? undefined : `width: ${collapsedNow ? 0 : clamp(pct)}%`}
	>
		{@render list({ narrow })}
	</div>
	{#if !narrow}
		<div
			bind:this={handleEl}
			data-slot="split-pane-handle"
			role="separator"
			aria-orientation="vertical"
			aria-label={handleLabel}
			aria-valuemin={collapsible ? 0 : Math.round(lo)}
			aria-valuemax={Math.round(hi)}
			aria-valuenow={collapsedNow ? 0 : Math.round(pct)}
			tabindex="0"
			class="relative w-px shrink-0 cursor-col-resize touch-none bg-border outline-hidden after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 hover:bg-ring/60 focus-visible:bg-ring focus-visible:ring-1 focus-visible:ring-ring data-[dragging]:bg-ring"
			data-dragging={dragging || undefined}
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
			onkeydown={onKeyDown}
			onlostpointercapture={onPointerUp}
		>
			<span
				aria-hidden="true"
				class="absolute top-1/2 left-1/2 z-10 h-6 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm border bg-border"
			></span>
		</div>
	{/if}
	<div
		bind:this={detailEl}
		data-slot="split-pane-detail"
		role="region"
		aria-label={detailLabel}
		tabindex="-1"
		hidden={narrow && !showDetail}
		class="flex min-w-0 flex-1 flex-col overflow-auto outline-none"
	>
		{#if showDetail}
			{@render detail({ narrow })}
		{:else if !narrow && empty}
			{@render empty()}
		{/if}
	</div>
</div>
