<script lang="ts">
	import { Button } from "$lib/registry/ui/button/index.js";
	import { ToolCall, ToolCallGroup, ToolChip } from "$lib/registry/ui/tool-call/index.js";

	let retried = $state(false);
</script>

<div class="flex w-full max-w-lg flex-col gap-4">
	<div class="flex flex-wrap gap-2">
		<ToolChip name="search_invoices" status="running" />
		<ToolChip name="get_payouts" duration={420} />
		<ToolChip name="send_email" status="error" />
	</div>

	<ToolCallGroup count={2} errors={retried ? 0 : 1} open>
		<ToolCall
			name="search_invoices"
			duration={640}
			input={{ status: "overdue", before: "2026-10-10" }}
			output={{ count: 3, total: 5225 }}
		/>
		<ToolCall
			name="get_payouts"
			status={retried ? "done" : "error"}
			duration={retried ? 380 : undefined}
			input={{ since: "2026-10-05" }}
			output={retried ? { payouts: [] } : undefined}
			error={retried ? undefined : "The payouts service timed out."}
		>
			{#snippet actions()}
				{#if !retried}
					<Button size="xs" variant="outline" onclick={() => (retried = true)}>Retry</Button>
				{/if}
			{/snippet}
		</ToolCall>
	</ToolCallGroup>
</div>
