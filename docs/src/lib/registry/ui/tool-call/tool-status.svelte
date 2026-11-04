<script lang="ts">
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { Spinner } from "$lib/registry/ui/spinner/index.js";
	import type { ToolStatus } from "./tool-call.svelte";

	let { status }: { status: ToolStatus } = $props();
</script>

<span data-slot="tool-status" class="flex size-4 shrink-0 items-center justify-center">
	{#if status === "running"}
		<Spinner class="size-3.5" />
	{:else if status === "done"}
		<IconPlaceholder
			lucide="CheckIcon"
			tabler="IconCheck"
			hugeicons="Tick02Icon"
			phosphor="CheckIcon"
			remixicon="RiCheckLine"
			class="size-3.5 text-muted-foreground"
		/>
	{:else}
		<IconPlaceholder
			lucide="AlertCircleIcon"
			tabler="IconAlertCircle"
			hugeicons="AlertCircleIcon"
			phosphor="WarningCircleIcon"
			remixicon="RiErrorWarningLine"
			class="size-4 text-destructive"
		/>
	{/if}
</span>
