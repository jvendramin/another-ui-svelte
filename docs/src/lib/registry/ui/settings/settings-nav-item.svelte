<script lang="ts">
	import * as Sidebar from "$lib/registry/ui/sidebar/index.js";
	import type { Snippet } from "svelte";

	let {
		href = "#",
		active = false,
		icon,
		sub,
		children,
	}: {
		href?: string;
		active?: boolean;
		/** An icon snippet, shown before the label. */
		icon?: Snippet;
		/** Nested items (SettingsNavSubItem), drawn under this item with a tree line. */
		sub?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<Sidebar.MenuItem data-slot="settings-nav-item">
	<Sidebar.MenuButton isActive={active}>
		{#snippet child({ props })}
			<a {href} aria-current={active ? "page" : undefined} {...props}>
				{@render icon?.()}
				<span>{@render children?.()}</span>
			</a>
		{/snippet}
	</Sidebar.MenuButton>
	{#if sub}
		<Sidebar.MenuSub>
			{@render sub()}
		</Sidebar.MenuSub>
	{/if}
</Sidebar.MenuItem>
