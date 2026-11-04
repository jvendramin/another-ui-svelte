---
title: Skip link
description: The first Tab on a page. Hidden until focused, it moves keyboard focus past the navigation to the main landmark.
component: true
---

<script>
	import ComponentPreview from "$lib/components/component-preview.svelte";
	import ComponentSource from "$lib/components/component-source.svelte";
	import PMAddComp from "$lib/components/pm-add-comp.svelte";
	import Steps from "$lib/components/steps.svelte";
	import InstallTabs from "$lib/components/install-tabs.svelte";

	let { viewerData } = $props();
	import Step from "$lib/components/step.svelte";
</script>

<ComponentPreview name="skip-link-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="skip-link" />
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

Put it first in the app layout, before the sidebar, and give the main landmark the id it points at.

```svelte
<script lang="ts">
  import { SkipLink } from "$lib/components/ui/skip-link/index.js";
</script>

<SkipLink />
<Sidebar.Provider>
  <Sidebar.Root>...</Sidebar.Root>
  <Sidebar.Inset id="main" class="focus:outline-none">...</Sidebar.Inset>
</Sidebar.Provider>
```

## Props

| Prop       | What it does                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `href`     | The main landmark's id as a hash. Default `#main`.                                              |
| `children` | The link text. Default "Skip to content".                                                       |
| `class`    | Merged with the defaults. The pill is `focus:fixed` top left; pass `focus:absolute` to keep it inside a positioned container, as the demo does. |
| `ref`      | Bindable; the anchor element.                                                                    |
| `onclick`  | Runs first. Call `preventDefault()` in it to stop the focus move.                                |

On Enter the target itself gets focus. A target with no `tabindex` is given `-1` for that focus only and loses it on blur, so later clicks inside the content do not focus the whole landmark. The next Tab lands on the page's own first control instead of going back through the navigation. The behaviour follows the GOV.UK Design System skip link; the look is the Ledger focus pill.
