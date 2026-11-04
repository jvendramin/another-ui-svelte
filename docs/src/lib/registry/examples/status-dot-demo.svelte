<script lang="ts">
	import { StatusDot, type StatusDotTone } from "$lib/registry/ui/status-dot/index.js";

	const rows: { tone: StatusDotTone; text: string }[] = [
		{ tone: "green", text: "Online" },
		{ tone: "blue", text: "Unread" },
		{ tone: "orange", text: "Waiting" },
		{ tone: "red", text: "Failed" },
		{ tone: "gray", text: "Offline" },
	];
</script>

<ul class="flex flex-col gap-2 text-sm">
	{#each rows as row (row.text)}
		<li class="flex items-center gap-2"><StatusDot tone={row.tone} />{row.text}</li>
	{/each}
</ul>
