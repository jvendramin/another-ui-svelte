---
title: Tool call
description: What an agent did on the way to its answer, an inline chip, a card that opens to the input and output, and a group that folds several calls behind one line.
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

<ComponentPreview name="tool-call-card-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="tool-call" />
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
  import { ToolCall, ToolCallGroup, ToolChip } from "$lib/components/ui/tool-call/index.js";
</script>

<ToolChip name="get_payouts" duration={420} />

<ToolCallGroup count={2} running={false} errors={1}>
  <ToolCall name="search_invoices" duration={640} input={{ status: "overdue" }} output={{ count: 3 }} />
  <ToolCall name="get_payouts" status="error" error="The payouts service timed out.">
    {#snippet actions()}<Button size="xs" onclick={retry}>Retry</Button>{/snippet}
  </ToolCall>
</ToolCallGroup>
```

`status` is `running`, `done` or `error`. A running call shows a spinner and hides its duration. Pass `children` to `ToolCall` to render the result yourself, for a table or a card instead of JSON. Svelte cannot read its children's props, so give `ToolCallGroup` the `count`, `running` and `errors` from the same list you render.

Ported from the Another UI (React) Tool Call. This is the card style; for the plain trace line see [Trace](/docs/components/trace).
