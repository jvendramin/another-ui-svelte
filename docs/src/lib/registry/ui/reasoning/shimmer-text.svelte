<script lang="ts">
	import { onMount } from "svelte";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// A label with a highlight band sweeping across it. Still when motion is reduced.
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();

	onMount(() => {
		const el = ref;
		if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const animation = el.animate(
			[{ backgroundPosition: "100% 0" }, { backgroundPosition: "-100% 0" }],
			{ duration: 1800, iterations: Infinity, easing: "linear" }
		);
		return () => animation.cancel();
	});
</script>

<span
	bind:this={ref}
	data-slot="reasoning-shimmer"
	class={cn(
		"bg-[linear-gradient(90deg,var(--muted-foreground)_0%,var(--muted-foreground)_40%,var(--foreground)_50%,var(--muted-foreground)_60%,var(--muted-foreground)_100%)] bg-size-[200%_100%] bg-clip-text text-transparent forced-colors:bg-none forced-colors:text-[CanvasText]",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
