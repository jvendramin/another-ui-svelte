---
title: Message toolbar
description: A dark pill of icon buttons under a message bubble, Improve, Edit, Retry and Copy. It shows on hover and focus, and always on touch screens.
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

<ComponentPreview name="message-toolbar-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="message-toolbar" />
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

Place it inside a [Message](/docs/components/message), which is already `relative` and `group/message`, and position it with `class`.

```svelte
<Tooltip.Provider>
  <Message.Root align="end">
    <Message.Content>...</Message.Content>
    <MessageToolbar text={message.text} onedit={edit} onretry={retry} class="right-0" />
  </Message.Root>
</Tooltip.Provider>
```

Improve, Edit and Retry only appear when you pass a handler, so the pill never shows a button that does nothing. Copy is the [Code Block](/docs/components/code-block) copy button, so it behaves like the other copy buttons. Leave room under the message (the demo uses `pb-10`) for the pill.

## Props

| Prop        | What it does                          |
| ----------- | ------------------------------------- |
| `text`      | The text the Copy button copies.      |
| `onimprove` | Adds an Improve button.               |
| `onedit`    | Adds an Edit button.                  |
| `onretry`   | Adds a Retry button.                  |
| `class`     | Position it, for example `right-0`.   |

Ported from the Another UI (React) Message Toolbar.
