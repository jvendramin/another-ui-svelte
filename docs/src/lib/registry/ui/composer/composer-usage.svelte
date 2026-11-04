<script lang="ts">
	import { Progress } from "$lib/registry/ui/progress/index.js";
	import { cn } from "$lib/utils.js";

	// Credits or usage left, as a meter that warns when it runs low.
	let {
		used,
		total,
		label = "credits left",
		warnAt = 0.1,
		class: className,
	}: {
		used: number;
		total: number;
		label?: string;
		/** Fraction remaining at which the meter turns to a warning. */
		warnAt?: number;
		class?: string;
	} = $props();

	const left = $derived(Math.max(0, total - used));
	const low = $derived(left / total <= warnAt);
</script>

<div
	data-slot="composer-usage"
	data-low={low ? "" : undefined}
	class={cn(
		"flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground",
		className
	)}
>
	<Progress
		value={(left / total) * 100}
		aria-label="{left} {label}"
		class={cn("h-1 w-12", low && "[&>[data-slot=progress-indicator]]:bg-destructive")}
	/>
	<span class={cn("tabular-nums", low && "text-destructive")}>
		{left.toLocaleString()}<span class="hidden sm:inline"> of {total.toLocaleString()}</span>
		{label}
	</span>
</div>
