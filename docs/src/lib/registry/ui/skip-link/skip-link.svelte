<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	// The first Tab on a page. Hidden until focused, then a small pill in the top left corner; Enter moves focus past the
	// navigation to the main landmark. Behaviour follows the GOV.UK Design System skip link: the target gets focus
	// directly (tabindex -1 if it has none), so the next Tab lands on the page's own first control, and the page does
	// not jump when the target is already in view.
	let {
		ref = $bindable(null),
		href = "#main",
		class: className,
		onclick,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		/** The id of the main landmark, as a hash. */
		href?: string;
		children?: Snippet;
	} = $props();

	function skip(e: MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement }) {
		onclick?.(e);
		if (e.defaultPrevented) return;
		const id = href.startsWith("#") ? href.slice(1) : "";
		const target = id ? document.getElementById(id) : null;
		if (!target) return;
		e.preventDefault();
		// A target with no tabindex gets one for this focus only, and loses it on blur, so clicks inside main do not
		// move focus to the whole landmark afterwards (the GOV.UK behaviour).
		if (!target.hasAttribute("tabindex")) {
			target.setAttribute("tabindex", "-1");
			target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
		}
		target.focus();
	}
</script>

<a
	bind:this={ref}
	data-slot="skip-link"
	{href}
	onclick={skip}
	class={cn(
		"cn-skip-link sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-[8px] focus:bg-background focus:px-3 focus:py-2 focus:text-[13px]/[18px] focus:text-foreground focus:ring-2 focus:ring-ring focus:outline-none",
		className
	)}
	{...restProps}
>
	{#if children}{@render children()}{:else}Skip to content{/if}
</a>
