---
title: AI assistant
description: A docked assistant panel, welcome prompts, a streaming thread, Approval Cards that pause the turn, a message toolbar and the Composer.
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

<ComponentPreview name="ai-assistant-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="ai-assistant" />
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
  import { AIAssistant } from "$lib/components/ui/ai-assistant/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  // Return the whole answer, or stream text deltas. Throw to show a failed turn with Retry.
  async function* reply(prompt, model, signal) {
    const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ prompt, model }), signal });
    const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      yield value;
    }
  }
</script>

<AIAssistant {reply} name="Alex">
  {#snippet trigger({ props })}<Button {...props} variant="outline">Assistant</Button>{/snippet}
</AIAssistant>
```

`reply(prompt, model, signal)` returns `{ text, approval? }`, a promise of it, or an async iterable of text deltas that fill the bubble as they arrive. `signal` aborts when the person presses Stop. An `approval` shows an Approval Card; the panel reports `onapprove` and never runs anything itself, so your app does the action. Bind `open` to open it from your own button or a shortcut.

## Props

| Prop        | What it does                                                         |
| ----------- | -------------------------------------------------------------------- |
| `open`      | Bindable.                                                            |
| `trigger`   | Snippet with `{ props }` for the button that opens the panel.       |
| `name`      | Shown in the greeting.                                               |
| `models`    | Choices in the model picker.                                        |
| `prompts`   | Welcome chips, `{ label, prompt? }[]`. Four show, the rest sit behind More. |
| `reply`     | Builds each answer, see above.                                       |
| `onapprove` | `(approval, { always }) => void`.                                    |

Composed from Sheet, Composer, Message, Bubble, Message Toolbar and Approval Card. Ported from the Another UI (React) AI Assistant. The React panel's attach button and shortcuts popover are not ported.
