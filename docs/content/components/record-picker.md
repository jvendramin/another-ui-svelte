---
title: Record picker
description: Pick one record from a searchable list in a popover, for linking a contact to its company. The list comes from your API.
component: true
---

<script>
	import ComponentPreview from "$lib/components/component-preview.svelte";
	import ComponentSource from "$lib/components/component-source.svelte";
	import PMAddComp from "$lib/components/pm-add-comp.svelte";
	import PMInstall from "$lib/components/pm-install.svelte";
	import Steps from "$lib/components/steps.svelte";
	import InstallTabs from "$lib/components/install-tabs.svelte";

	let { viewerData } = $props();
	import Step from "$lib/components/step.svelte";
</script>

<ComponentPreview name="record-picker-demo">

<div></div>

</ComponentPreview>

## Source

Composed from [Popover](/docs/components/popover) and [Command](/docs/components/command), as in the combobox examples, with the Command filter turned off so your server decides what matches. `RecordFields` uses it for its `relation` field type.

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="record-picker" />
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
  import {
    RecordPicker,
    type RecordPickerOption,
  } from "$lib/components/ui/record-picker/index.js";

  let company = $state<RecordPickerOption | null>(null);

  async function search(query: string) {
    const res = await fetch(`/api/companies?q=${encodeURIComponent(query)}`);
    return (await res.json()) as RecordPickerOption[];
  }

  async function save(option: RecordPickerOption | null) {
    await linkContactToCompany(option?.id ?? null); // throw to keep the popover open and show an error
  }
</script>

<RecordPicker
  bind:value={company}
  {search}
  onSelect={save}
  clearLabel="No company"
>
  {#snippet trigger({ props })}
    <Button {...props} variant="outline"
      >{company?.label ?? "Pick a company"}</Button
    >
  {/snippet}
</RecordPicker>
```

## Props

| Prop                                 | What it does                                                                                                                                                                                                                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`, `open`                      | The picked option `{ id, label, description?, href? }` or null, and whether the popover is open. Both are bindable.                                                                                                                                                                     |
| `search`                             | `(query) => options`, sync or async. Runs when the popover opens (with `""`) and after the user stops typing for `debounceMs` (200 ms). Only the answer to the latest query is shown, so a slow early answer never replaces a newer one. If it throws, the list shows "Could not load". |
| `onSelect`                           | Called with the picked option, or `null` for the clear row. The popover shows "Saving..." and cannot be closed while it runs. Throw to reject: it stays open with "Could not save". On success the popover closes and focus returns to the trigger.                                     |
| `trigger`                            | A snippet receiving `{ props, open }`. Spread `props` on the button that opens the popover.                                                                                                                                                                                             |
| `clearLabel`                         | Adds a first row with this text that clears the value, shown only while there is a value.                                                                                                                                                                                               |
| `label`, `placeholder`, `emptyLabel` | Texts. `label` names the list for screen readers.                                                                                                                                                                                                                                       |

The picker lists what `search` returns and does no filtering of its own. Keyboard: arrow keys move, Enter picks, Escape closes.
