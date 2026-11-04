<script lang="ts">
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { Button } from "$lib/registry/ui/button/index.js";
	import { CopyButton } from "$lib/registry/ui/code-block/index.js";
	import * as Tooltip from "$lib/registry/ui/tooltip/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// A dark pill of icon buttons that floats under a message bubble. It fades in when the message is hovered or has
	// focus inside it, and stays visible on touch screens, where there is no hover. Put it inside a relative container
	// with the `group/message` class (Message already has both) and position it with `class`, for example `right-0`
	// for a message on the right. Wrap it in a Tooltip.Provider (the page usually has one). Improve, Edit and Retry
	// only appear when you pass a handler, so the pill never shows a button that does nothing. Ported from the Another
	// UI (React) Message Toolbar.
	let {
		ref = $bindable(null),
		text,
		onimprove,
		onedit,
		onretry,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** The message text, copied by the Copy button. */
		text: string;
		onimprove?: () => void;
		onedit?: () => void;
		onretry?: () => void;
	} = $props();

	const iconButton =
		"rounded-full text-background! hover:bg-background/15 hover:text-background! focus-visible:ring-background/50 [&_svg]:size-4";
</script>

{#snippet action(label: string, onclick: () => void, icon: import("svelte").Snippet)}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					type="button"
					variant="ghost"
					size="icon-xs"
					aria-label={label}
					{onclick}
					class={iconButton}
				>
					{@render icon()}
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom">{label}</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

<div
	bind:this={ref}
	data-slot="message-toolbar"
	role="group"
	aria-label="Message actions"
	class={cn(
		"pointer-events-none absolute top-full z-10 mt-1 flex items-center gap-0.5 rounded-full bg-foreground p-1 text-background opacity-0 shadow-md transition-opacity group-focus-within/message:pointer-events-auto group-focus-within/message:opacity-100 group-hover/message:pointer-events-auto group-hover/message:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 motion-reduce:transition-none [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
		className
	)}
	{...restProps}
>
	{#snippet improveIcon()}
		<IconPlaceholder
			lucide="SparklesIcon"
			tabler="IconSparkles"
			hugeicons="SparklesIcon"
			phosphor="SparkleIcon"
			remixicon="RiSparklingLine"
		/>
	{/snippet}
	{#snippet editIcon()}
		<IconPlaceholder
			lucide="PencilIcon"
			tabler="IconPencil"
			hugeicons="PencilEdit01Icon"
			phosphor="PencilSimpleIcon"
			remixicon="RiPencilLine"
		/>
	{/snippet}
	{#snippet retryIcon()}
		<IconPlaceholder
			lucide="RefreshCwIcon"
			tabler="IconRefresh"
			hugeicons="RefreshIcon"
			phosphor="ArrowsClockwiseIcon"
			remixicon="RiRefreshLine"
		/>
	{/snippet}
	{#if onimprove}{@render action("Improve", onimprove, improveIcon)}{/if}
	{#if onedit}{@render action("Edit", onedit, editIcon)}{/if}
	{#if onretry}{@render action("Retry", onretry, retryIcon)}{/if}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<CopyButton {...props} value={text} aria-label="Copy" class={iconButton} />
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom">Copy</Tooltip.Content>
	</Tooltip.Root>
</div>
