---
title: Thread row
description: One row of an inbox list with an avatar group, sender, subject, snippet, time, unread dot, labels and hover actions.
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

<ComponentPreview name="thread-row-demo">

<div></div>

</ComponentPreview>

## Source

Composed from [Avatar](/docs/components/avatar), [Badge](/docs/components/badge) and [Status dot](/docs/components/status-dot), laid out like the shadcn `mail` example's list item.

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="thread-row" />
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
  import { Button } from "$lib/components/ui/button/index.js";
  import { ThreadRow } from "$lib/components/ui/thread-row/index.js";

  let threads = $state([
    { id: "1", people: [{ name: "Priya Shah" }, { name: "Alex Moreau" }], subject: "Signage quote", snippet: "Attached is the revised quote.", time: "2:14 PM", unread: true },
  ]);
  let openId = $state("1");
  const archive = (id: string) => (threads = threads.filter((t) => t.id !== id));
</script>

{#each threads as thread (thread.id)}
  <ThreadRow
    {...thread}
    selected={openId === thread.id}
    href={`/inbox/${thread.id}`}
  >
    {#snippet actions()}
      <Button size="sm" variant="ghost" onclick={() => archive(thread.id)}>Archive</Button>
    {/snippet}
  </ThreadRow>
{/each}
```

## Props

| Prop                         | What it does                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `people`                     | `{ name, image? }[]`, newest first. Shown as an avatar group (up to `maxAvatars`, default 2, then "+N"). The first leads. |
| `subject`, `snippet`, `time` | Text. Format `time` yourself.                                                                                  |
| `unread`                     | Bold text and a blue dot.                                                                                      |
| `selected`                   | Highlights the row and sets `aria-current`.                                                                    |
| `count`                      | Message count, shown above 1.                                                                                  |
| `labels`                     | `{ text, tone? }[]` as tone badges.                                                                            |
| `href`, `onclick`            | With `href` the row is a link, otherwise a button.                                                             |
| `actions`                    | Snippet shown on hover and focus, beside the link rather than inside it. Not shown on touch, so give touch users another way to act. |
| `maxAvatars`                 | Avatars before the "+N" count. Default 2.                                                                      |
| `class`, `ref`, other props  | Passed to the row element.                                                                                     |
