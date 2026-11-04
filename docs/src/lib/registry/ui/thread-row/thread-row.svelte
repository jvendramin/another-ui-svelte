<script lang="ts" module>
	import type { BadgeTone } from "$lib/registry/ui/badge/badge.svelte";

	export type ThreadPerson = { name: string; image?: string };
	export type ThreadLabel = { text: string; tone?: BadgeTone };
</script>

<script lang="ts">
	import * as Avatar from "$lib/registry/ui/avatar/index.js";
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import { Highlight } from "$lib/registry/ui/highlight/index.js";
	import { StatusDot } from "$lib/registry/ui/status-dot/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	// One row of an inbox list, laid out like Twenty's thread list: one avatar (the latest sender) in a fixed column so
	// every row's text starts at the same x whatever the participant count; the sender, subject and a snippet of the
	// last message; then a row of chips for the people on the thread and the message count. `actions` shows on hover
	// and keyboard focus, beside the row's link, so it never nests a button inside the link. Composed from Avatar,
	// Badge, Highlight and StatusDot.
	let {
		ref = $bindable(null),
		people,
		subject,
		snippet,
		time,
		unread = false,
		selected = false,
		count,
		labels = [],
		highlight = [],
		maxChips = 3,
		href,
		onclick,
		actions,
		class: className,
		...restProps
	}: WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "onclick" | "children">> & {
		/** Who is on the thread, latest sender first. The first person is the avatar; all of them are chips under the snippet. */
		people: ThreadPerson[];
		subject: string;
		snippet?: string;
		/** Text for the time, such as "2:14 PM" or "Mon". Format it yourself so the row has no timezone surprises. */
		time?: string;
		unread?: boolean;
		/** The thread open in the pane. Sets `aria-current`. */
		selected?: boolean;
		/** Number of messages, shown as a chip when above 1. */
		count?: number;
		labels?: ThreadLabel[];
		/** Search terms to mark in the names, subject and snippet. Case and accent insensitive. */
		highlight?: string[];
		/** People chips shown before the "+N" chip. Default 3. */
		maxChips?: number;
		/** Makes the row a link. With only `onclick` it is a button. With neither, the row is not interactive. */
		href?: string;
		onclick?: (event: MouseEvent) => void;
		/** Buttons for hover, such as archive or snooze. Keep them as real buttons with labels. */
		actions?: Snippet;
	} = $props();

	const max = $derived(Number.isFinite(maxChips) ? Math.max(1, Math.floor(maxChips)) : 3);
	const latest = $derived(people[0]);
	const shown = $derived(people.slice(0, max));
	const extra = $derived(Math.max(0, people.length - shown.length));
	const names = $derived(people.map((p) => p.name).join(", "));
	const hasLink = $derived(Boolean(href || onclick));
	const hasChips = $derived(people.length > 0 || (count ?? 0) > 1);
	const initials = (name: string) =>
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase())
			.join("");
	// The chip shows the first name only; a company or an address has no second word to drop.
	const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
</script>

<div
	bind:this={ref}
	data-slot="thread-row"
	data-unread={unread || undefined}
	data-selected={selected || undefined}
	class={cn(
		"group/thread relative flex items-start gap-3 border-b px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 has-[a:focus-visible,button:focus-visible]:bg-muted/50 data-[selected]:bg-muted",
		className
	)}
	{...restProps}
>
	{#if hasLink}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- The element is always a real link or button, which the checker cannot see through the dynamic tag. -->
		<svelte:element
			this={href ? "a" : "button"}
			{href}
			type={href ? undefined : "button"}
			{onclick}
			aria-current={selected ? "true" : undefined}
			class="absolute inset-0 z-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
		>
			<span class="sr-only">
				{unread ? "Unread. " : ""}{names}. {subject}{count && count > 1
					? `. ${count} messages`
					: ""}{time ? `. ${time}` : ""}{labels.length
					? `. ${labels.map((l) => l.text).join(", ")}`
					: ""}{snippet ? `. ${snippet}` : ""}
			</span>
		</svelte:element>
	{/if}

	<div class="pointer-events-none relative z-10 mt-0.5 flex w-3 shrink-0 justify-center pt-1.5">
		{#if unread}<StatusDot tone="blue" />{/if}
	</div>

	<!-- One avatar, the latest sender, in a column that is always 1.5rem wide so the text lines up across rows. -->
	<div class="pointer-events-none w-6 shrink-0" aria-hidden="true">
		{#if latest}
			<Avatar.Root size="sm">
				{#if latest.image}<Avatar.Image src={latest.image} alt="" />{/if}
				<Avatar.Fallback>{initials(latest.name)}</Avatar.Fallback>
			</Avatar.Root>
		{/if}
	</div>

	<!-- With a link, its hidden label already says all of this, so hide the visible copy from screen readers. -->
	<div class="pointer-events-none min-w-0 flex-1" aria-hidden={hasLink ? "true" : undefined}>
		<div
			class={cn(
				"flex items-baseline gap-2",
				actions && "group-focus-within/thread:pe-24 group-hover/thread:pe-24"
			)}
		>
			<span class={cn("truncate", unread ? "font-semibold" : "font-medium")}
				><Highlight text={latest?.name ?? ""} terms={highlight} /></span
			>
			{#if time}
				<span
					class={cn(
						"ms-auto shrink-0 text-xs text-muted-foreground tabular-nums",
						actions && "group-focus-within/thread:invisible group-hover/thread:invisible"
					)}>{time}</span
				>
			{/if}
		</div>
		<div class={cn("truncate", unread ? "font-medium text-foreground" : "text-foreground/80")}>
			<Highlight text={subject} terms={highlight} />
		</div>
		{#if snippet}<div class="truncate text-muted-foreground">
				<Highlight text={snippet} terms={highlight} />
			</div>{/if}
		{#if hasChips || labels.length}
			<!-- Third row: who is on the thread and how long it is, as flat chips (Badge tone gray), then the labels. -->
			<div class="mt-1.5 flex flex-wrap gap-1" data-slot="thread-row-chips">
				{#each shown as person, i (i)}
					<Badge tone="gray" class="h-5 gap-1 ps-0.5 pe-1.5">
						<Avatar.Root size="xs">
							{#if person.image}<Avatar.Image src={person.image} alt="" />{/if}
							<Avatar.Fallback>{initials(person.name)}</Avatar.Fallback>
						</Avatar.Root>
						<span class="max-w-24 truncate"><Highlight text={firstName(person.name)} terms={highlight} /></span>
					</Badge>
				{/each}
				{#if extra > 0}<Badge tone="gray" class="h-5">+{extra}</Badge>{/if}
				{#if count && count > 1}<Badge tone="gray" class="h-5">{count} messages</Badge>{/if}
				{#each labels as label, i (i)}
					<Badge tone={label.tone ?? "gray"} class="h-5">{label.text}</Badge>
				{/each}
			</div>
		{/if}
	</div>

	{#if actions}
		<div
			class="pointer-events-none absolute end-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within/thread:pointer-events-auto group-focus-within/thread:opacity-100 group-hover/thread:pointer-events-auto group-hover/thread:opacity-100"
		>
			{@render actions()}
		</div>
	{/if}
</div>
