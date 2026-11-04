<script lang="ts">
	import * as Field from "$lib/registry/ui/field/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		title,
		description,
		actions,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLFieldSetElement>> & {
		title: string;
		description?: string;
		/** Controls placed at the end of the header, for example an Add button. */
		actions?: Snippet;
	} = $props();
</script>

<Field.Set bind:ref data-slot="settings-section" class={cn("gap-3", className)} {...restProps}>
	<div class="flex items-start justify-between gap-4">
		<div class="flex min-w-0 flex-col gap-1">
			<Field.Legend variant="label" class="mb-0">{title}</Field.Legend>
			{#if description}
				<Field.Description>{description}</Field.Description>
			{/if}
		</div>
		{#if actions}
			<div class="shrink-0">{@render actions()}</div>
		{/if}
	</div>
	{@render children?.()}
</Field.Set>
