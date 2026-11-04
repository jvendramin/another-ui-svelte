---
title: Composer
description: The text box at the bottom of an AI chat, a growing textarea, a model picker, voice dictation and send that turns into stop while a reply streams.
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

<ComponentPreview name="composer-demo">

<div></div>

</ComponentPreview>

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="composer" />
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
  import { Composer, ComposerFooter, ComposerUsage } from "$lib/components/ui/composer/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";

  const models = [
    { id: "sonnet", label: "Sonnet 5.5", description: "Fast and smart for everyday work" },
  ];
  let busy = $state(false);
</script>

<Tooltip.Provider>
  <Composer {models} {busy} onsubmit={(text, model) => send(text, model)} onstop={() => abort()} />
  <ComposerFooter><ComposerUsage used={820} total={1000} /></ComposerFooter>
</Tooltip.Provider>
```

Enter sends and Shift+Enter adds a line. While `busy` is true the send button becomes Stop and calls `onstop`. Dictation uses the browser's speech recognition and is disabled, with a tooltip, where there is none.

## Props

| Prop          | What it does                                                          |
| ------------- | --------------------------------------------------------------------- |
| `value`       | Bindable text.                                                        |
| `models`      | `{ id, label, description?, icon?, badge? }[]`. Hides the picker when empty. |
| `model`       | Bindable selected model id. Defaults to the first model.             |
| `busy`        | Turns send into stop.                                                 |
| `maxRows`     | How tall the textarea grows before it scrolls. Default 8.            |
| `onsubmit`    | `(text, modelId) => void`. The text is trimmed and the box is cleared. |
| `onstop`      | Called when Stop is pressed.                                          |

`ComposerHeader` and `ComposerFooter` are plain rows above and below the box. `ComposerUsage` shows credits left as a meter that turns red under `warnAt` (default 10 percent).

Ported from the Another UI (React) Composer. The React version also plays interaction sounds; this one does not.
