---
title: Thread row
description: One row of an inbox list with one avatar, sender, subject, snippet, time, unread dot, a row of people and count chips, labels and hover actions.
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
| `people`                     | `{ name, image? }[]`, latest sender first. The first person is the one avatar, in a column that is the same width on every row so the text lines up whatever the participant count. All of them show as chips on the third row (up to `maxChips`, then "+N"), like Twenty's thread list. |
| `subject`, `snippet`, `time` | Text. Format `time` yourself.                                                                                  |
| `unread`                     | Bold text and a blue dot.                                                                                      |
| `selected`                   | Highlights the row and sets `aria-current`.                                                                    |
| `count`                      | Message count, shown as a chip on the third row when above 1.                                                  |
| `labels`                     | `{ text, tone? }[]` as tone badges, after the people chips.                                                    |
| `href`, `onclick`            | With `href` the row is a link, otherwise a button.                                                             |
| `actions`                    | Snippet shown on hover and focus, beside the link rather than inside it. Not shown on touch, so give touch users another way to act. |
| `highlight`                  | Search terms (`string[]`) marked in the sender, the chips, subject and snippet with [Highlight](/docs/components/highlight). A chip shows the full name when a term matches only its rest ("Smith" for "Jane Smith"); people past `+N` are not shown, so they carry no mark. |
| `maxChips`                   | People chips before the "+N" chip. Default 3; 0 hides them. Replaces `maxAvatars` (removed 4 Nov 2026).       |
| `class`, `ref`, other props  | Passed to the row element.                                                                                     |

## Loading

`ThreadRowSkeleton` draws the same columns while the list loads. It takes `chips` (chips to draw on the third row, default 2; replaces `avatars` and `withLabels`, removed 4 Nov 2026) and is hidden from screen readers. Put `aria-busy` on the list that holds the rows.

```svelte
<div aria-busy={loading}>
  {#if loading}
    <ThreadRowSkeleton />
    <ThreadRowSkeleton chips={3} />
  {:else}
    ...
  {/if}
</div>
```
