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
	import { untrack } from "svelte";
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
	// Pressing Try again removes the button that had focus (the error pane leaves for the skeleton). When the error comes back,
	// however long the retry took, focus goes to the new button, as long as focus was lost with the old one. The press is
	// forgotten once the retry worked, or after PRESS_MS, so a refetch failing later never takes focus.
	const PRESS_MS = 60_000;
	let retryEl = $state<HTMLElement | null>(null);
	let wantFocus = $state(false);
	let oldRetryEl: HTMLElement | null = null;
	let pending = false;
	let pressedAt = 0;
	let sawLoading = false;
	const retry = () => {
		pending = true;
		pressedAt = Date.now();
		sawLoading = false;
		try {
			props.onRetry?.();
		} catch (e) {
			pending = false;
			throw e;
		}
	};
	const isThenable = (v: unknown): v is PromiseLike<T> =>
		typeof (v as PromiseLike<T> | null)?.then === "function";
	// A `data` promise that rejects shows the error pane too, so watch for that as well as the `error` prop.
	let rejected = $state.raw<unknown>(null);
	$effect(() => {
		const source = props.data;
		if (!isThenable(source)) return;
		let live = true;
		source.then(
			() => {
				if (live && props.data === source) pending = false;
			},
			() => {
				if (live && props.data === source) rejected = source;
			}
		);
		return () => (live = false);
	});
	const erroring = $derived(
		!props.loading && (!!props.error || (rejected !== null && rejected === props.data))
	);
	const busy = $derived(!!props.loading || ("data" in props && props.data == null));
	let run = $state(0);
	let wasErroring = false;
	let leftAt = 0;
	$effect.pre(() => {
		const now = erroring;
		const loadingNow = busy;
		const emptyNow = !!props.empty;
		untrack(() => {
			if (pending && loadingNow) sawLoading = true;
			// The retry worked (content or the empty state after the skeleton): nothing to restore.
			if (pending && sawLoading && !now && !loadingNow && (emptyNow || !isThenable(props.data)))
				pending = false;
			const comesBack = now && !wasErroring;
			if (comesBack && Date.now() - leftAt < EXIT_MS) run++;
			if (comesBack && pending) {
				pending = false;
				if (Date.now() - pressedAt < PRESS_MS) {
					oldRetryEl = retryEl;
					wantFocus = true;
				}
			}
			if (!now) wantFocus = false;
			if (!now && wasErroring) leftAt = Date.now();
			wasErroring = now;
		});
	});
	// Focus the new Try again button once it is there, however late Skullet mounts it.
	$effect(() => {
		if (!wantFocus || !retryEl || retryEl === oldRetryEl) return;
		const active = document.activeElement;
		const lost =
			!active || active === document.body || !active.isConnected || active === oldRetryEl;
		if (lost) retryEl.focus();
		wantFocus = false;
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
