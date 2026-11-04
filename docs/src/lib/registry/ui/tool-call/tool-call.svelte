<script lang="ts" module>
	export type ToolStatus = "running" | "done" | "error";
</script>

<script lang="ts">
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import * as Collapsible from "$lib/registry/ui/collapsible/index.js";
	import { cn } from "$lib/utils.js";
	import type { Component, Snippet } from "svelte";
	import ToolChip from "./tool-chip.svelte";
	import ToolCallSection from "./tool-call-section.svelte";

	// What an agent did on the way to its answer, as a card: the chip is the header, and the input and output open
	// below it. Pass `children` to render the result yourself (a table or a card instead of JSON), `actions` for
	// extra controls such as Retry. Ported from the Another UI (React) Tool Call.
	let {
		name,
		status = "done",
		icon,
		duration,
		input,
		output,
		error,
		children,
		actions,
		open = $bindable(false),
		class: className,
	}: {
		name: string;
		status?: ToolStatus;
		icon?: Component<{ class?: string }>;
		duration?: number;
		input?: unknown;
		output?: unknown;
		/** An error message shown in place of the output. */
		error?: string;
		children?: Snippet;
		actions?: Snippet;
		open?: boolean;
		class?: string;
	} = $props();

	const hasBody = $derived(
		input !== undefined || output !== undefined || !!error || !!children || !!actions
	);
</script>

<Collapsible.Root
	bind:open
	data-slot="tool-call"
	data-status={status}
	class={cn(
		"group/tool w-full min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground data-[status=error]:border-destructive/30",
		className
	)}
>
	<Collapsible.Trigger
		disabled={!hasBody}
		class="flex w-full min-w-0 cursor-pointer items-center gap-1.5 px-3 py-2 text-left text-xs font-medium outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default disabled:hover:bg-transparent"
	>
		<ToolChip {name} {status} {icon} {duration} class="h-auto border-0 bg-transparent px-0" />
		{#if hasBody}
			<IconPlaceholder
				lucide="ChevronDownIcon"
				tabler="IconChevronDown"
				hugeicons="ArrowDown01Icon"
				phosphor="CaretDownIcon"
				remixicon="RiArrowDownSLine"
				class="ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/tool:-scale-y-100"
			/>
		{/if}
	</Collapsible.Trigger>
	{#if hasBody}
		<Collapsible.Content>
			<div class="flex min-w-0 flex-col gap-3 border-t px-3 py-3">
				{#if input !== undefined}<ToolCallSection label="Input" value={input} />{/if}
				{#if error}
					<p class="flex items-start gap-1.5 text-xs text-destructive">
						<IconPlaceholder
							lucide="AlertCircleIcon"
							tabler="IconAlertCircle"
							hugeicons="AlertCircleIcon"
							phosphor="WarningCircleIcon"
							remixicon="RiErrorWarningLine"
							class="mt-px size-4 shrink-0"
						/>
						<span>{error}</span>
					</p>
				{:else if children}
					<div class="min-w-0">{@render children()}</div>
				{:else if output !== undefined}
					<ToolCallSection label="Output" value={output} />
				{/if}
				{#if actions}<div class="flex items-center gap-2">{@render actions()}</div>{/if}
			</div>
		</Collapsible.Content>
	{/if}
</Collapsible.Root>
