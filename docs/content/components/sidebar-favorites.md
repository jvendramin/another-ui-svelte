---
title: Sidebar favorites
description: The Favorites group of an app sidebar. Links and folders with counts, reordered by drag or keyboard.
component: true
---

<script>
	import ComponentPreview from "$lib/components/component-preview.svelte";
	import ComponentSource from "$lib/components/component-source.svelte";
	import PMAddComp from "$lib/components/pm-add-comp.svelte";
	import PMInstall from "$lib/components/pm-install.svelte";
	import Steps from "$lib/components/steps.svelte";
	import InstallTabs from "$lib/components/install-tabs.svelte";
	import Step from "$lib/components/step.svelte";

	let { viewerData } = $props();
</script>

<ComponentPreview name="favorites-demo">

<div></div>

</ComponentPreview>

## Source

Composed from the [Sidebar](/docs/components/sidebar) parts and [Collapsible](/docs/components/collapsible). Dragging is [svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action) (MIT), the same library as [Kanban](/docs/components/kanban). Folders are one level deep. A folder dropped into another folder lands at the top level, right after it.

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="sidebar-favorites" />
{/snippet}
{#snippet manual()}
<Steps>

<Step>

Install `svelte-dnd-action`:

</Step>

<PMInstall command="svelte-dnd-action" />

<Step>

Copy and paste the following code into your project.

</Step>
{#if viewerData}
	<ComponentSource item={viewerData} data-llm-ignore/>
{/if}

</Steps>
{/snippet}
</InstallTabs>

## Usage

```svelte
<script lang="ts">
  import { page } from "$app/state";
  import BuildingIcon from "@lucide/svelte/icons/building-2";
  import UserIcon from "@lucide/svelte/icons/user";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import {
    SidebarFavorites,
    type FavoriteItem,
    type FavoriteMove,
  } from "$lib/components/ui/sidebar-favorites/index.js";

  let items = $state<FavoriteItem[]>([
    { id: "acme", label: "Acme Signs", href: "/companies/acme", icon: BuildingIcon },
    { id: "clients", label: "Clients", children: [
      { id: "priya", label: "Priya Shah", href: "/people/priya", icon: UserIcon, count: 2 },
    ] },
  ]);

  async function onMove(move: FavoriteMove) {
    await saveFavorites(move.items); // throw to put the rows back. Saves are not queued: finish one before the next.
    items = move.items;
  }
</script>

<Sidebar.Content>
  <SidebarFavorites {items} {onMove} activeHref={page.url.pathname} />
</Sidebar.Content>
```

## Props

| Prop                   | What it does                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `items`                | `{ id, label, href?, icon?, count?, children? }[]`. `icon` is a component. `children` makes the row a folder.                |
| `activeHref`           | The row whose `href` equals this is marked active.                                                                           |
| `onMove`               | Called when a row lands somewhere new, with `{ id, from, to, index, order, items }`. `items` is your current `items` with the move applied, so changes you made during the drag are kept. Throw to reject; the rows snap back. |
| `onMoveError`          | Called with the error when `onMove` throws.                                                                                  |
| `label`, `class`       | The group label (default "Favorites") and a class for the group.                                                             |

You own `items`: update it from `onMove`. Rows without an `href` render as buttons. In the icon-only rail (`collapsible="icon"`) rows show a tooltip, but folders' children are hidden by the Sidebar, so use the default or offcanvas mode where folders matter. Keyboard: Tab to the row itself (the list item, which comes before its link), press Space to pick it up, the arrow keys to move it, Space to drop it and Escape to cancel (svelte-dnd-action's keyboard drag).
