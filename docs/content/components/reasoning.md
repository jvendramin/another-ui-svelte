---
title: Reasoning
description: The thinking trace above an AI answer, a shimmering label and timer while it streams, then Thought for 12s, with a list of steps joined by a line.
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

<ComponentPreview name="reasoning-steps-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="reasoning" />
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
  import { Reasoning } from "$lib/components/ui/reasoning/index.js";
</script>

<Reasoning
  streaming={turn.thinking}
  duration={turn.thinkingMs}
  steps={[
    { id: "s1", kind: "think", title: "Working out what counts as overdue", status: "done" },
    { id: "s2", kind: "search", title: "Searching invoices", detail: "Found 3 of 14", status: "running" },
  ]}
/>
```

It opens when `streaming` starts and folds away when it ends (turn off with `autoOpen` and `autoClose`). While streaming it times itself; pass `duration` in milliseconds once you know it. Step `kind` is `think`, `search`, `read`, `code` or `tool`, and `status` is `pending`, `running`, `done` or `error`. Steps can carry `sources` as small links.

Ported from the Another UI (React) Reasoning. For a lighter, message-by-message version built on `Trace`, see the AI Elements examples.
