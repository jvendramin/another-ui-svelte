<script lang="ts" module>
	import type { Component, Snippet } from "svelte";

	export type ApprovalRisk = "low" | "medium" | "high";
	export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";
	export type ApprovalDetail = { label: string; value: string };

	const RISK: Record<
		ApprovalRisk,
		{ label: string; variant: "secondary" | "outline" | "destructive" }
	> = {
		low: { label: "Low risk", variant: "secondary" },
		medium: { label: "Medium risk", variant: "outline" },
		high: { label: "High risk", variant: "destructive" },
	};

	function timeOf(date: Date) {
		return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
	}
</script>

<script lang="ts">
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";
	import * as Card from "$lib/registry/ui/card/index.js";
	import { Checkbox } from "$lib/registry/ui/checkbox/index.js";
	import { Kbd } from "$lib/registry/ui/kbd/index.js";
	import { Label } from "$lib/registry/ui/label/index.js";
	import { Progress } from "$lib/registry/ui/progress/index.js";
	import { cn } from "$lib/utils.js";

	// The agent stops and asks before it acts. It shows what will happen and how risky it is, and lets the person
	// approve, deny or edit first. Once decided it folds down to a one line receipt; a denial can be undone for five
	// seconds. Cmd/Ctrl+Enter approves and Escape denies while the card has focus. Ported from the Another UI (React)
	// Approval Card.
	let {
		title,
		reason,
		icon: Icon,
		risk = "low",
		details,
		children,
		editable,
		onapprove,
		ondeny,
		onundo,
		expiresIn,
		allowAlways = true,
		actor = "you",
		class: className,
	}: {
		title: string;
		/** Why the agent wants to do this, in one line. */
		reason?: string;
		icon?: Component<{ class?: string }>;
		risk?: ApprovalRisk;
		/** What will happen, shown as a label and value grid. */
		details?: ApprovalDetail[];
		/** Extra preview under the details, such as a diff or an email body. */
		children?: Snippet;
		/** Fields to change before approving. Shown when Edit is pressed. */
		editable?: Snippet<[{ close: () => void }]>;
		onapprove?: (options: { always: boolean }) => void;
		ondeny?: (options: { expired: boolean }) => void;
		/** Called when a denial is undone within five seconds. */
		onundo?: () => void;
		/** Seconds before the request expires and is denied on its own. */
		expiresIn?: number;
		allowAlways?: boolean;
		/** Who decided, for the receipt line. */
		actor?: string;
		class?: string;
	} = $props();

	let status = $state<ApprovalStatus>("pending");
	let decidedAt = $state<Date | null>(null);
	let always = $state(false);
	let editing = $state(false);
	let left = $state(0);
	let undoLeft = $state(0);
	let started = false;
	const uid = $props.id();

	function decide(next: "approved" | "denied" | "expired") {
		status = next;
		decidedAt = new Date();
		editing = false;
		if (next === "approved") {
			onapprove?.({ always });
		} else {
			ondeny?.({ expired: next === "expired" });
			if (next === "denied") undoLeft = 5;
		}
	}

	// Countdown to expiry. It pauses while the person is editing.
	$effect(() => {
		if (!started) {
			started = true;
			left = expiresIn ?? 0;
		}
		if (status !== "pending" || !expiresIn || editing) return;
		const t = setInterval(() => {
			left = Math.max(0, left - 1);
			if (left === 0) decide("expired");
		}, 1000);
		return () => clearInterval(t);
	});

	// A denial can be undone for five seconds.
	$effect(() => {
		if (status !== "denied" || undoLeft <= 0) return;
		const t = setTimeout(() => (undoLeft -= 1), 1000);
		return () => clearTimeout(t);
	});

	function undo() {
		status = "pending";
		decidedAt = null;
		undoLeft = 0;
		if (expiresIn) left = expiresIn;
		onundo?.();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			decide("approved");
		} else if (e.key === "Escape" && !editing) {
			e.preventDefault();
			decide("denied");
		}
	}

	const riskInfo = $derived(RISK[risk]);
	const approved = $derived(status === "approved");
</script>

{#if status !== "pending"}
	<div
		data-slot="approval-card"
		data-status={status}
		role="status"
		class={cn(
			"flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm",
			approved ? "border-emerald-500/30 bg-emerald-500/5" : "bg-muted/40 text-muted-foreground",
			className
		)}
	>
		<span
			class={cn(
				"flex size-5 shrink-0 items-center justify-center rounded-full",
				approved ? "bg-emerald-500 text-white" : "bg-muted-foreground/15"
			)}
		>
			{#if approved}
				<IconPlaceholder
					lucide="CheckIcon"
					tabler="IconCheck"
					hugeicons="Tick02Icon"
					phosphor="CheckIcon"
					remixicon="RiCheckLine"
					class="size-3"
				/>
			{:else}
				<IconPlaceholder
					lucide="XIcon"
					tabler="IconX"
					hugeicons="Cancel01Icon"
					phosphor="XIcon"
					remixicon="RiCloseLine"
					class="size-3"
				/>
			{/if}
		</span>
		<span class="min-w-0 flex-1 truncate">
			<span class={cn("font-medium", approved && "text-foreground")}>{title}</span>
			<span class="text-muted-foreground">
				{approved ? "Approved" : status === "expired" ? "Expired, not run" : "Denied"}{status ===
				"expired"
					? ""
					: ` by ${actor}`}{decidedAt ? ` at ${timeOf(decidedAt)}` : ""}{approved && always
					? ", always allowed"
					: ""}
			</span>
		</span>
		{#if status === "denied" && undoLeft > 0}
			<Button type="button" variant="ghost" size="xs" onclick={undo} class="shrink-0">
				<IconPlaceholder
					lucide="Undo2Icon"
					tabler="IconArrowBackUp"
					hugeicons="ArrowTurnBackwardIcon"
					phosphor="ArrowCounterClockwiseIcon"
					remixicon="RiArrowGoBackLine"
				/>
				Undo {undoLeft}s
			</Button>
		{/if}
	</div>
{:else}
	<Card.Root
		data-slot="approval-card"
		data-status={status}
		data-risk={risk}
		role="group"
		aria-labelledby="{uid}-title"
		tabindex={-1}
		{onkeydown}
		class={cn("w-full min-w-0 gap-3 py-3 outline-none", risk === "high" && "ring-destructive/40", className)}
	>
		<div class="flex min-w-0 items-start gap-3 px-3">
			<span
				class={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted [&>svg]:size-4.5",
					risk === "high" && "bg-destructive/10 text-destructive"
				)}
			>
				{#if Icon}
					<Icon />
				{:else}
					<IconPlaceholder
						lucide="ShieldIcon"
						tabler="IconShield"
						hugeicons="ShieldIcon"
						phosphor="ShieldIcon"
						remixicon="RiShieldLine"
					/>
				{/if}
			</span>
			<div class="flex min-w-0 flex-1 flex-col gap-0.5">
				<div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
					<span id="{uid}-title" class="min-w-0 font-medium">{title}</span>
					<Badge variant={riskInfo.variant}>{riskInfo.label}</Badge>
				</div>
				{#if reason}<p class="m-0 text-muted-foreground">{reason}</p>{/if}
			</div>
		</div>

		{#if details && details.length > 0}
			<dl
				class="mx-3 my-0 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-sm [&>dd]:m-0 [&>dd]:p-0 [&>dt]:m-0 [&>dt]:p-0"
			>
				{#each details as d (d.label)}
					<dt class="text-muted-foreground">{d.label}</dt>
					<dd class="min-w-0 wrap-break-word">{d.value}</dd>
				{/each}
			</dl>
		{/if}

		{#if children}<div class="min-w-0 px-3">{@render children()}</div>{/if}

		{#if editing && editable}
			<div class="min-w-0 px-3">{@render editable({ close: () => (editing = false) })}</div>
		{/if}

		{#if expiresIn}
			<div class="flex items-center gap-2 px-3 text-xs text-muted-foreground">
				<Progress
					value={(left / expiresIn) * 100}
					aria-label="Time left to decide"
					class={cn(
						"h-1 flex-1 [&>[data-slot=progress-indicator]]:duration-1000 [&>[data-slot=progress-indicator]]:ease-linear",
						left <= 10 && "[&>[data-slot=progress-indicator]]:bg-destructive"
					)}
				/>
				<span class="shrink-0 tabular-nums">
					{editing ? "Paused" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left`}
				</span>
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-3 pt-3">
			{#if allowAlways}
				<div class="flex items-center gap-2">
					<Checkbox id="{uid}-always" bind:checked={always} />
					<Label for="{uid}-always" class="text-xs font-normal text-muted-foreground">
						Always allow this action
					</Label>
				</div>
			{/if}
			<div class="ml-auto flex items-center gap-2">
				<Button type="button" variant="destructive" size="sm" onclick={() => decide("denied")}>
					Deny
				</Button>
				{#if editable}
					<Button
						type="button"
						variant="outline"
						size="sm"
						aria-pressed={editing}
						onclick={() => (editing = !editing)}
					>
						{editing ? "Done" : "Edit"}
					</Button>
				{/if}
				<Button type="button" size="sm" onclick={() => decide("approved")} class="sm:pr-1.5!">
					Approve
					<Kbd class="hidden bg-primary-foreground/15 text-primary-foreground sm:inline-flex">⌘↵</Kbd>
				</Button>
			</div>
		</div>
	</Card.Root>
{/if}
