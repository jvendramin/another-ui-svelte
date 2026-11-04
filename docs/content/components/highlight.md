---
title: Highlight
description: Text with search terms marked. Matching ignores case and accents, and it never renders HTML.
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

<ComponentPreview name="highlight-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="highlight" />
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
  import { Highlight } from "$lib/components/ui/highlight/index.js";
</script>

<Highlight text={thread.subject} terms={query.split(/\s+/)} />
```

## Props

| Prop            | What it does                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `text`          | The text to show. It is rendered as text, never as HTML.                                               |
| `terms`         | Words or fragments to mark. Substring match, case and accent insensitive. Blank terms are ignored.     |
| `class`, `ref`  | Passed to the wrapping span.                                                                           |

`highlightSegments(text, terms)` is exported if you need the split without the component. `ThreadRow` takes a `highlight` prop and passes it here.
