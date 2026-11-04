---
title: Filter chips
description: A row of filter chips for a list, like Stage, Owner and Status. Pick several values per chip, see what is active, clear one or all.
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

<ComponentPreview name="filter-chips-demo">

<div></div>

</ComponentPreview>

## Source

Composed from [Popover](/docs/components/popover), [Command](/docs/components/command), [Button](/docs/components/button) and [Badge](/docs/components/badge), with the Twenty look of one chip per field. The chips only hold the chosen values; [Record table](/docs/components/record-table) applies them through its `filters` prop, or you filter your own list.

## Installation

<InstallTabs>
{#snippet cli()}
<PMAddComp name="filter-chips" />
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
  import {
    FilterChips,
    type FilterValue,
  } from "$lib/components/ui/filter-chips/index.js";
  import { RecordTable } from "$lib/components/ui/record-table/index.js";

  let value = $state<FilterValue>({});
  const facets = [
    {
      id: "stage",
      label: "Stage",
      options: [
        { value: "lead", label: "Lead" },
        { value: "won", label: "Won" },
      ],
    },
    {
      id: "owner",
      label: "Owner",
      options: people.map((p) => ({ value: p.id, label: p.name })),
    },
  ];
</script>

<FilterChips {facets} bind:value />
<!-- Each column's accessor returns the facet value as text: stage -> "lead", owner -> the person's id. -->
<RecordTable data={deals} {columns} getRowId={(d) => d.id} filters={value} />
```

## Props

| Prop                       | What it does                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `facets`                   | One chip each: `{ id, label, options: { value, label }[] }`. The `id` is the key in `value`, and for RecordTable it is the column id. |
| `value`                    | The chosen values per facet id, for example `{ stage: ["lead", "won"] }`. Bindable. A facet with nothing chosen is not in it.         |
| `onChange`                 | Called with the new value after the user changes a chip.                                                                              |
| `clearLabel`, `searchFrom` | The text of the button that clears every chip, and how many options a list needs before it gets a search box (8).                     |

An empty chip shows its name and a plus. An active chip shows what is chosen ("Status To do, In progress", then "+2" past two values) with a button beside it that clears just that chip. Chips open a list: click or press Enter to toggle a value, the list stays open so you can pick several, Escape closes it. Each chip has an accessible name like "Stage filter: Lead, Won".

## On Record table

`<RecordTable filters={value} />` keeps the rows whose column value is one of the chosen values, for every column that has values. A value is the column's `accessor` result as text. It combines with the text `filter` prop: a row must pass both. Rows hidden by a chip also drop out of `selectedIds`, like with the text filter.
