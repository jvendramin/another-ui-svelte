<script lang="ts" module>
	import type { Component, Snippet } from "svelte";

	export type ComposerModel = {
		id: string;
		label: string;
		description?: string;
		icon?: Component<{ class?: string }>;
		badge?: Snippet;
	};

	type Recognition = {
		continuous: boolean;
		interimResults: boolean;
		lang: string;
		start: () => void;
		stop: () => void;
		onresult:
			| ((e: {
					results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
			  }) => void)
			| null;
		onend: (() => void) | null;
		onerror: (() => void) | null;
	};

	function getRecognition(): (new () => Recognition) | null {
		if (typeof window === "undefined") return null;
		const w = window as unknown as {
			SpeechRecognition?: new () => Recognition;
			webkitSpeechRecognition?: new () => Recognition;
		};
		return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
	}
</script>

<script lang="ts">
	import { onMount } from "svelte";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import * as DropdownMenu from "$lib/registry/ui/dropdown-menu/index.js";
	import * as InputGroup from "$lib/registry/ui/input-group/index.js";
	import * as Tooltip from "$lib/registry/ui/tooltip/index.js";
	import { cn } from "$lib/utils.js";

	// The text box at the bottom of an AI chat. An Input Group with a growing textarea, a model picker leading the
	// bottom row, and voice dictation and send trailing it. Enter sends, Shift+Enter adds a line. While a reply streams
	// (`busy`), send turns into stop. Ported from the Another UI (React) Composer.
	let {
		value = $bindable(""),
		models,
		model = $bindable(),
		placeholder = "Ask anything",
		disabled = false,
		busy = false,
		maxRows = 8,
		onsubmit,
		onstop,
		class: className,
	}: {
		value?: string;
		models?: ComposerModel[];
		/** The selected model id. Defaults to the first model. */
		model?: string;
		placeholder?: string;
		disabled?: boolean;
		/** While a reply streams, send turns into stop. */
		busy?: boolean;
		maxRows?: number;
		onsubmit?: (value: string, model?: string) => void;
		onstop?: () => void;
		class?: string;
	} = $props();

	const modelId = $derived(model ?? models?.[0]?.id);
	const current = $derived(models?.find((m) => m.id === modelId));
	const canSend = $derived(!disabled && value.trim().length > 0);

	// Voice dictation through the browser's speech recognition, when it has one.
	let voice = $state<"unsupported" | "idle" | "listening">("idle");
	let recognition: Recognition | null = null;
	let base = "";
	let textarea = $state<HTMLTextAreaElement | null>(null);

	onMount(() => {
		if (!getRecognition()) voice = "unsupported";
		return () => recognition?.stop();
	});

	function toggleVoice() {
		if (voice === "listening") {
			recognition?.stop();
			return;
		}
		const Ctor = getRecognition();
		if (!Ctor) return;
		const r = new Ctor();
		r.continuous = true;
		r.interimResults = true;
		r.lang = navigator.language || "en-US";
		base = value ? value.replace(/\s*$/, " ") : "";
		r.onresult = (e) => {
			let text = "";
			for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
			value = base + text.trimStart();
		};
		r.onend = () => {
			voice = "idle";
			textarea?.focus();
		};
		r.onerror = () => (voice = "idle");
		recognition = r;
		r.start();
		voice = "listening";
	}

	function submit() {
		if (busy) {
			onstop?.();
			return;
		}
		if (!canSend) return;
		recognition?.stop();
		onsubmit?.(value.trim(), modelId);
		value = "";
		textarea?.focus();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			submit();
		}
	}
</script>

<InputGroup.Root
	data-slot="composer"
	data-disabled={disabled ? "true" : undefined}
	class={cn("bg-background", className)}
>
	<InputGroup.Textarea
		bind:ref={textarea}
		bind:value
		{disabled}
		placeholder={voice === "listening" ? "Listening..." : placeholder}
		aria-label="Message"
		rows={1}
		{onkeydown}
		style="max-height: calc({maxRows} * 1.5em + 1rem)"
		class="min-h-14 px-3 pt-3 text-base [field-sizing:content] md:text-sm"
	/>
	<InputGroup.Addon align="block-end" class="gap-1">
		{#if models && models.length > 0}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<InputGroup.Button {...props} size="xs" class="text-muted-foreground" {disabled}>
							{#if current?.icon}
								<current.icon />
							{:else}
								<IconPlaceholder lucide="SparklesIcon" tabler="IconSparkles" hugeicons="SparklesIcon" phosphor="SparkleIcon" remixicon="RiSparklingLine" />
							{/if}
							{current?.label ?? "Model"}
							<IconPlaceholder lucide="ChevronDownIcon" tabler="IconChevronDown" hugeicons="ArrowDown01Icon" phosphor="CaretDownIcon" remixicon="RiArrowDownSLine" />
						</InputGroup.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" side="top" class="w-64">
					<DropdownMenu.Label>Model</DropdownMenu.Label>
					<DropdownMenu.Separator />
					{#each models as m (m.id)}
						<DropdownMenu.Item
							onSelect={() => (model = m.id)}
							data-active={m.id === modelId ? "" : undefined}
							class="items-start data-active:bg-accent"
						>
							{#if m.icon}
								<m.icon class="mt-0.5" />
							{:else}
								<IconPlaceholder lucide="SparklesIcon" tabler="IconSparkles" hugeicons="SparklesIcon" phosphor="SparkleIcon" remixicon="RiSparklingLine" class="mt-0.5" />
							{/if}
							<span class="flex min-w-0 flex-1 flex-col">
								<span class="flex items-center gap-2 font-medium">
									{m.label}
									{#if m.badge}{@render m.badge()}{/if}
								</span>
								{#if m.description}
									<span class="text-xs text-muted-foreground">{m.description}</span>
								{/if}
							</span>
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
		<div class="ml-auto flex items-center gap-1">
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<InputGroup.Button
							{...props}
							size="icon-sm"
							aria-label={voice === "listening" ? "Stop dictation" : "Dictate"}
							aria-pressed={voice === "listening"}
							{disabled}
							aria-disabled={voice === "unsupported" ? true : undefined}
							data-listening={voice === "listening" ? "" : undefined}
							class="rounded-full data-listening:bg-destructive/10 data-listening:text-destructive aria-disabled:opacity-50"
							onclick={toggleVoice}
						>
							<IconPlaceholder lucide="MicIcon" tabler="IconMicrophone" hugeicons="Mic01Icon" phosphor="MicrophoneIcon" remixicon="RiMicLine" class={cn(voice === "listening" && "animate-pulse")} />
						</InputGroup.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>
					{voice === "unsupported"
						? "Dictation is not available in this browser"
						: voice === "listening"
							? "Stop dictation"
							: "Dictate"}
				</Tooltip.Content>
			</Tooltip.Root>
			<InputGroup.Button
				size="icon-sm"
				variant="default"
				aria-label={busy ? "Stop" : "Send message"}
				disabled={busy ? false : !canSend}
				class="rounded-full"
				onclick={submit}
			>
				{#if busy}<IconPlaceholder lucide="StopCircleIcon" tabler="IconPlayerStop" hugeicons="StopCircleIcon" phosphor="StopCircleIcon" remixicon="RiStopCircleLine" />{:else}<IconPlaceholder lucide="ArrowUpIcon" tabler="IconArrowUp" hugeicons="ArrowUp01Icon" phosphor="ArrowUpIcon" remixicon="RiArrowUpLine" />{/if}
			</InputGroup.Button>
		</div>
	</InputGroup.Addon>
</InputGroup.Root>
