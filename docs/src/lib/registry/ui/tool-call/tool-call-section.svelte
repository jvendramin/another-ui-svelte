<script lang="ts">
	import { CopyButton } from "$lib/registry/ui/code-block/index.js";
	import { cn } from "$lib/utils.js";

	// A labelled block of formatted JSON or text, with a copy button.
	let { label, value, class: className }: { label: string; value: unknown; class?: string } = $props();

	const text = $derived.by(() => {
		if (typeof value === "string") return value;
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	});
</script>

<div data-slot="tool-call-section" class={cn("flex min-w-0 flex-col gap-1", className)}>
	<div class="flex items-center justify-between gap-2">
		<span class="text-xs font-medium text-muted-foreground">{label}</span>
		<CopyButton value={text} aria-label="Copy {label.toLowerCase()}" />
	</div>
	<pre
		class="max-h-48 overflow-auto rounded-md bg-muted/60 p-2.5 font-mono text-xs leading-relaxed whitespace-pre">{text}</pre>
</div>
