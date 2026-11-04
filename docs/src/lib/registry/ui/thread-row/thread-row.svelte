<script lang="ts" module>
	import type { BadgeTone } from "$lib/registry/ui/badge/badge.svelte";

	export type ThreadPerson = { name: string; image?: string };
	export type ThreadLabel = { text: string; tone?: BadgeTone };
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import * as Avatar from "$lib/registry/ui/avatar/index.js";
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import { StatusDot } from "$lib/registry/ui/status-dot/index.js";
	import { cn } from "$lib/utils.js";

	// One row of an inbox list: the people on the thread as an avatar group, the sender names, subject, a snippet of the
	// last message, the time, an unread dot and labels. `actions` shows on hover and keyboard focus, beside the row's link,
	// so it never nests a button inside the link. Composed from Avatar, Badge and StatusDot.
	let {
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
	}: {
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
		/** Makes the row a link. Without it the row is a button. */
		href?: string;
		onclick?: (event: MouseEvent) => void;
		/** Buttons for hover, such as archive or snooze. Keep them as real buttons with labels. */
		actions?: Snippet;
		class?: string;
	} = $props();

	const shown = $derived(people.slice(0, maxAvatars));
	const extra = $derived(Math.max(0, people.length - shown.length));
	const sender = $derived(people.map((p) => p.name).join(", "));
	const initials = (name: string) =>
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase())
			.join("");
</script>

<div
	data-slot="thread-row"
	data-unread={unread || undefined}
	data-selected={selected || undefined}
	class={cn(
		"group/thread relative flex items-start gap-3 border-b px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 has-[a:focus-visible,button:focus-visible]:bg-muted/50 data-[selected]:bg-muted",
		className
	)}
>
	<svelte:element
		this={href ? "a" : "button"}
		{href}
		type={href ? undefined : "button"}
		{onclick}
		aria-current={selected ? "true" : undefined}
		class="absolute inset-0 z-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
	>
		<span class="sr-only">
			{unread ? "Unread. " : ""}{sender}. {subject}{time ? `. ${time}` : ""}
		</span>
	</svelte:element>

	<div class="pointer-events-none relative z-10 mt-0.5 flex w-3 shrink-0 justify-center pt-1.5">
		{#if unread}<StatusDot tone="blue" />{/if}
	</div>

	<Avatar.Group class="pointer-events-none w-[3.75rem] shrink-0 -space-x-1.5" aria-hidden="true">
		{#each shown as person (person.name)}
			<Avatar.Root size="sm">
				{#if person.image}<Avatar.Image src={person.image} alt="" />{/if}
				<Avatar.Fallback>{initials(person.name)}</Avatar.Fallback>
			</Avatar.Root>
		{/each}
		{#if extra > 0}
			<Avatar.GroupCount class="size-6 rounded-full bg-muted text-xs">+{extra}</Avatar.GroupCount>
		{/if}
	</Avatar.Group>

	<div class="pointer-events-none min-w-0 flex-1">
		<div class="flex items-baseline gap-2">
			<span class={cn("truncate", unread ? "font-semibold" : "font-medium")}>{people[0]?.name}</span>
			{#if count && count > 1}<span class="text-xs text-muted-foreground">{count}</span>{/if}
			{#if time}
				<span class="ms-auto shrink-0 text-xs text-muted-foreground tabular-nums group-hover/thread:invisible group-has-[:focus-visible]/thread:invisible">{time}</span>
			{/if}
		</div>
		<div class={cn("truncate", unread ? "font-medium text-foreground" : "text-foreground/80")}>{subject}</div>
		{#if snippet}<div class="truncate text-muted-foreground">{snippet}</div>{/if}
		{#if labels.length}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each labels as label (label.text)}
					<Badge tone={label.tone ?? "gray"}>{label.text}</Badge>
				{/each}
			</div>
		{/if}
	</div>

	{#if actions}
		<div
			class="absolute end-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/thread:opacity-100 group-focus-within/thread:opacity-100"
		>
			{@render actions()}
		</div>
	{/if}
</div>
