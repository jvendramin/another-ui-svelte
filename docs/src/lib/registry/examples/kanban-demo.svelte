<script lang="ts">
	import {
		Kanban,
		applyKanbanMove,
		type KanbanColumn,
		type KanbanMove,
	} from "$lib/registry/ui/kanban/index.js";

	type Deal = { id: string; title: string; company: string; value: number; stage: string };

	const columns: KanbanColumn[] = [
		{ id: "lead", title: "Lead", tone: "gray" },
		{ id: "meeting", title: "Meeting", tone: "blue" },
		{ id: "proposal", title: "Proposal", tone: "orange" },
		{ id: "won", title: "Won", tone: "green" },
	];

	let deals = $state<Deal[]>([
		{ id: "d1", title: "Website rebuild", company: "Acme Corp", value: 12400, stage: "lead" },
		{ id: "d2", title: "Annual retainer", company: "Globex", value: 3200, stage: "lead" },
		{ id: "d3", title: "CRM setup", company: "Initech", value: 8150, stage: "meeting" },
		{ id: "d4", title: "Signage package", company: "Hooli", value: 560, stage: "proposal" },
		{
			id: "d5",
			title: "Support plan",
			company: "Stark Industries",
			value: 98000,
			stage: "proposal",
		},
		{ id: "d6", title: "Brand refresh", company: "Umbrella", value: 4300, stage: "won" },
	]);

	const money = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});

	function onMove(move: KanbanMove) {
		deals = applyKanbanMove(deals, move, {
			getColumn: (d) => d.stage,
			setColumn: (d, stage) => ({ ...d, stage }),
		});
	}

	function onCreate(columnId: string, title: string) {
		deals = [
			...deals,
			{ id: crypto.randomUUID(), title, company: "No company", value: 0, stage: columnId },
		];
	}
</script>

<Kanban
	{columns}
	items={deals}
	getColumn={(d) => d.stage}
	{onMove}
	{onCreate}
	createLabel="Add deal"
	class="w-full"
>
	{#snippet card({ item })}
		<div class="font-medium">{item.title}</div>
		<div class="text-muted-foreground">{item.company}</div>
		<div class="tabular-nums">{money.format(item.value)}</div>
	{/snippet}
</Kanban>
