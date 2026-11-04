<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<main
	bind:this={ref}
	data-slot="settings-content"
	class="min-w-0 flex-1 overflow-y-auto"
	{...restProps}
>
	<div class={cn("mx-auto flex w-full max-w-[44rem] flex-col gap-8 px-6 py-6", className)}>
		{@render children?.()}
	</div>
</main>
