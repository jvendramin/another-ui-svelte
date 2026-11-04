<script lang="ts">
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import {
		FilterChips,
		type FilterFacet,
		type FilterValue,
	} from "$lib/registry/ui/filter-chips/index.js";
	import { RecordTable, type RecordTableColumn } from "$lib/registry/ui/record-table/index.js";

	type Task = { id: string; title: string; status: string; owner: string };

	const tasks: Task[] = [
		{ id: "t1", title: "Send proposal to Acme", status: "todo", owner: "priya" },
		{ id: "t2", title: "Call Globex about renewal", status: "doing", owner: "alex" },
		{ id: "t3", title: "Review signage quote", status: "done", owner: "priya" },
		{ id: "t4", title: "Update pricing sheet", status: "todo", owner: "sam" },
		{ id: "t5", title: "Book Initech demo", status: "doing", owner: "priya" },
		{ id: "t6", title: "Invoice Hooli", status: "done", owner: "alex" },
	];

	const facets: FilterFacet[] = [
		{
			id: "status",
			label: "Status",
			options: [
				{ value: "todo", label: "To do" },
				{ value: "doing", label: "In progress" },
				{ value: "done", label: "Done" },
			],
		},
		{
			id: "owner",
			label: "Owner",
			options: [
				{ value: "alex", label: "Alex Moreau" },
				{ value: "priya", label: "Priya Shah" },
				{ value: "sam", label: "Sam Okafor" },
			],
		},
	];

	const tones: Record<string, "gray" | "blue" | "green"> = {
		todo: "gray",
		doing: "blue",
		done: "green",
	};
	const label = (list: FilterFacet, v: string) =>
		list.options.find((o) => o.value === v)?.label ?? v;

	// The table compares each column's accessor value with the chosen values, so the accessors return the facet values.
	const columns: RecordTableColumn<Task>[] = [
		{ id: "title", header: "Task", accessor: (t) => t.title, width: "50%" },
		{ id: "status", header: "Status", accessor: (t) => t.status, cell: status },
		{ id: "owner", header: "Owner", accessor: (t) => t.owner, cell: owner },
	];

	let value = $state<FilterValue>({ status: ["todo", "doing"] });
</script>

{#snippet status({ value: v }: { value: unknown })}
	<Badge tone={tones[String(v)] ?? "gray"}>{label(facets[0], String(v))}</Badge>
{/snippet}

{#snippet owner({ value: v }: { value: unknown })}
	{label(facets[1], String(v))}
{/snippet}

<div class="flex w-full flex-col gap-3">
	<FilterChips {facets} bind:value />
	<div class="rounded-lg border">
		<RecordTable data={tasks} {columns} getRowId={(t) => t.id} filters={value} />
	</div>
</div>
