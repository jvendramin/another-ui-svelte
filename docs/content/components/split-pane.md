---
title: Split pane
description: A list beside a detail pane, resizable, with a stacked one-column layout on narrow screens.
component: true
---

<script>
	import ComponentPreview from "$lib/components/component-preview.svelte";
	import ComponentSource from "$lib/components/component-source.svelte";
	import PMAddComp from "$lib/components/pm-add-comp.svelte";
	import Steps from "$lib/components/steps.svelte";
	import InstallTabs from "$lib/components/install-tabs.svelte";
	import Step from "$lib/components/step.svelte";

	let { viewerData } = $props();
</script>

<ComponentPreview name="split-pane-demo">

<div></div>

</ComponentPreview>

## Source

Composed from [Resizable](/docs/components/resizable) (Paneforge), the same split the shadcn `mail` example uses for its list and thread.

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="split-pane" />
{/snippet}
{#snippet manual()}
<Steps>

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
  import { SplitPane } from "$lib/components/ui/split-pane/index.js";
  let openId = $state("");
</script>

<div class="h-[600px]">
  <SplitPane showDetail={openId !== ""} autoSaveId="inbox-split">
    {#snippet list()}
      <!-- thread rows -->
    {/snippet}
    {#snippet detail({ narrow, back })}
      {#if narrow}<Button onclick={() => { back(); openId = ""; }}>Back</Button>{/if}
      <!-- the open thread -->
    {/snippet}
    {#snippet empty()}Select a thread{/snippet}
  </SplitPane>
</div>
```

The pane fills its parent's height, so give the parent one.

## Props

| Prop                                 | What it does                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `list`, `detail`, `empty`            | Snippets. `detail` gets `{ narrow, back }`. `empty` shows in the wide detail pane while `showDetail` is false.      |
| `showDetail`                         | Whether an item is open. In the stacked layout it picks the detail over the list. Bindable.                          |
| `listSize`, `minListSize`, `maxListSize` | The list width as a percent of the whole. Defaults 35, 22 and 60.                                                |
| `collapsible`, `listCollapsed`       | Let the list be dragged shut or closed from your own button. `listCollapsed` is bindable. Wide layout only.          |
| `stackBelow`                         | Width in px below which the panes stack. Default 640. Measured on the pane itself, not the window.                   |
| `autoSaveId`                         | Saves the dragged width in localStorage under this id.                                                               |
| `listLabel`, `detailLabel`           | Names of the two regions for screen readers.                                                                         |
| `class`, `ref`, ...                  | Passed to the root element.                                                                                          |

In the stacked layout the handle and `collapsible` do nothing, and your detail snippet needs its own back button that calls `back`.
