<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// A row above the composer for a heading, context or chips.
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="composer-header"
	class={cn("flex min-w-0 items-center gap-2 px-3 pb-2 text-sm", className)}
	{...restProps}
>
	{@render children?.()}
</div>
