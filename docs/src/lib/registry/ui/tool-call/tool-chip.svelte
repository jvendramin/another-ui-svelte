<script lang="ts">
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { cn } from "$lib/utils.js";
	import type { Component } from "svelte";
	import ToolStatusIcon from "./tool-status.svelte";
	import type { ToolStatus } from "./tool-call.svelte";

	// A compact, inline pill for one tool call: icon, name, how long it took and its state.
	let {
		name,
		status = "done",
		icon: Icon,
		duration,
		class: className,
	}: {
		name: string;
		status?: ToolStatus;
		icon?: Component<{ class?: string }>;
		/** Milliseconds. Hidden while the call is running. */
		duration?: number;
		class?: string;
	} = $props();

	const time = $derived(
		status === "running" || duration === undefined
			? null
			: duration < 1000
				? `${Math.round(duration)}ms`
				: `${(duration / 1000).toFixed(1)}s`
	);
</script>

<span
	data-slot="tool-chip"
	data-status={status}
	aria-label="{name}, {status}"
	class={cn(
		"inline-flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-full border bg-background px-2.5 text-xs font-medium text-foreground data-[status=error]:border-destructive/30 data-[status=error]:bg-destructive/5 data-[status=error]:text-destructive",
		className
	)}
>
	{#if Icon}
		<Icon class="size-4 shrink-0 text-muted-foreground" />
	{:else}
		<IconPlaceholder
			lucide="WrenchIcon"
			tabler="IconTool"
			hugeicons="Wrench01Icon"
			phosphor="WrenchIcon"
			remixicon="RiToolsLine"
			class="size-4 shrink-0 text-muted-foreground"
		/>
	{/if}
	<span class="min-w-0 truncate">{name}</span>
	{#if time}<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{time}</span>{/if}
	<ToolStatusIcon {status} />
</span>
