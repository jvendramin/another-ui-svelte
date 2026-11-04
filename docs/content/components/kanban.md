---
title: Kanban
description: Columns of cards you drag between stages, for deals or tasks. Mouse, touch and keyboard. A count per column and an inline Add row.
component: true
---

<script>
	import ComponentPreview from "$lib/components/component-preview.svelte";
	import ComponentSource from "$lib/components/component-source.svelte";
	import PMAddComp from "$lib/components/pm-add-comp.svelte";
	import PMInstall from "$lib/components/pm-install.svelte";
	import Steps from "$lib/components/steps.svelte";
	import InstallTabs from "$lib/components/install-tabs.svelte";

	let { viewerData } = $props();
	import Step from "$lib/components/step.svelte";
</script>

<ComponentPreview name="kanban-demo">

<div></div>

</ComponentPreview>

## Source

Ported from [svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action) (MIT), one drop zone per column, so cards move within a column and between columns. The look follows Twenty: grey columns with a tone badge and a count, small white cards, an Add row at the bottom.

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="kanban" />
{/snippet}
{#snippet manual()}
<Steps>

<Step>

Install the drag and drop package:

<PMInstall command="svelte-dnd-action" />

</Step>

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
  import {
    Kanban,
    applyKanbanMove,
    type KanbanMove,
  } from "$lib/components/ui/kanban/index.js";

  let deals = $state([{ id: "d1", title: "Website rebuild", stage: "lead" }]);
  const columns = [
    { id: "lead", title: "Lead", tone: "gray" },
    { id: "won", title: "Won", tone: "green" },
  ];

  async function onMove(move: KanbanMove) {
    const before = deals;
    deals = applyKanbanMove(deals, move, {
      getColumn: (d) => d.stage,
      setColumn: (d, stage) => ({ ...d, stage }),
    });
    try {
      await saveStage(move.id, move.to);
    } catch (e) {
      deals = before;
      throw e;
    }
  }
</script>

<Kanban {columns} items={deals} getColumn={(d) => d.stage} {onMove}>
  {#snippet card({ item })}
    <a href="/deals/{item.id}">{item.title}</a>
  {/snippet}
</Kanban>
```

## Props

| Prop                 | What it does                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`            | `{ id, title, tone? }` per column. `tone` is a Badge tone.                                                                                                                                                                                                                                                                                                  |
| `items`, `getColumn` | The cards in order and the column id of each. Cards show in each column in the order of `items`.                                                                                                                                                                                                                                                            |
| `card`               | A snippet receiving `{ item }`. Put a link or button in it so keyboard users can open the record.                                                                                                                                                                                                                                                           |
| `onMove`             | Called once when a card is dropped somewhere new, with `{ id, from, to, index, order }`. Update your list with `applyKanbanMove`, save, and throw to reject: the cards snap back and `onMoveError(error, move)` is called, where you show a message.                                                                                                        |
| `onCardClick`        | Called on a click that was not a drag.                                                                                                                                                                                                                                                                                                                      |
| `onCreate`           | Shows an Add row under each column. Called with the column id and the typed text (if it throws the text is kept and the input is marked invalid); Enter saves and keeps the input open, Escape discards the text and closes it. Each column keeps its own unsent text if you switch to another column. `createLabel` and `createPlaceholder` set the texts. |

Keyboard: Tab to a card, Space or Enter to pick it up, arrow keys to reorder it in its column, Tab to move it to the next column (Shift+Tab for the previous), Space to drop. On a phone the columns scroll sideways and snap; touch drag starts after a short press, so a swipe still scrolls.

## Not in this version

Swimlanes, column reorder, per column limits and collapsing a column are not included.
