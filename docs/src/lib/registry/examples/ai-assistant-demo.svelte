<script lang="ts">
	import { AIAssistant, type AssistantReplyResult } from "$lib/registry/ui/ai-assistant/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";

	// A stand in model: it streams a canned answer a word at a time. Swap it for a call to your own endpoint.
	async function* stream(text: string, signal: AbortSignal) {
		for (const word of text.split(" ")) {
			if (signal.aborted) return;
			await new Promise((r) => setTimeout(r, 45));
			yield word + " ";
		}
	}

	function reply(prompt: string, _model: string, signal: AbortSignal): AssistantReplyResult {
		if (/\b(schedule|event|meeting)\b/i.test(prompt)) {
			return {
				text: "I can add that to your calendar. Check the details before anything is saved.",
				approval: {
					title: "Add event to calendar",
					reason: "You asked me to schedule this.",
					details: [
						{ label: "Action", value: "Create an event from this request" },
						{ label: "Status", value: "Demo, no calendar connected" },
					],
				},
			};
		}
		return stream(
			"Here is a first draft. Tell me what to change and I will adjust it, one sentence at a time.",
			signal
		);
	}
</script>

<div class="flex w-full flex-col items-start gap-3">
	<p class="text-sm text-muted-foreground">
		Opens the assistant as a docked panel. Press Escape to close it. Try "Schedule a meeting".
	</p>
	<AIAssistant {reply} name="Alex">
		{#snippet trigger({ props })}
			<Button {...props} variant="outline">Assistant</Button>
		{/snippet}
	</AIAssistant>
</div>
