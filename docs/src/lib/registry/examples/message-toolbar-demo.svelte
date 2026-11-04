<script lang="ts">
	import * as Bubble from "$lib/registry/ui/bubble/index.js";
	import * as Message from "$lib/registry/ui/message/index.js";
	import { MessageToolbar } from "$lib/registry/ui/message-toolbar/index.js";
	import * as Tooltip from "$lib/registry/ui/tooltip/index.js";

	let status = $state("Hover or focus a message to see its actions.");
</script>

<Tooltip.Provider>
	<div class="flex w-full max-w-md flex-col gap-3">
		<div class="flex flex-col pb-10">
			<Message.Root align="end">
				<Message.Content>
					<Bubble.Root variant="muted" align="end">
						<Bubble.Content>Which invoices are overdue right now?</Bubble.Content>
					</Bubble.Root>
				</Message.Content>
				<MessageToolbar
					text="Which invoices are overdue right now?"
					onedit={() => (status = "Edit pressed")}
					onretry={() => (status = "Retry pressed")}
					class="right-0"
				/>
			</Message.Root>
		</div>
		<div class="flex flex-col pb-10">
			<Message.Root align="start">
				<Message.Content>
					<Bubble.Root variant="ghost">
						<Bubble.Content>
							Three invoices are overdue for $5,225 in total. Northwind Traders is the largest at $2,400.
						</Bubble.Content>
					</Bubble.Root>
				</Message.Content>
				<MessageToolbar
					text="Three invoices are overdue for $5,225 in total."
					onimprove={() => (status = "Improve pressed")}
					onretry={() => (status = "Retry pressed")}
					class="left-0"
				/>
			</Message.Root>
		</div>
		<p class="text-sm text-muted-foreground" aria-live="polite">{status}</p>
	</div>
</Tooltip.Provider>
