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
	};
</script>

<script lang="ts" generics="T">
	import { Skeleton } from "skullet/svelte";
	import * as Alert from "$lib/registry/ui/alert/index.js";
	import * as Empty from "$lib/registry/ui/empty/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";

	// Wraps Skullet's Skeleton so loading, empty and error states look the same everywhere: the skeleton is traced from your
	// own component (pass a `sample`), the empty and error states use Empty and Alert, and the colours come from the
	// --skullet-base and --skullet-highlight tokens that ledger-tokens installs.
	let props: LoadingProps<T> = $props();

	// Skullet is "data driven" when `data` is passed at all, even as undefined, so only pass it when the caller did.
	const driven = $derived("data" in props ? { data: props.data } : {});

	const message = (error: unknown) =>
		error instanceof Error ? error.message : typeof error === "string" ? error : "";
</script>

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
					<Button type="button" size="sm" variant="outline" class="mt-2" onclick={props.onRetry}>
						{props.retryLabel ?? "Try again"}
					</Button>
				{/if}
			</Alert.Root>
		{/if}
	{/snippet}
</Skeleton>
