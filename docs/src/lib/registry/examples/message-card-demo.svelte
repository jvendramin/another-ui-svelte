<script lang="ts">
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";
	import { MessageCard } from "$lib/registry/ui/message-card/index.js";

	let first = $state(false);
	let second = $state(true);
	let quotedOpen = $state(false);
</script>

<div class="flex w-full max-w-xl flex-col gap-2">
	<MessageCard
		bind:open={first}
		from="Priya Shah"
		fromAddress="priya@acme.example"
		to="to me, alex@vwork.example, sam@acme.example"
		time="Nov 3, 9:40 AM"
		attachments={1}
		preview="Thanks for the quick turnaround. Can you also price the lit option?"
	>
		<p>Thanks for the quick turnaround. Can you also price the lit option?</p>
	</MessageCard>
	<MessageCard
		bind:open={second}
		unread
		attachments={2}
		from="Alex Moreau"
		fromAddress="alex@vwork.example"
		bind:showQuoted={quotedOpen}
		to="to Priya Shah"
		time="Nov 4, 2:14 PM"
	>
		{#snippet actions()}
			<Button size="sm" variant="ghost">Reply</Button>
		{/snippet}
		<p>Attached is the revised quote. The lit sign is priced separately at the bottom.</p>
		{#snippet quoted()}
			<p>On Nov 3, Priya Shah wrote: Thanks for the quick turnaround.</p>
		{/snippet}
		{#snippet footer()}
			<div class="flex flex-wrap gap-2">
				<Badge variant="outline">quote-v2.pdf</Badge>
				<Badge variant="outline">site-photos.zip</Badge>
			</div>
		{/snippet}
	</MessageCard>
</div>
