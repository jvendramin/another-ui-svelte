<script lang="ts">
	import { Button } from "$lib/registry/ui/button/index.js";
	import { RecordPicker, type RecordPickerOption } from "$lib/registry/ui/record-picker/index.js";

	const companies: RecordPickerOption[] = [
		{ id: "c1", label: "Acme Corp", description: "acme.com" },
		{ id: "c2", label: "Globex", description: "globex.io" },
		{ id: "c3", label: "Initech", description: "initech.com" },
		{ id: "c4", label: "Umbrella", description: "umbrella.co" },
		{ id: "c5", label: "Stark Industries", description: "stark.com" },
	];

	let company = $state<RecordPickerOption | null>(null);

	// Stands in for an API call.
	async function search(query: string) {
		await new Promise((r) => setTimeout(r, 300));
		const q = query.trim().toLowerCase();
		return companies.filter(
			(c) => !q || c.label.toLowerCase().includes(q) || c.description?.includes(q)
		);
	}

	async function save(option: RecordPickerOption | null) {
		await new Promise((r) => setTimeout(r, 200));
		if (option?.id === "c4") throw new Error("Umbrella is blocked");
	}
</script>

<div class="flex flex-col items-start gap-2">
	<RecordPicker
		bind:value={company}
		{search}
		onSelect={save}
		label="Company"
		clearLabel="No company"
	>
		{#snippet trigger({ props })}
			<Button {...props} variant="outline" class="w-56 justify-start font-normal">
				{company?.label ?? "Pick a company"}
			</Button>
		{/snippet}
	</RecordPicker>
	<p class="text-[13px] text-muted-foreground">Umbrella fails to save, to show the error row.</p>
</div>
