---
title: Loading
description: Skeletons drawn from your own component with Skullet, plus empty and error states, in one wrapper.
component: true
---

<script>
	import ComponentPreview from "$lib/components/component-preview.svelte";
	import ComponentSource from "$lib/components/component-source.svelte";
	import PMAddComp from "$lib/components/pm-add-comp.svelte";
	import PMInstall from "$lib/components/pm-install.svelte";
	import Steps from "$lib/components/steps.svelte";
	import InstallTabs from "$lib/components/install-tabs.svelte";
	import Step from "$lib/components/step.svelte";

	let { viewerData } = $props();
</script>

<ComponentPreview name="loading-demo">

<div></div>

</ComponentPreview>

## Source

A thin wrapper over [Skullet](https://skullet.lochie.me) (MIT). Skullet lays out your real component with sample data, unseen, and draws a bar for every line of text and a block for every control, so the skeleton takes exactly the space the content will and nothing jumps when data arrives. The wrapper adds Ledger styled empty and error states ([Empty](/docs/components/empty), [Alert](/docs/components/alert)) and the theme tokens.

## Installation

Install the tokens once, so Skullet picks up the Ledger colours (`--skullet-base` and `--skullet-highlight` are part of `ledger-tokens`):

```bash
npx shadcn-svelte@latest add ledger-tokens
```

<InstallTabs>
{#snippet cli()}
<PMAddComp name="loading" />
{/snippet}
{#snippet manual()}
<Steps>

<Step>

Install `skullet`:

</Step>

<PMInstall command="skullet" />

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
  import { Loading } from "$lib/components/ui/loading/index.js";
  import CompanyTable from "$lib/components/company-table.svelte"; // your own component

  let { data } = $props(); // SvelteKit load can return the promise unawaited
  const SAMPLE = Array.from({ length: 5 }, () => ({ name: "Company name", owner: "Owner Name" }));
</script>

<Loading data={data.companies} sample={SAMPLE} id="companies" label="Loading companies">
  {#snippet children(rows)}
    <CompanyTable {rows} />
  {/snippet}
</Loading>
```

`data` can be `null` or a promise. It loads until the promise settles, then shows the value, or the error state if it rejects. A rejection stays with that promise, so `onRetry` has to hand in a new one (in SvelteKit, call `invalidate` or `invalidateAll`). To drive it yourself, leave `data` out and pass `loading`.

## Props

| Prop                                | What it does                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `data`, `sample`                    | Loading while `data` is null, undefined or a pending promise. The skeleton is traced from `children` rendered with `sample`.              |
| `loading`                           | Shows the skeleton even over data, such as while refetching. Leave `data` out to use only this.            |
| `id`                                | Remembers the skeleton's shape across visits under this key.                                              |
| `label`                             | Read to screen readers while loading. Default "Loading".                                                  |
| `empty`, `emptyTitle`, `emptyDescription` | Shows the empty state instead of the content.                                                       |
| `error`, `errorTitle`, `onRetry`, `retryLabel` | Shows the error state instead of the content. `onRetry` adds a button.                         |
| `emptyMessage`, `errorMessage`, `skeleton` | Snippets that replace the default empty state, error state (gets the error) and skeleton.          |
| `onreveal`                          | Called once content has come in over a skeleton.                                                          |
| `class`                             | Passed to the wrapper.                                                                                    |

Write the `sample` once next to the component, with plausible text lengths: bars follow the text you give them. A custom `skeleton` snippet replaces both the traced skeleton and its screen reader label, so add your own hidden text there.
