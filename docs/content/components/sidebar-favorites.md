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
    await saveFavorites(move.items); // throw to put the rows back
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
| `onMove`               | Called when a row lands somewhere new, with `{ id, from, to, index, order, items }`. `items` is the whole list after the move. Throw to reject; the rows snap back. |
| `onMoveError`          | Called with the error when `onMove` throws.                                                                                  |
| `label`, `class`       | The group label (default "Favorites") and a class for the group.                                                             |

You own `items`: update it from `onMove`. Keyboard: focus a row, press Space to pick it up, the arrow keys to move it, Space to drop it and Escape to cancel (svelte-dnd-action's keyboard drag).
