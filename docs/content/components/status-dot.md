---
title: Status dot
description: A small coloured dot for status, such as online, unread or failed. It uses the chip tones, so it follows the theme.
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

<ComponentPreview name="status-dot-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="status-dot" />
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
  import { StatusDot } from "$lib/components/ui/status-dot/index.js";
</script>

<StatusDot tone="green" label="Online" />
```

## Props

| Prop    | What it does                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------ |
| `tone`  | `gray` (default), `blue`, `green`, `red`, `orange`, `yellow`, `purple`, `pink` or `turquoise`.          |
| `size`  | `sm`, `default` or `lg`.                                                                               |
| `label` | Text for screen readers. Without it the dot is hidden from them, so put the meaning in nearby text. |

Avatar groups, tone badges (chips and tags) and the avatar badge already exist in [Avatar](/docs/components/avatar) and [Badge](/docs/components/badge).
