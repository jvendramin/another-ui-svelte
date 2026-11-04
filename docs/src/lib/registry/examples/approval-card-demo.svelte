<script lang="ts">
	import { ApprovalCard } from "$lib/registry/ui/approval-card/index.js";
	import { Input } from "$lib/registry/ui/input/index.js";
	import { Label } from "$lib/registry/ui/label/index.js";

	let amount = $state("1,250.00");
	let note = $state("");
</script>

<div class="flex w-full max-w-lg flex-col gap-4">
	<ApprovalCard
		title="Refund $1,250.00 to Northwind"
		reason="Their card was charged twice for INV-1031 on Oct 2."
		risk="medium"
		details={[
			{ label: "Method", value: "Visa ending 4417" },
			{ label: "Amount", value: `$${amount} CAD` },
			{ label: "Arrives", value: "5 to 10 business days" },
		]}
		expiresIn={120}
		onapprove={({ always }) => (note = always ? "Approved, always allowed." : "Approved.")}
		ondeny={({ expired }) => (note = expired ? "Expired." : "Denied.")}
	>
		{#snippet editable()}
			<div class="flex flex-col gap-1.5">
				<Label for="approval-amount" class="text-xs">Amount</Label>
				<Input id="approval-amount" bind:value={amount} />
			</div>
		{/snippet}
	</ApprovalCard>
	<p class="text-sm text-muted-foreground" aria-live="polite">{note}</p>
</div>
