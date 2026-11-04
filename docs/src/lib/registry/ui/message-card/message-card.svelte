<script lang="ts">
	import * as Avatar from "$lib/registry/ui/avatar/index.js";
	import * as Collapsible from "$lib/registry/ui/collapsible/index.js";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { Button } from "$lib/registry/ui/button/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	// One message in an email thread: the card chrome around the body. A header (avatar, sender, recipients, time, actions)
	// that toggles the card open or closed, the body, a folded "quoted text" area, and a footer for attachments.
	// The body is yours to render (sanitise HTML before it gets here). Composed from Avatar and Collapsible.
	let {
		ref = $bindable(null),
		from,
		fromAddress,
		avatar,
		to,
		time,
		preview,
		open = $bindable(true),
		unread = false,
		attachments,
		actions,
		quoted,
		showQuoted = $bindable(false),
		quotedLabel = "Quoted text",
		footer,
		children,
		class: className,
		...restProps
	}: Omit<WithElementRef<HTMLAttributes<HTMLDivElement>>, "children"> & {
		/** The sender as text: a name, or an address when there is no name. */
		from: string;
		/** The sender's address, shown beside the name from the `@md` container width up. */
		fromAddress?: string;
		/** Image URL for the avatar. Without it the avatar shows initials. */
		avatar?: string;
		/** The recipients line as plain text, such as "to me, alex@a.example, bo@b.example". Format it yourself. */
		to?: string;
		/** Text for the time, such as "Nov 4, 2:14 PM". */
		time?: string;
		/** One line shown instead of the body while the card is closed. */
		preview?: string;
		/** Whether the body is shown. Bindable. */
		open?: boolean;
		unread?: boolean;
		/** Number of attachments. Shows a paperclip (and the count above 1) beside the time, so a closed card still tells. */
		attachments?: number;
		/** Buttons for the header, such as reply or more. They sit beside the toggle, not inside it. */
		actions?: Snippet;
		/** Quoted earlier messages. Folded behind a button until the reader asks. */
		quoted?: Snippet;
		/** Whether the quoted text is shown. Bindable, so the parent can keep it per message. */
		showQuoted?: boolean;
		quotedLabel?: string;
		/** Below the body, for the attachments row. */
		footer?: Snippet;
		children?: Snippet;
	} = $props();

	const initials = $derived(
		from
			.replace(/@.*$/, "")
			.replace(/[^\p{L}\p{N}\s]/gu, "")
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase())
			.join("")
	);
	const bodyId = $props.id();
</script>

<div
	bind:this={ref}
	data-slot="message-card"
	data-open={open || undefined}
	data-unread={unread || undefined}
	class={cn("@container rounded-lg border bg-card text-sm text-card-foreground", className)}
	{...restProps}
>
	<Collapsible.Root bind:open>
		<div class="flex items-start gap-3 p-3">
			<Collapsible.Trigger
				class="flex min-w-0 flex-1 items-start gap-3 rounded-md text-start outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
			>
				<Avatar.Root size="lg">
					{#if avatar}<Avatar.Image src={avatar} alt="" />{/if}
					<Avatar.Fallback>{initials}</Avatar.Fallback>
				</Avatar.Root>
				<span class="min-w-0 flex-1">
					<span class="flex items-baseline gap-2">
						<span class={cn("truncate", unread ? "font-semibold" : "font-medium")}>{from}</span>
						{#if fromAddress}
							<span class="sr-only truncate text-xs text-muted-foreground @md:not-sr-only"
								>{fromAddress}</span
							>
						{/if}
						{#if time || attachments}
							<span
								class="ms-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground tabular-nums"
							>
								{#if attachments}
									<span class="inline-flex items-center gap-0.5">
										<IconPlaceholder
											lucide="PaperclipIcon"
											tabler="IconPaperclip"
											hugeicons="AttachmentIcon"
											phosphor="PaperclipIcon"
											remixicon="RiAttachmentLine"
											class="size-3.5"
										/>
										{#if attachments > 1}<span aria-hidden="true">{attachments}</span>{/if}
										<span class="sr-only"
											>{attachments === 1 ? "1 attachment" : `${attachments} attachments`}</span
										>
									</span>
								{/if}
								{#if time}<span>{time}</span>{/if}
							</span>
						{/if}
					</span>
					{#if to}<span class="block truncate text-xs text-muted-foreground">{to}</span>{/if}
					{#if !open && preview}
						<span class="mt-1 block truncate text-muted-foreground">{preview}</span>
					{/if}
				</span>
			</Collapsible.Trigger>
			{#if actions}
				<div class="flex shrink-0 items-center gap-0.5">{@render actions()}</div>
			{/if}
		</div>
		<Collapsible.Content>
			<div class="px-3 pb-3 @md:ps-16">
				<div class="min-w-0 break-words">{@render children?.()}</div>
				{#if quoted}
					<Button
						type="button"
						variant="secondary"
						size="icon-sm"
						class="mt-2 size-6"
						aria-expanded={showQuoted}
						aria-controls="{bodyId}-quoted"
						onclick={() => (showQuoted = !showQuoted)}
					>
						<IconPlaceholder
							lucide="MoreHorizontalIcon"
							tabler="IconDots"
							hugeicons="MoreHorizontalCircle01Icon"
							phosphor="DotsThreeIcon"
							remixicon="RiMoreLine"
							class="size-3.5"
						/>
						<span class="sr-only">{quotedLabel}</span>
					</Button>
					<div
						id="{bodyId}-quoted"
						hidden={!showQuoted}
						class="mt-2 border-s-2 ps-3 text-muted-foreground"
					>
						{@render quoted()}
					</div>
				{/if}
				{#if footer}<div class="mt-3 border-t pt-3">{@render footer()}</div>{/if}
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</div>
