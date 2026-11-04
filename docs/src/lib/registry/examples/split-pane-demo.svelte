<script lang="ts">
	import { Button } from "$lib/registry/ui/button/index.js";
	import { SplitPane } from "$lib/registry/ui/split-pane/index.js";
	import { ThreadRow } from "$lib/registry/ui/thread-row/index.js";

	const threads = [
		{
			id: "1",
			from: "Priya Shah",
			subject: "Signage quote for the Chilliwack store",
			snippet: "Attached is the revised quote.",
			time: "2:14 PM",
			body: "Attached is the revised quote with the lit sign option priced separately.",
		},
		{
			id: "2",
			from: "Globex Billing",
			subject: "Invoice 1042 is due Friday",
			snippet: "The balance of $1,260.00 is due.",
			time: "11:02 AM",
			body: "A reminder that the balance of $1,260.00 is due this week.",
		},
		{
			id: "3",
			from: "Jordan Ellis",
			subject: "Re: Renewal terms",
			snippet: "Can you send the paperwork?",
			time: "Mon",
			body: "Thanks, that works for us. Can you send the paperwork?",
		},
	];
	let openId = $state("");
	let listCollapsed = $state(false);
	const open = $derived(threads.find((t) => t.id === openId));
</script>

<div class="h-80 w-full overflow-hidden rounded-lg border">
	<SplitPane
		showDetail={Boolean(open)}
		collapsible
		stackBelow={480}
		bind:listCollapsed
		listLabel="Threads"
		detailLabel="Thread"
	>
		{#snippet list()}
			{#each threads as thread (thread.id)}
				<ThreadRow
					people={[{ name: thread.from }]}
					subject={thread.subject}
					snippet={thread.snippet}
					time={thread.time}
					selected={openId === thread.id}
					onclick={() => (openId = thread.id)}
				/>
			{/each}
		{/snippet}
		{#snippet detail({ narrow })}
			<div class="flex flex-col gap-2 p-4 text-sm">
				<div class="flex items-center gap-2">
					{#if narrow}
						<Button size="sm" variant="ghost" onclick={() => (openId = "")}>Back</Button>
					{:else}
						<Button size="sm" variant="ghost" onclick={() => (listCollapsed = !listCollapsed)}>
							{listCollapsed ? "Show list" : "Hide list"}
						</Button>
					{/if}
					<span class="font-medium">{open?.subject}</span>
				</div>
				<p>{open?.body}</p>
			</div>
		{/snippet}
		{#snippet empty()}
			<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
				Select a thread
			</div>
		{/snippet}
	</SplitPane>
</div>
