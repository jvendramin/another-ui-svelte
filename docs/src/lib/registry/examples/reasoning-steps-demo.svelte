<script lang="ts">
	import { Button } from "$lib/registry/ui/button/index.js";
	import { Reasoning, type ReasoningStep } from "$lib/registry/ui/reasoning/index.js";

	const script: Omit<ReasoningStep, "status">[] = [
		{ id: "s1", kind: "think", title: "Working out what counts as overdue" },
		{
			id: "s2",
			kind: "search",
			title: "Searching invoices due before today",
			detail: "Found 3 of 14 open invoices",
		},
		{ id: "s3", kind: "read", title: "Checking card payouts since Monday" },
		{ id: "s4", kind: "think", title: "Ranking them by amount" },
	];

	let streaming = $state(false);
	let active = $state(-1);
	let timer: ReturnType<typeof setInterval> | undefined;

	const steps = $derived(
		script.map(
			(s, i): ReasoningStep => ({
				...s,
				status: !streaming ? "done" : i < active ? "done" : i === active ? "running" : "pending",
			})
		)
	);

	function play() {
		clearInterval(timer);
		streaming = true;
		active = 0;
		timer = setInterval(() => {
			active += 1;
			if (active >= script.length) {
				clearInterval(timer);
				streaming = false;
				active = -1;
			}
		}, 1100);
	}
</script>

<div class="flex w-full max-w-md flex-col items-start gap-3">
	<Reasoning {steps} {streaming} duration={6000} />
	<Button size="sm" variant="outline" onclick={play} disabled={streaming}>Replay</Button>
</div>
