<script lang="ts">
	import { Skeleton } from "$lib/registry/ui/skeleton/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// The loading twin of ThreadRow: the same columns (unread dot, avatars, text), so the list does not jump when rows load.
	// It is hidden from screen readers; put aria-busy on the list that holds the rows.
	let {
		ref = $bindable(null),
		avatars = 2,
		withLabels = false,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** How many avatar circles to draw. Default 2, the same as ThreadRow's default. */
		avatars?: number;
		/** Draw a label chip under the snippet. */
		withLabels?: boolean;
	} = $props();

	const count = $derived(Number.isFinite(avatars) ? Math.max(1, Math.floor(avatars)) : 2);
	const width = $derived(`${count * 1.5 - (count - 1) * 0.25}rem`);
</script>

<div
	bind:this={ref}
	data-slot="thread-row-skeleton"
	aria-hidden="true"
	class={cn("flex items-start gap-3 border-b px-3 py-2.5", className)}
	{...restProps}
>
	<div class="w-3 shrink-0"></div>
	<div class="flex shrink-0 -space-x-1" style="width: {width}">
		{#each { length: count } as _, i (i)}
			<Skeleton class="size-6 rounded-full ring-2 ring-background" style="z-index: {count - i}" />
		{/each}
	</div>
	<div class="min-w-0 flex-1">
		<!-- Each line is as tall as a text-sm line (h-5) so the row is as tall as a loaded ThreadRow. -->
		<div class="flex h-5 items-center gap-2">
			<Skeleton class="h-3.5 w-28 rounded" />
			<Skeleton class="ms-auto h-3 w-10 rounded" />
		</div>
		<div class="flex h-5 items-center"><Skeleton class="h-3.5 w-3/4 rounded" /></div>
		<div class="flex h-5 items-center"><Skeleton class="h-3.5 w-full rounded" /></div>
		{#if withLabels}
			<div class="mt-1 flex h-[18px] items-center"><Skeleton class="h-3.5 w-14 rounded-full" /></div>
		{/if}
	</div>
</div>
