<script lang="ts" module>
	import type { BadgeTone } from "$lib/registry/ui/badge/badge.svelte";

	export type ThreadPerson = { name: string; image?: string };
	export type ThreadLabel = { text: string; tone?: BadgeTone };
</script>

<script lang="ts">
	import * as Avatar from "$lib/registry/ui/avatar/index.js";
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import { StatusDot } from "$lib/registry/ui/status-dot/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	// One row of an inbox list: the people on the thread as an avatar group, the sender names, subject, a snippet of the
	// last message, the time, an unread dot and labels. `actions` shows on hover and keyboard focus, beside the row's link,
	// so it never nests a button inside the link. Composed from Avatar, Badge and StatusDot.
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
		maxAvatars = 2,
		href,
		onclick,
		actions,
		class: className,
		...restProps
	}: WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "onclick" | "children">> & {
		/** Who is on the thread, newest first. The first name leads the row. */
		people: ThreadPerson[];
		subject: string;
		snippet?: string;
		/** Text for the time, such as "2:14 PM" or "Mon". Format it yourself so the row has no timezone surprises. */
		time?: string;
		unread?: boolean;
		/** The thread open in the pane. Sets `aria-current`. */
		selected?: boolean;
		/** Number of messages, shown beside the sender when above 1. */
		count?: number;
		labels?: ThreadLabel[];
		/** Avatars shown before the "+N" count. Default 2. */
		maxAvatars?: number;
		/** Makes the row a link. With only `onclick` it is a button. With neither, the row is not interactive. */
		href?: string;
		onclick?: (event: MouseEvent) => void;
		/** Buttons for hover, such as archive or snooze. Keep them as real buttons with labels. */
		actions?: Snippet;
	} = $props();

	const shown = $derived(people.slice(0, maxAvatars));
	const extra = $derived(Math.max(0, people.length - shown.length));
	const sender = $derived(people.map((p) => p.name).join(", "));
	// Width of the avatar column from maxAvatars: each avatar is 1.5rem and overlaps the next by 0.375rem, plus one slot for "+N".
	const stackWidth = $derived(`${(maxAvatars + 1) * 1.5 - maxAvatars * 0.375}rem`);
	const hasLink = $derived(Boolean(href || onclick));
	const initials = (name: string) =>
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase())
			.join("");
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
		<svelte:element
			this={href ? "a" : "button"}
			{href}
			type={href ? undefined : "button"}
			{onclick}
			aria-current={selected ? "true" : undefined}
			class="absolute inset-0 z-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
		>
			<span class="sr-only">
				{unread ? "Unread. " : ""}{sender}. {subject}{count && count > 1
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

	<Avatar.Group
		class="pointer-events-none shrink-0 -space-x-1.5"
		style="width: {stackWidth}"
		aria-hidden="true"
	>
		{#each shown as person, i (i)}
			<Avatar.Root size="sm">
				{#if person.image}<Avatar.Image src={person.image} alt="" />{/if}
				<Avatar.Fallback>{initials(person.name)}</Avatar.Fallback>
			</Avatar.Root>
		{/each}
		{#if extra > 0}
			<Avatar.GroupCount class="size-6 rounded-full bg-muted text-xs">+{extra}</Avatar.GroupCount>
		{/if}
	</Avatar.Group>

	<!-- With a link, its hidden label already says all of this, so hide the visible copy from screen readers. -->
	<div class="pointer-events-none min-w-0 flex-1" aria-hidden={hasLink ? "true" : undefined}>
		<div
			class={cn(
				"flex items-baseline gap-2",
				actions && "group-focus-within/thread:pe-24 group-hover/thread:pe-24"
			)}
		>
			<span class={cn("truncate", unread ? "font-semibold" : "font-medium")}>{people[0]?.name}</span
			>
			{#if count && count > 1}<span class="text-xs text-muted-foreground">{count}</span>{/if}
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
			{subject}
		</div>
		{#if snippet}<div class="truncate text-muted-foreground">{snippet}</div>{/if}
		{#if labels.length}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each labels as label, i (i)}
					<Badge tone={label.tone ?? "gray"}>{label.text}</Badge>
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
