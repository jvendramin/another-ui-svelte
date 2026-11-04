<script lang="ts">
	import {
		Composer,
		ComposerFooter,
		ComposerHeader,
		ComposerUsage,
		type ComposerModel,
	} from "$lib/registry/ui/composer/index.js";
	import * as Tooltip from "$lib/registry/ui/tooltip/index.js";

	const models: ComposerModel[] = [
		{ id: "opus", label: "Opus 5.5", description: "Most capable, for hard problems" },
		{ id: "sonnet", label: "Sonnet 5.5", description: "Fast and smart for everyday work" },
		{ id: "haiku", label: "Haiku 4.5", description: "Fastest, for quick answers" },
	];

	let busy = $state(false);
	let last = $state("");
	let timer: ReturnType<typeof setTimeout> | undefined;

	function send(text: string, model?: string) {
		last = `Sent to ${model}: ${text}`;
		busy = true;
		timer = setTimeout(() => (busy = false), 2500);
	}

	function stop() {
		clearTimeout(timer);
		busy = false;
		last = "Stopped.";
	}
</script>

<Tooltip.Provider>
	<div class="flex w-full max-w-xl flex-col">
		<ComposerHeader>
			<span class="font-medium">New chat</span>
			<span class="text-muted-foreground">Enter sends, Shift+Enter adds a line</span>
		</ComposerHeader>
		<Composer {models} {busy} onsubmit={send} onstop={stop} />
		<ComposerFooter>
			<ComposerUsage used={820} total={1000} />
			<span aria-live="polite">{last}</span>
		</ComposerFooter>
	</div>
</Tooltip.Provider>
