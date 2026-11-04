<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants/lite";

	// A small coloured dot for status: online, unread, failed. Colours are the chip ink tokens, so the dot follows the
	// theme and reads in dark mode. Pair it with text; the dot alone says nothing to a screen reader unless you pass `label`.
	export const statusDotVariants = tv({
		base: "cn-status-dot inline-block shrink-0 rounded-full align-middle forced-colors:bg-[CanvasText]",
		variants: {
			tone: {
				gray: "bg-[var(--ledger-chip-gray-ink)]",
				blue: "bg-[var(--ledger-chip-blue-ink)]",
				green: "bg-[var(--ledger-chip-green-ink)]",
				red: "bg-[var(--ledger-chip-red-ink)]",
				orange: "bg-[var(--ledger-chip-orange-ink)]",
				yellow: "bg-[var(--ledger-chip-yellow-ink)]",
				purple: "bg-[var(--ledger-chip-purple-ink)]",
				pink: "bg-[var(--ledger-chip-pink-ink)]",
				turquoise: "bg-[var(--ledger-chip-turquoise-ink)]",
			},
			size: {
				sm: "size-1.5",
				default: "size-2",
				lg: "size-2.5",
			},
		},
		defaultVariants: { tone: "gray", size: "default" },
	});

	export type StatusDotTone = VariantProps<typeof statusDotVariants>["tone"];
	export type StatusDotSize = VariantProps<typeof statusDotVariants>["size"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		tone = "gray",
		size = "default",
		label,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> & {
		tone?: StatusDotTone;
		size?: StatusDotSize;
		/** Text for screen readers, such as "Unread". Without it the dot is hidden from them. */
		label?: string;
	} = $props();
</script>

<span
	bind:this={ref}
	data-slot="status-dot"
	role={label ? "img" : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : true}
	class={cn(statusDotVariants({ tone, size }), className)}
	{...restProps}
></span>
