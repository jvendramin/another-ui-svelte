<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { ApprovalDetail } from "$lib/registry/ui/approval-card/index.js";
	import type { ComposerModel } from "$lib/registry/ui/composer/index.js";

	export type AssistantApproval = {
		title: string;
		reason?: string;
		details?: ApprovalDetail[];
	};

	export type AssistantReply = { text: string; approval?: AssistantApproval };

	/**
	 * What `reply` returns: the whole answer, or text deltas as they stream in. Throw to show a failed turn with
	 * Retry. `signal` aborts when the person presses Stop.
	 */
	export type AssistantReplyResult = AssistantReply | AsyncIterable<string>;

	export type AssistantPrompt = { label: string; prompt?: string };

	type ChatMessage =
		| { id: string; role: "user"; text: string }
		| {
				id: string;
				role: "assistant";
				text: string;
				prompt: string;
				approval?: AssistantApproval;
				resolved?: "approved" | "denied";
				streaming?: boolean;
				/** The person pressed Stop before the answer finished. */
				stopped?: boolean;
				/** The id of the notice added after an approval, removed if the denial is undone. */
				noticeId?: string;
				error?: string;
				/** A plain follow-up, such as the outcome of an approval. It has no Retry. */
				notice?: boolean;
		  };

	const DEFAULT_MODELS: ComposerModel[] = [
		{ id: "model-a", label: "Model A", description: "Quick answers for everyday tasks" },
		{ id: "model-b", label: "Model B", description: "Longer, more careful replies" },
	];

	const DEFAULT_PROMPTS: AssistantPrompt[] = [
		{ label: "Summarize text" },
		{ label: "Help me write" },
		{ label: "Make a plan" },
		{ label: "Analyze data" },
	];

	/** Placeholder reply. Replace it with your model call. */
	function defaultReply(prompt: string): AssistantReply {
		if (/\b(schedule|event|meeting)\b/i.test(prompt) && !/\b(cancel|delete)\b/i.test(prompt)) {
			return {
				text: "I can add that to your calendar. Check the details before anything is saved.",
				approval: {
					title: "Add event to calendar",
					reason: "You asked me to schedule this.",
					details: [
						{ label: "Action", value: "Create an event from this request" },
						{ label: "Status", value: "Placeholder, no calendar connected" },
					],
				},
			};
		}
		return { text: "Here is a first draft. Tell me what to change and I will adjust it." };
	}
</script>

<script lang="ts">
	import { tick } from "svelte";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { ApprovalCard } from "$lib/registry/ui/approval-card/index.js";
	import * as Bubble from "$lib/registry/ui/bubble/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";
	import { Composer } from "$lib/registry/ui/composer/index.js";
	import * as Message from "$lib/registry/ui/message/index.js";
	import { MessageToolbar } from "$lib/registry/ui/message-toolbar/index.js";
	import * as Sheet from "$lib/registry/ui/sheet/index.js";
	import * as Tooltip from "$lib/registry/ui/tooltip/index.js";
	import { cn } from "$lib/utils.js";

	// A floating card docked to the right of the app, inset from the edges, over a lightly dimmed page. The Sheet gives
	// the focus trap, Escape to close and focus back to the trigger. The welcome state is centred with prompt chips;
	// once a message is sent the thread replaces it. `reply` builds each answer, either whole or as a stream of text
	// deltas, so a real model call can fill the bubble as it arrives; an approval it returns shows an Approval Card,
	// and nothing runs until the person approves. Ported from the Another UI (React) AI Assistant.
	let {
		open = $bindable(false),
		trigger,
		name = "there",
		models = DEFAULT_MODELS,
		prompts = DEFAULT_PROMPTS,
		reply = defaultReply,
		onapprove,
		class: className,
	}: {
		open?: boolean;
		/** The button that opens the panel. Pass nothing to open it with `open` yourself. */
		trigger?: Snippet<[{ props: Record<string, unknown> }]>;
		/** Shown in the greeting. A placeholder by default, never a real name. */
		name?: string;
		/** The choices in the model picker. The first one is selected at start. */
		models?: ComposerModel[];
		/** The chips on the welcome screen. They send `prompt`, or `label` when there is none. */
		prompts?: AssistantPrompt[];
		/** Builds the reply. The model id is the one selected in the picker. */
		reply?: (
			prompt: string,
			model: string,
			signal: AbortSignal
		) => AssistantReplyResult | Promise<AssistantReplyResult>;
		/** Called when the person approves a card. The panel does not act on approval by itself. */
		onapprove?: (approval: AssistantApproval, options: { always: boolean }) => void;
		class?: string;
	} = $props();

	let messages = $state<ChatMessage[]>([]);
	let draft = $state("");
	let model = $state<string | undefined>(undefined);
	let busy = $state(false);
	let seq = 0;
	// Follow the stream only while the reader is at the bottom, so scrolling up to reread is not undone.
	let stick = true;
	// One short message per finished turn for screen readers; the streaming bubble itself is not announced.
	let announce = $state("");
	let abort: AbortController | null = null;
	let scroller = $state<HTMLElement | null>(null);
	let composerBox = $state<HTMLElement | null>(null);
	const nextId = (p: string) => `${p}-${++seq}`;

	function focusComposer() {
		composerBox?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
	}

	function onscroll() {
		if (scroller) stick = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80;
	}

	async function toBottom(force = false) {
		if (force) stick = true;
		await tick();
		if (stick) scroller?.scrollTo({ top: scroller.scrollHeight });
	}

	function patch(id: string, change: Partial<Extract<ChatMessage, { role: "assistant" }>>) {
		const i = messages.findIndex((m) => m.id === id);
		if (i >= 0 && messages[i].role === "assistant") Object.assign(messages[i], change);
	}

	// Runs one reply into the assistant message `id`, streaming when `reply` gives text deltas.
	async function run(id: string, prompt: string, modelId: string | undefined) {
		abort?.abort();
		const controller = new AbortController();
		abort = controller;
		busy = true;
		patch(id, {
			text: "",
			approval: undefined,
			resolved: undefined,
			noticeId: undefined,
			stopped: false,
			error: undefined,
			streaming: true,
		});
		try {
			const result = await reply(prompt, modelId ?? "", controller.signal);
			if (Symbol.asyncIterator in (result as object)) {
				for await (const delta of result as AsyncIterable<string>) {
					if (controller.signal.aborted) break;
					const i = messages.findIndex((m) => m.id === id);
					if (i >= 0 && messages[i].role === "assistant") messages[i].text += delta;
					toBottom();
				}
			} else if (!controller.signal.aborted) {
				const r = result as AssistantReply;
				patch(id, { text: r.text, approval: r.approval });
			}
			if (controller.signal.aborted) patch(id, { stopped: true });
		} catch (e) {
			if (!controller.signal.aborted) {
				patch(id, { error: e instanceof Error ? e.message : "Something went wrong." });
			}
		} finally {
			patch(id, { streaming: false });
			if (!controller.signal.aborted) {
				const done = messages.find((m) => m.id === id);
				if (done?.role === "assistant") announce = done.error ? "The assistant could not answer." : `Assistant: ${done.text}`;
			}
			if (abort === controller) {
				abort = null;
				busy = false;
			}
			toBottom();
		}
	}

	function ask(prompt: string, modelId = model ?? models[0]?.id) {
		const text = prompt.trim();
		if (!text) return;
		const assistantId = nextId("a");
		messages.push(
			{ id: nextId("u"), role: "user", text },
			{ id: assistantId, role: "assistant", text: "", prompt: text, streaming: true }
		);
		toBottom(true);
		run(assistantId, text, modelId);
	}

	function stop() {
		abort?.abort();
	}

	function resolve(
		m: Extract<ChatMessage, { role: "assistant" }>,
		outcome: "approved" | "denied",
		always = false
	) {
		const noticeId = nextId("a");
		patch(m.id, { resolved: outcome, noticeId });
		if (outcome === "approved" && m.approval) onapprove?.(m.approval, { always });
		messages.push({
			id: noticeId,
			role: "assistant",
			text:
				outcome === "approved"
					? "Approved. Nothing runs from this panel until your app handles the approval."
					: "Cancelled. Nothing was saved.",
			prompt: "",
			notice: true,
		});
		toBottom();
	}

	// Undoing a denial puts the card back, so the notice that followed it goes away.
	function undo(m: Extract<ChatMessage, { role: "assistant" }>) {
		messages = messages.filter((x) => x.id !== m.noticeId);
		patch(m.id, { resolved: undefined, noticeId: undefined });
	}

	let showMore = $state(false);
	const visiblePrompts = $derived(showMore ? prompts : prompts.slice(0, 4));
</script>

<Tooltip.Provider>
	<Sheet.Root bind:open>
		{#if trigger}
			<Sheet.Trigger>
				{#snippet child({ props })}
					{@render trigger({ props })}
				{/snippet}
			</Sheet.Trigger>
		{/if}
		<Sheet.Content
			side="right"
			data-slot="ai-assistant"
			showCloseButton={false}
			onOpenAutoFocus={(e) => {
				// Start in the composer, not on the first chip.
				e.preventDefault();
				focusComposer();
			}}
			class={cn(
				"top-3! right-3! bottom-auto! left-auto! h-[min(38rem,calc(100dvh-1.5rem))]! w-[calc(100%-1.5rem)]! gap-0 overflow-hidden rounded-2xl border bg-background p-0 shadow-xl sm:max-w-[400px]!",
				className
			)}
		>
			<Sheet.Header class="sr-only">
				<Sheet.Title>AI assistant</Sheet.Title>
				<Sheet.Description>Ask a question or pick a prompt.</Sheet.Description>
			</Sheet.Header>

			<div class="flex shrink-0 items-center justify-end gap-1 px-4 pt-3">
				<Sheet.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="ghost" size="icon-sm" aria-label="Close assistant">
							<IconPlaceholder
								lucide="XIcon"
								tabler="IconX"
								hugeicons="Cancel01Icon"
								phosphor="XIcon"
								remixicon="RiCloseLine"
							/>
						</Button>
					{/snippet}
				</Sheet.Close>
			</div>

			<div
				bind:this={scroller}
				{onscroll}
				class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-2 pb-4"
			>
				{#if messages.length === 0}
					<div class="flex flex-col items-center gap-3 pt-10 text-center">
						<IconPlaceholder
							lucide="SparklesIcon"
							tabler="IconSparkles"
							hugeicons="SparklesIcon"
							phosphor="SparkleIcon"
							remixicon="RiSparklingLine"
							class="size-10 text-foreground"
							aria-hidden="true"
						/>
						<p class="mt-3 text-sm text-muted-foreground">Hi {name},</p>
						<h2 class="text-lg font-semibold tracking-tight">Welcome back! How can I help?</h2>
						<p class="max-w-64 text-sm text-balance text-muted-foreground">
							Pick a starting point or type below.
						</p>
						<div role="group" aria-label="Prompt ideas" class="mt-4 flex flex-wrap justify-center gap-2">
							{#each visiblePrompts as p, i (i)}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onclick={() => ask(p.prompt ?? p.label)}
									class="rounded-full bg-background"
								>
									{p.label}
								</Button>
							{/each}
							{#if prompts.length > 4}
								<Button
									type="button"
									variant="outline"
									size="sm"
									aria-expanded={showMore}
									onclick={() => (showMore = !showMore)}
									class="rounded-full bg-background"
								>
									{showMore ? "Less" : "More"}
								</Button>
							{/if}
						</div>
					</div>
				{/if}
				<!-- Always mounted, so screen readers announce the first reply. -->
				<div role="log" aria-live="off" aria-label="Conversation" class="flex flex-col gap-6">
					{#each messages as m (m.id)}
						{#if m.role === "user"}
							<div class="flex flex-col pb-10">
								<Message.Root align="end">
									<Message.Content>
										<Bubble.Root variant="muted" align="end">
											<Bubble.Content class="whitespace-pre-wrap">{m.text}</Bubble.Content>
										</Bubble.Root>
									</Message.Content>
									<MessageToolbar
										text={m.text}
										onedit={() => {
											draft = m.text;
											tick().then(focusComposer);
										}}
										onretry={busy ? undefined : () => ask(m.text)}
										class="right-0"
									/>
								</Message.Root>
							</div>
						{:else}
							<div class="flex flex-col pb-10">
								<Message.Root align="start">
									<Message.Content class="w-full min-w-0 gap-3">
										{#if m.text || m.streaming}
											<Bubble.Root variant="ghost">
												<Bubble.Content class="whitespace-pre-wrap">
													{#if m.streaming && !m.text}
														<span class="text-muted-foreground">Thinking...</span>
													{:else}
														{m.text}
													{/if}
												</Bubble.Content>
											</Bubble.Root>
										{/if}
										{#if m.stopped}
											<p class="m-0 text-xs text-muted-foreground">Stopped.</p>
										{/if}
										{#if m.error}
											<p class="m-0 text-sm text-destructive" role="alert">{m.error}</p>
										{/if}
										{#if m.approval}
											<ApprovalCard
												title={m.approval.title}
												reason={m.approval.reason}
												details={m.approval.details}
												onapprove={({ always }) => resolve(m, "approved", always)}
												ondeny={() => resolve(m, "denied")}
												onundo={() => undo(m)}
											/>
										{/if}
									</Message.Content>
									{#if !m.streaming}
										<MessageToolbar
											text={m.text}
											onimprove={m.text
												? () => {
														draft = `Improve this: ${m.text}`;
														focusComposer();
													}
												: undefined}
											onretry={m.notice || m.resolved || busy ? undefined : () => run(m.id, m.prompt, model ?? models[0]?.id)}
											class="left-0"
										/>
									{/if}
								</Message.Root>
							</div>
						{/if}
					{/each}
				</div>
			</div>

			<div class="sr-only" aria-live="polite" aria-atomic="true">{announce}</div>

			<div bind:this={composerBox} class="shrink-0 p-3">
				<Composer
					bind:value={draft}
					bind:model
					{models}
					{busy}
					placeholder="Ask me anything..."
					onsubmit={(text, modelId) => ask(text, modelId)}
					onstop={stop}
				/>
			</div>
		</Sheet.Content>
	</Sheet.Root>
</Tooltip.Provider>
