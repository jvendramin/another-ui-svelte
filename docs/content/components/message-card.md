---
title: Message card
description: One message in an email thread, with a header that opens and closes it, a folded quoted-text area and a footer for attachments.
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

<ComponentPreview name="message-card-demo">

<div></div>

</ComponentPreview>

## Source

Composed from [Avatar](/docs/components/avatar) and [Collapsible](/docs/components/collapsible). The body is yours to render; sanitise HTML before it reaches the card.

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="message-card" />
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
  import { MessageCard } from "$lib/components/ui/message-card/index.js";
  let open = $state(true);
  let showQuoted = $state(false); // keep this per message in your inbox state
</script>

<MessageCard
  bind:open
  from="Alex Moreau"
  fromAddress="alex@example.com"
  bind:showQuoted
  to="to Priya Shah"
  time="Nov 4, 2:14 PM"
  preview="Attached is the revised quote."
>
  <p>Attached is the revised quote.</p>
  {#snippet quoted()}<p>On Nov 3, Priya wrote: ...</p>{/snippet}
</MessageCard>
```

## Props

| Prop                | What it does                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `from`, `fromAddress`, `avatar` | Sender as a plain string, an optional address (shown from the `@md` container width up) and an avatar image URL. |
| `to`, `time`        | Plain text under and beside the sender, such as "to me, a@x.example, b@y.example". Format them yourself. |
| `open`              | Whether the body shows. Bindable, default true. The header toggles it.                          |
| `preview`           | One line shown instead of the body while closed.                                                |
| `attachments`       | Number of attachments. Shows a paperclip, and the count above 1, beside the time. The `footer` snippet is for the attachments row itself. |
| `unread`            | Bold sender.                                                                                    |
| `quotedLabel`       | Screen reader name of the quoted-text button. It reads with `aria-expanded`, so keep it neutral. Default "Quoted text". |
| `actions`           | Header buttons, beside the toggle rather than inside it.                                        |
| `quoted`, `showQuoted` | Snippet folded behind a "..." button. `showQuoted` is bindable so the parent owns the toggle. |
| `footer`            | Snippet below the body for attachments.                                                         |
| `class`, `ref`, ... | Passed to the card element.                                                                     |
