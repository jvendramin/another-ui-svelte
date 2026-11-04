<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type LoadingProps<T> = {
		/** Loading while `null`, `undefined` or a promise yet to settle. Handed to `children` once it is there. Leave it out to drive loading with `loading` instead. */
		data?: T | null | PromiseLike<T>;
		/** Stands in for `data` to draw the first skeleton. The skeleton is traced from your component rendered with this. */
		sample?: T;
		/** Shows the skeleton even over data, such as while refetching. */
		loading?: boolean;
		/** Remembers the skeleton's shape across visits under this key. */
		id?: string;
		/** Read to screen readers while loading. */
		label?: string;
		/** Shows the empty state instead of the content. */
		empty?: boolean;
		/** Shows the error state instead of the content when set. */
		error?: unknown;
		emptyTitle?: string;
		emptyDescription?: string;
		errorTitle?: string;
		/** Adds a button to the error state that calls this. */
		onRetry?: () => void;
		retryLabel?: string;
		/** Called once content has come in over a skeleton. */
		onreveal?: () => void;
		/** The real content. Receives the data when `data` is used. */
		children?: Snippet<[T]>;
		/** Replaces the measured skeleton. */
		skeleton?: Snippet;
		/** Replaces the default empty state. */
		emptyMessage?: Snippet;
		/** Replaces the default error state. Receives the error. */
		errorMessage?: Snippet<[unknown]>;
		class?: string;
		style?: string;
	};
</script>

<script lang="ts" generics="T">
	import { Skeleton } from "skullet/svelte";
	import { tick, untrack } from "svelte";
	import * as Alert from "$lib/registry/ui/alert/index.js";
	import * as Empty from "$lib/registry/ui/empty/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";

	// Wraps Skullet's Skeleton so loading, empty and error states look the same everywhere: the skeleton is traced from your
	// own component (pass a `sample`), the empty and error states use Empty and Alert, and the colours come from the
	// --skullet-base and --skullet-highlight tokens that ledger-tokens installs.
	let props: LoadingProps<T> = $props();

	// Skullet is "data driven" when `data` is passed at all, even as undefined, so only pass it when the caller did.
	const driven = $derived("data" in props ? { data: props.data } : {});

	// Skullet swaps its panes with Svelte transitions. When the error pane is on its way out (a retry swapped in the skeleton)
	// and the error comes straight back, Svelte resumes that same exiting pane and it stays at opacity 0 with pointer events off:
	// a blank list whose Try again button cannot be seen or clicked. So an error that returns within EXIT_MS of leaving gets a
	// fresh Skeleton. Any other error keeps the one it has, and with it the skeleton to error cross-fade.
	// TODO: drop the key once Skullet fixes this (https://github.com/lochie/skullet/issues/13, seen in skullet 0.0.3).
	// EXIT_MS is several times Skullet's exit fade, long enough to cover a pane still on its way out.
	const EXIT_MS = 1500;
	let retryEl = $state<HTMLElement | null>(null);
	// Set when Try again is pressed, cleared when the error pane comes back. Pressing it removes the button that had focus (the
	// error pane leaves for the skeleton), so when the error returns, however long the retry took, focus goes to its new button.
	let retryPending = false;
	const retry = () => {
		retryPending = true;
		try {
			props.onRetry?.();
		} catch (e) {
			retryPending = false;
			throw e;
		}
	};
	const isThenable = (v: unknown) => typeof (v as PromiseLike<T> | null)?.then === "function";
	// A `data` promise that rejects shows the error pane too, so watch for that as well as the `error` prop.
	let rejected = $state.raw<unknown>(null);
	$effect(() => {
		const source = props.data;
		if (typeof (source as PromiseLike<T> | null)?.then !== "function") return;
		let live = true;
		(source as PromiseLike<T>).then(
			() => {},
			() => {
				if (live && props.data === source) rejected = source;
			}
		);
		return () => (live = false);
	});
	const erroring = $derived(
		!props.loading && (!!props.error || (rejected !== null && rejected === props.data))
	);
	let run = $state(0);
	let wasErroring = false;
	let leftAt = 0;
	// A retry that worked leaves nothing to restore: forget the press, or a refetch failing minutes later would take focus.
	$effect.pre(() => {
		const settled =
			!erroring &&
			!props.loading &&
			("data" in props ? props.data != null && !isThenable(props.data) : true);
		if (settled || props.empty) untrack(() => (retryPending = false));
	});
	$effect.pre(() => {
		const now = erroring;
		untrack(() => {
			const comesBack = now && !wasErroring;
			if (comesBack && Date.now() - leftAt < EXIT_MS) run++;
			if (comesBack && retryPending) {
				retryPending = false;
				// Only when focus was lost with the button (on the body, or still on the old button that is on its way out):
				// if the person has moved on and focus is somewhere real, leave it.
				const active = document.activeElement;
				const old = retryEl;
				const lost = !active || active === document.body || !active.isConnected || active === old;
				if (lost) {
					const focusNew = () => {
						if (retryEl && retryEl !== old) retryEl.focus();
					};
					tick().then(() => {
						focusNew();
						// The new pane can mount a frame later than this tick.
						if (!retryEl || retryEl === old) requestAnimationFrame(focusNew);
					});
				}
			}
			if (!now && wasErroring) leftAt = Date.now();
			wasErroring = now;
		});
	});

	const message = (error: unknown) =>
		error instanceof Error ? error.message : typeof error === "string" ? error : "";
</script>

{#key run}
	<Skeleton
		{...driven}
		sample={props.sample}
		loading={props.loading}
		id={props.id}
		label={props.label ?? "Loading"}
		empty={props.empty}
		error={props.error}
		onreveal={props.onreveal}
		skeleton={props.skeleton}
		class={props.class}
		style={props.style}
	>
		{#snippet children(value: T)}
			{@render props.children?.(value)}
		{/snippet}
		{#snippet emptyMessage()}
			{#if props.emptyMessage}
				{@render props.emptyMessage()}
			{:else}
				<Empty.Root>
					<Empty.Header>
						<Empty.Title>{props.emptyTitle ?? "Nothing here yet"}</Empty.Title>
						{#if props.emptyDescription}
							<Empty.Description>{props.emptyDescription}</Empty.Description>
						{/if}
					</Empty.Header>
				</Empty.Root>
			{/if}
		{/snippet}
		{#snippet errorMessage(error: unknown)}
			{#if props.errorMessage}
				{@render props.errorMessage(error)}
			{:else}
				<Alert.Root variant="destructive">
					<Alert.Title>{props.errorTitle ?? "Could not load"}</Alert.Title>
					{#if message(error)}<Alert.Description>{message(error)}</Alert.Description>{/if}
					{#if props.onRetry}
						<Button
							bind:ref={retryEl}
							type="button"
							size="sm"
							variant="outline"
							class="mt-2"
							onclick={retry}
						>
							{props.retryLabel ?? "Try again"}
						</Button>
					{/if}
				</Alert.Root>
			{/if}
		{/snippet}
	</Skeleton>
{/key}
