<script lang="ts" module>
	export type ReasoningStepKind = "think" | "search" | "read" | "code" | "tool";
	export type ReasoningStepStatus = "pending" | "running" | "done" | "error";
	export type ReasoningSource = { title: string; href?: string };
	export type ReasoningStep = {
		id: string;
		kind: ReasoningStepKind;
		title: string;
		detail?: string;
		status: ReasoningStepStatus;
		sources?: ReasoningSource[];
	};

	function formatSeconds(ms: number) {
		const s = Math.max(1, Math.round(ms / 1000));
		if (s < 60) return `${s}s`;
		return `${Math.floor(s / 60)}m ${s % 60}s`;
	}
</script>

<script lang="ts">
	import { untrack, type Snippet } from "svelte";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import * as Collapsible from "$lib/registry/ui/collapsible/index.js";
	import { Spinner } from "$lib/registry/ui/spinner/index.js";
	import { cn } from "$lib/utils.js";
	import ShimmerText from "./shimmer-text.svelte";

	// The thinking trace above an AI answer. While it streams, the label shimmers and a timer counts up; when it
	// finishes it settles to "Thought for 12s" and folds away. The body is a list of steps (think, search, read, code,
	// tool) joined by a line, each with its own status. Ported from the Another UI (React) Reasoning.
	let {
		steps,
		streaming = false,
		duration,
		open = $bindable(),
		autoOpen = true,
		autoClose = true,
		label = "Thinking",
		class: className,
		children,
	}: {
		steps: ReasoningStep[];
		/** True while the model is still thinking. */
		streaming?: boolean;
		/** How long it thought, in milliseconds. Measured for you while streaming if left out. */
		duration?: number;
		open?: boolean;
		/** Opens when streaming starts. */
		autoOpen?: boolean;
		/** Folds away when streaming ends. */
		autoClose?: boolean;
		label?: string;
		class?: string;
		/** Extra content below the steps, such as a summary. */
		children?: Snippet;
	} = $props();

	// svelte-ignore state_referenced_locally
	let isOpen = $state(open ?? (streaming && autoOpen));
	$effect(() => {
		if (open !== undefined) isOpen = open;
	});

	// The timer runs while streaming and keeps the last value after.
	let elapsed = $state(0);
	$effect(() => {
		if (!streaming) return;
		const started = Date.now();
		elapsed = 0;
		const id = setInterval(() => (elapsed = Date.now() - started), 1000);
		return () => {
			clearInterval(id);
			elapsed = Date.now() - started;
		};
	});

	// Open when thinking starts, fold away when it ends.
	let was = untrack(() => streaming);
	$effect(() => {
		const now = streaming;
		if (now && !was && autoOpen) isOpen = true;
		if (!now && was && autoClose) isOpen = false;
		was = now;
	});

	const ms = $derived(duration ?? elapsed);
	const failed = $derived(steps.some((s) => s.status === "error"));

	const KIND_ICONS = {
		think: {
			lucide: "BrainIcon",
			tabler: "IconBrain",
			hugeicons: "AiBrainIcon",
			phosphor: "BrainIcon",
			remixicon: "RiBrainLine",
		},
		search: {
			lucide: "SearchIcon",
			tabler: "IconSearch",
			hugeicons: "Search01Icon",
			phosphor: "MagnifyingGlassIcon",
			remixicon: "RiSearchLine",
		},
		read: {
			lucide: "BookOpenIcon",
			tabler: "IconBook",
			hugeicons: "BookOpen02Icon",
			phosphor: "BookOpenIcon",
			remixicon: "RiBookOpenLine",
		},
		code: {
			lucide: "CodeIcon",
			tabler: "IconCode",
			hugeicons: "CodeIcon",
			phosphor: "CodeIcon",
			remixicon: "RiCodeLine",
		},
		tool: {
			lucide: "WrenchIcon",
			tabler: "IconTool",
			hugeicons: "Wrench01Icon",
			phosphor: "WrenchIcon",
			remixicon: "RiToolsLine",
		},
	} as const;
</script>

<Collapsible.Root
	bind:open={isOpen}
	onOpenChange={(next) => (open = next)}
	data-slot="reasoning"
	data-streaming={streaming ? "" : undefined}
	class={cn("group/reasoning flex w-full min-w-0 flex-col text-sm", className)}
>
	<Collapsible.Trigger
		class="flex w-fit max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
	>
		<IconPlaceholder {...KIND_ICONS.think} class="size-4 shrink-0" />
		{#if streaming}
			<span class="flex min-w-0 items-center gap-1.5">
				<ShimmerText class="truncate">{label}...</ShimmerText>
				{#if elapsed >= 1000}
					<span class="text-xs tabular-nums">{formatSeconds(elapsed)}</span>
				{/if}
			</span>
		{:else}
			<span class="truncate">{failed ? "Stopped after " : "Thought for "}{formatSeconds(ms)}</span>
		{/if}
		<IconPlaceholder
			lucide="ChevronDownIcon"
			tabler="IconChevronDown"
			hugeicons="ArrowDown01Icon"
			phosphor="CaretDownIcon"
			remixicon="RiArrowDownSLine"
			class="size-3.5 shrink-0 transition-transform group-data-[state=open]/reasoning:-scale-y-100"
		/>
	</Collapsible.Trigger>
	<Collapsible.Content>
		<ol data-slot="reasoning-steps" class="m-0 flex list-none flex-col p-0 pt-2">
			{#each steps as step, i (step.id)}
				{@const last = i === steps.length - 1 && !children}
				<li
					data-slot="reasoning-step"
					data-status={step.status}
					data-kind={step.kind}
					class="relative m-0 flex min-w-0 gap-2.5 pb-3 last:pb-1"
				>
					{#if !last}
						<span
							aria-hidden="true"
							class="absolute top-6 bottom-1 left-2.5 w-px -translate-x-1/2 bg-border transition-colors duration-300 data-done:bg-foreground/25"
							data-done={step.status === "done" ? "" : undefined}
						></span>
					{/if}
					<span
						class={cn(
							"relative flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
							step.status === "running" && "bg-background text-foreground",
							step.status === "pending" && "opacity-50",
							step.status === "error" && "bg-destructive/10 text-destructive"
						)}
					>
						{#if step.status === "running"}
							<Spinner class="size-3.5" />
						{:else if step.status === "error"}
							<IconPlaceholder
								lucide="AlertCircleIcon"
								tabler="IconAlertCircle"
								hugeicons="AlertCircleIcon"
								phosphor="WarningCircleIcon"
								remixicon="RiErrorWarningLine"
								class="size-3.5"
							/>
						{:else}
							<IconPlaceholder {...KIND_ICONS[step.kind]} class="size-3.5" />
						{/if}
					</span>
					<div class="flex min-w-0 flex-1 flex-col gap-1 pt-px">
						<span
							class={cn(
								"min-w-0 font-medium wrap-break-word",
								step.status === "pending" ? "text-muted-foreground" : "text-foreground",
								step.status === "error" && "text-destructive"
							)}
						>
							{#if step.status === "running"}
								<ShimmerText>{step.title}</ShimmerText>
							{:else}
								{step.title}
							{/if}
						</span>
						{#if step.detail}
							<div class="min-w-0 whitespace-pre-wrap text-muted-foreground wrap-break-word">
								{step.detail}
							</div>
						{/if}
						{#if step.sources && step.sources.length > 0}
							<ul class="m-0 flex list-none flex-wrap gap-1.5 p-0 pt-0.5">
								{#each step.sources as s, i (i)}
									<li class="m-0 min-w-0">
										{#if s.href}
											<a
												href={s.href}
												target="_blank"
												rel="noreferrer"
												class="flex max-w-56 items-center gap-1 truncate rounded-md border bg-background px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
											>
												<span class="truncate">{s.title}</span>
											</a>
										{:else}
											<span
												class="flex max-w-56 truncate rounded-md border bg-background px-1.5 py-0.5 text-xs text-muted-foreground"
											>
												{s.title}
											</span>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
		{#if children}<div class="pt-1 pl-7 text-muted-foreground">{@render children()}</div>{/if}
	</Collapsible.Content>
</Collapsible.Root>
