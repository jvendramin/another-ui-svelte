<script lang="ts">
	import * as Item from "$lib/registry/ui/item/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// A label and a description on the left, a control on the right, built from Item.
	let {
		ref = $bindable(null),
		class: className,
		title,
		description,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		title: string;
		description?: string;
	} = $props();
</script>

<Item.Root bind:ref data-slot="settings-row" size="sm" class={cn("px-0", className)} {...restProps}>
	<Item.Content>
		<Item.Title>{title}</Item.Title>
		{#if description}
			<Item.Description>{description}</Item.Description>
		{/if}
	</Item.Content>
	<Item.Actions>
		{@render children?.()}
	</Item.Actions>
</Item.Root>
