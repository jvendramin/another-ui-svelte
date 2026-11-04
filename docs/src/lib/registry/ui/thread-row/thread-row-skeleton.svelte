<script lang="ts">
	import { Skeleton } from "$lib/registry/ui/skeleton/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// The loading twin of ThreadRow: the same columns (unread dot, one avatar, text, a chips row), so the list does not
	// jump when rows load. It is hidden from screen readers; put aria-busy on the list that holds the rows.
	let {
		ref = $bindable(null),
		chips = 2,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** How many chips to draw on the third row. Default 2. */
		chips?: number;
	} = $props();

	const count = $derived(Number.isFinite(chips) ? Math.max(0, Math.floor(chips)) : 2);
</script>

<div
	bind:this={ref}
	data-slot="thread-row-skeleton"
	aria-hidden="true"
	class={cn("flex items-start gap-3 border-b px-3 py-2.5", className)}
	{...restProps}
>
	<div class="w-3 shrink-0"></div>
	<div class="w-6 shrink-0"><Skeleton class="size-6 rounded-full" /></div>
	<div class="min-w-0 flex-1">
		<!-- Each line is as tall as a text-sm line (h-5) so the row is as tall as a loaded ThreadRow. -->
		<div class="flex h-5 items-center gap-2">
			<Skeleton class="h-3.5 w-28 rounded" />
			<Skeleton class="ms-auto h-3 w-10 rounded" />
		</div>
		<div class="flex h-5 items-center"><Skeleton class="h-3.5 w-3/4 rounded" /></div>
		<div class="flex h-5 items-center"><Skeleton class="h-3.5 w-full rounded" /></div>
		{#if count > 0}
			<div class="mt-1.5 flex h-5 items-center gap-1">
				{#each { length: count } as _, i (i)}
					<Skeleton class="h-5 w-16 rounded-[4px]" />
				{/each}
			</div>
		{/if}
	</div>
</div>
