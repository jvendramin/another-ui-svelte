---
title: Approval card
description: The agent stops and asks before it acts, what will happen, how risky it is, and Approve, Deny or Edit. A decision folds to a one line receipt.
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

<ComponentPreview name="approval-card-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="approval-card" />
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
  import { ApprovalCard } from "$lib/components/ui/approval-card/index.js";
</script>

<ApprovalCard
  title="Refund $1,250.00 to Northwind"
  reason="Their card was charged twice."
  risk="medium"
  details={[{ label: "Method", value: "Visa ending 4417" }]}
  expiresIn={120}
  onapprove={({ always }) => run({ always })}
  ondeny={({ expired }) => cancel(expired)}
/>
```

Cmd or Ctrl plus Enter approves and Escape denies while the card has focus. A denial can be undone for five seconds. `expiresIn` counts down and denies on its own; the countdown pauses while the person edits. The card never acts by itself, it only reports the decision.

## Props

| Prop         | What it does                                                          |
| ------------ | --------------------------------------------------------------------- |
| `title`      | What will happen, in one line.                                        |
| `reason`     | Why the agent wants to do it.                                         |
| `risk`       | `low`, `medium` or `high`. High tints the icon and the ring.          |
| `details`    | `{ label, value }[]` shown as a grid.                                 |
| `children`   | Extra preview under the details, such as a diff.                      |
| `editable`   | Snippet with `{ close }`. Adds an Edit button that shows it.          |
| `expiresIn`  | Seconds before it expires.                                            |
| `allowAlways`| Show the "Always allow this action" checkbox. Default true.          |
| `actor`      | Who decided, for the receipt. Default "you".                          |
| `onapprove`  | `({ always }) => void`.                                               |
| `ondeny`     | `({ expired }) => void`.                                              |
| `onundo`     | Called when a denial is undone.                                       |

Composed from Card, Badge, Button, Checkbox, Label, Kbd and Progress. Ported from the Another UI (React) Approval Card.
