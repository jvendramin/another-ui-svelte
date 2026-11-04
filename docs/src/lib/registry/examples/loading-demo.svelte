<script lang="ts">
	import { Button } from "$lib/registry/ui/button/index.js";
	import { Loading } from "$lib/registry/ui/loading/index.js";
	import { ThreadRow, type ThreadPerson } from "$lib/registry/ui/thread-row/index.js";

	type Thread = {
		id: string;
		people: ThreadPerson[];
		subject: string;
		snippet: string;
		time: string;
	};

	const threads: Thread[] = [
		{
			id: "1",
			people: [{ name: "Priya Shah" }],
			subject: "Signage quote for the store",
			snippet: "Attached is the revised quote.",
			time: "2:14 PM",
		},
		{
			id: "2",
			people: [{ name: "Globex Billing" }],
			subject: "Invoice 1042 is due Friday",
			snippet: "The balance is due this week.",
			time: "11:02 AM",
		},
		{
			id: "3",
			people: [{ name: "Jordan Ellis" }],
			subject: "Re: Renewal terms",
			snippet: "Can you send the paperwork?",
			time: "Mon",
		},
	];
	// The sample is what the skeleton is traced from: the same component, filled with plausible text.
	const SAMPLE: Thread[] = Array.from({ length: 3 }, (_, i) => ({
		id: `s${i}`,
		people: [{ name: "Sender Name" }],
		subject: "A subject line goes here",
		snippet: "The first words of the message sit here.",
		time: "2:14 PM",
	}));

	let mode = $state<"loading" | "loaded" | "empty" | "error">("loading");
	const modes = ["loading", "loaded", "empty", "error"] as const;
	let failFast = $state(true);
</script>

<div class="flex w-full max-w-xl flex-col gap-3">
	<div class="flex flex-wrap gap-2">
		{#each modes as m (m)}
			<Button
				size="sm"
				variant={mode === m ? "secondary" : "outline"}
				aria-pressed={mode === m}
				onclick={() => (mode = m)}>{m}</Button
			>
		{/each}
	</div>
	<div class="overflow-hidden rounded-md border">
		<Loading
			data={mode === "loading" ? null : threads}
			sample={SAMPLE}
			id="demo-threads"
			label="Loading threads"
			empty={mode === "empty"}
			emptyTitle="No threads"
			emptyDescription="New mail shows up here."
			error={mode === "error" ? new Error("The mail server did not answer.") : undefined}
			errorTitle="Could not load threads"
			onRetry={() => {
				mode = "loading";
				// A retry against a server that is plainly down answers at once: error, skeleton, error within milliseconds.
				if (failFast) setTimeout(() => (mode = "error"), 30);
			}}
		>
			{#snippet children(rows)}
				{#each rows as thread (thread.id)}
					<ThreadRow
						people={thread.people}
						subject={thread.subject}
						snippet={thread.snippet}
						time={thread.time}
					/>
				{/each}
			{/snippet}
		</Loading>
	</div>
</div>
