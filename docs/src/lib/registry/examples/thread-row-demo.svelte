<script lang="ts">
	import { Button } from "$lib/registry/ui/button/index.js";
	import {
		ThreadRow,
		type ThreadLabel,
		type ThreadPerson,
	} from "$lib/registry/ui/thread-row/index.js";

	type Thread = {
		id: string;
		people: ThreadPerson[];
		subject: string;
		snippet: string;
		time: string;
		unread?: boolean;
		count?: number;
		labels?: ThreadLabel[];
	};

	let threads = $state<Thread[]>([
		{
			id: "1",
			people: [
				{ name: "Priya Shah" },
				{ name: "Alex Moreau" },
				{ name: "Sam Okafor" },
				{ name: "Lee Park" },
			],
			subject: "Signage quote for the Chilliwack store",
			snippet: "Attached is the revised quote with the lit sign option priced separately.",
			time: "2:14 PM",
			unread: true,
			count: 4,
			labels: [{ text: "Quote", tone: "blue" }],
		},
		{
			id: "2",
			people: [{ name: "Globex Billing" }],
			subject: "Invoice 1042 is due Friday",
			snippet: "A reminder that the balance of $1,260.00 is due this week.",
			time: "11:02 AM",
			labels: [{ text: "Billing", tone: "orange" }],
		},
		{
			id: "3",
			people: [{ name: "Jordan Ellis" }, { name: "Hooli Support" }],
			subject: "Re: Renewal terms",
			snippet: "Thanks, that works for us. Can you send the paperwork?",
			time: "Mon",
			count: 2,
		},
	]);
	let selected = $state("1");
</script>

<div class="w-full max-w-xl overflow-hidden rounded-md border">
	{#each threads as thread (thread.id)}
		<ThreadRow
			people={thread.people}
			subject={thread.subject}
			snippet={thread.snippet}
			time={thread.time}
			unread={thread.unread}
			count={thread.count}
			labels={thread.labels}
			selected={selected === thread.id}
			onclick={() => {
				selected = thread.id;
				thread.unread = false;
			}}
		>
			{#snippet actions()}
				<Button
					size="sm"
					variant="ghost"
					onclick={() => {
						threads = threads.filter((t) => t.id !== thread.id);
						if (selected === thread.id) selected = threads[0]?.id ?? "";
					}}>Archive</Button
				>
			{/snippet}
		</ThreadRow>
	{/each}
</div>
