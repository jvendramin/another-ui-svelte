<script lang="ts">
	import * as Sidebar from "$lib/registry/ui/sidebar/index.js";
	import type { Snippet } from "svelte";

	let {
		href = "#",
		active = false,
		icon,
		children,
	}: {
		href?: string;
		active?: boolean;
		icon?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<Sidebar.MenuSubItem data-slot="settings-nav-sub-item">
	<Sidebar.MenuSubButton isActive={active}>
		{#snippet child({ props })}
			<a {href} aria-current={active ? "page" : undefined} {...props}>
				{@render icon?.()}
				<span>{@render children?.()}</span>
			</a>
		{/snippet}
	</Sidebar.MenuSubButton>
</Sidebar.MenuSubItem>
