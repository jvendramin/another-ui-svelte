<script lang="ts" module>
	import type { BadgeTone } from "$lib/registry/ui/badge/badge.svelte";
	import type { Snippet } from "svelte";

	export type KanbanColumn = { id: string; title: string; tone?: BadgeTone };

	/** What a drop reports: the card, where it came from and went to, and the new order of the target column. */
	export type KanbanMove = {
		id: string;
		from: string;
		to: string;
		/** The position of the card in the target column. */
		index: number;
		/** The ids of the target column in their new order. */
		order: string[];
	};

	/**
	 * Applies a move to a flat list of items and returns the new list. The card takes the target column
	 * (`setColumn`) and sits where `move.order` puts it among the target column's cards. Use it in `onMove`:
	 * `items = applyKanbanMove(items, move, { getColumn, setColumn })`.
	 */
	export function applyKanbanMove<T extends { id: string }>(
		items: T[],
		move: KanbanMove,
		options: { getColumn: (item: T) => string; setColumn: (item: T, columnId: string) => T }
	): T[] {
		const moved = items.find((item) => item.id === move.id);
		if (!moved) return items;
		const rest = items.filter((item) => item.id !== move.id);
		const updated = options.setColumn(moved, move.to);
		const nextId = move.order[move.order.indexOf(move.id) + 1];
		let at = nextId ? rest.findIndex((item) => item.id === nextId) : -1;
		if (at === -1) {
			// Last in its column: just after the column's current last card, or at the end.
			at = rest.length;
			for (let i = rest.length - 1; i >= 0; i--) {
				if (options.getColumn(rest[i]!) === move.to) {
					at = i + 1;
					break;
				}
			}
		}
		return [...rest.slice(0, at), updated, ...rest.slice(at)];
	}
</script>

<script lang="ts" generics="TItem extends { id: string }">
	import { tick } from "svelte";
	import { dndzone, TRIGGERS, type DndEvent } from "svelte-dnd-action";
	import { flip } from "svelte/animate";
	import * as Card from "$lib/registry/ui/card/index.js";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { Badge } from "$lib/registry/ui/badge/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";
	import { Input } from "$lib/registry/ui/input/index.js";
	import { cn } from "$lib/utils.js";

	// Ported from svelte-dnd-action (MIT): one dndzone per column, so cards drag within a column and between columns with a
	// pointer, with touch, and with the keyboard (Tab to a card, Space or Enter to pick it up, arrow keys to reorder it, Tab to move it to another column, Space to drop,
	// Escape to cancel). The Twenty look: grey columns with a count, white cards, an Add row at the bottom.
	let {
		columns,
		items,
		getColumn,
		card,
		onMove,
		onCardClick,
		onMoveError,
		onCreate,
		createLabel = "Add",
		createPlaceholder = "Title",
		class: className,
	}: {
		columns: KanbanColumn[];
		/** The cards, in order. The cards of a column appear in this order. */
		items: TItem[];
		/** The id of the column a card belongs to. */
		getColumn: (item: TItem) => string;
		/** What a card shows. Put a link or a button in it to give keyboard users a way to open the record. */
		card: Snippet<[{ item: TItem }]>;
		/** Called when a card is dropped in a new place. Update `items` (see applyKanbanMove). Throw to reject the move (see onMoveError). */
		onMove?: (move: KanbanMove) => void | Promise<void>;
		/** Called when onMove throws, after the cards snapped back. Show the user a message here. */
		onMoveError?: (error: unknown, move: KanbanMove) => void;
		/** Called when a card is clicked (not dragged). */
		onCardClick?: (item: TItem) => void;
		/** Shows an Add row at the bottom of each column. Called with the column id and the typed text. */
		onCreate?: (columnId: string, value: string) => void | Promise<void>;
		createLabel?: string;
		createPlaceholder?: string;
		class?: string;
	} = $props();

	const grouped = $derived.by(() => {
		const groups: Record<string, TItem[]> = Object.fromEntries(columns.map((c) => [c.id, []]));
		for (const item of items) (groups[getColumn(item)] ??= []).push(item);
		return groups;
	});

	// The columns as they look right now, including during a drag. Reset from the props whenever they change.
	// A derived value you can write to: it holds the cards on the first render (also on the server) and resets when the props change.
	let local = $derived(grouped);

	// Boards on the same page do not accept each other's cards.
	const boardId = $props.id();
	const dndType = `kanban-${boardId}`;

	let dragging = false;

	function consider(columnId: string, event: CustomEvent<DndEvent<TItem>>) {
		dragging = true;
		local = { ...local, [columnId]: event.detail.items };
	}

	async function finalize(columnId: string, event: CustomEvent<DndEvent<TItem>>) {
		local = { ...local, [columnId]: event.detail.items };
		setTimeout(() => (dragging = false), 0);
		const { id, trigger } = event.detail.info;
		// Only the column the card lands in reports the move; the column it left reports "dropped into another".
		if (trigger !== TRIGGERS.DROPPED_INTO_ZONE) return;
		const moved = items.find((item) => String(item.id) === String(id));
		if (!moved) return;
		const order = event.detail.items.map((item) => String(item.id));
		const to = columnId;
		const index = order.indexOf(String(id));
		const from = getColumn(moved);
		if (from === to && order.join() === grouped[to]?.map((i) => String(i.id)).join()) return;
		try {
			await onMove?.({ id: String(id), from, to, index, order });
		} catch (error) {
			// Rejected: show the cards where they were, and tell the app so it can show a message.
			local = grouped;
			onMoveError?.(error, { id: String(id), from, to, index, order });
		}
	}

	function click(item: TItem, event: MouseEvent) {
		// A click on a link or button inside the card belongs to that control.
		if ((event.target as Element).closest("a,button,input,textarea,select,[role=button]")) return;
		if (!dragging) onCardClick?.(item);
	}

	// Inline add, one column at a time. Each column keeps its own draft, so typing in one column and
	// clicking Add in another does not lose the text.
	let adding = $state<string | null>(null);
	let drafts = $state<Record<string, string>>({});
	let busy = $state(false);
	let failedColumn = $state<string | null>(null);
	let addInput = $state<HTMLInputElement | null>(null);

	async function startAdd(columnId: string) {
		adding = columnId;
		failedColumn = null;
		await tick();
		addInput?.focus();
	}

	async function submit(columnId: string) {
		const value = (drafts[columnId] ?? "").trim();
		if (!value || busy) return;
		busy = true;
		failedColumn = null;
		try {
			await onCreate?.(columnId, value);
			drafts[columnId] = "";
		} catch {
			// Keep the text so it can be sent again, and mark the input.
			failedColumn = columnId;
		} finally {
			busy = false;
		}
		await tick();
		addInput?.focus();
	}
</script>

<div
	data-slot="kanban"
	class={cn("flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-2", className)}
>
	{#each columns as column (column.id)}
		{@const cards = local[column.id] ?? []}
		<section
			data-slot="kanban-column"
			data-column={column.id}
			aria-label="{column.title}, {cards.length === 1 ? '1 card' : `${cards.length} cards`}"
			class="flex w-72 shrink-0 snap-start flex-col rounded-lg bg-muted/50"
		>
			<header class="flex items-center gap-2 px-3 pt-3 pb-1">
				<Badge tone={column.tone ?? "gray"}>{column.title}</Badge>
				<span class="text-[13px] text-muted-foreground">{cards.length}</span>
			</header>
			<div
				data-slot="kanban-cards"
				class="flex min-h-16 flex-col gap-2 p-2"
				use:dndzone={{
					items: cards,
					flipDurationMs: 150,
					type: dndType,
					delayTouchStart: true,
					dropTargetStyle: {
						outline: "2px solid var(--ring)",
						"outline-offset": "-2px",
						"border-radius": "8px",
					},
				}}
				onconsider={(e: CustomEvent<DndEvent<TItem>>) => consider(column.id, e)}
				onfinalize={(e: CustomEvent<DndEvent<TItem>>) => finalize(column.id, e)}
			>
				{#each cards as item (item.id)}
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events: the zone makes the card focusable and draggable; Enter and Space start a keyboard drag, so the card slot should hold a link to open the record -->
					<div
						data-slot="kanban-card"
						animate:flip={{ duration: 150 }}
						class="cursor-grab rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
						role="group"
						onclick={(e) => click(item, e)}
					>
						<Card.Root size="sm" class="gap-1 p-2 text-[13px] shadow-xs">
							{@render card({ item })}
						</Card.Root>
					</div>
				{/each}
			</div>
			{#if onCreate}
				<div class="px-2 pb-2">
					{#if adding === column.id}
						<Input
							bind:ref={addInput}
							bind:value={() => drafts[column.id] ?? "", (v) => (drafts[column.id] = v)}
							aria-label="{createLabel} to {column.title}"
							placeholder={createPlaceholder}
							readonly={busy}
							aria-invalid={failedColumn === column.id || undefined}
							class="h-7"
							onkeydown={(e: KeyboardEvent) => {
								if (e.key === "Enter") {
									e.preventDefault();
									submit(column.id);
								} else if (e.key === "Escape" && !busy) {
									drafts[column.id] = "";
									failedColumn = null;
									adding = null;
								}
							}}
							onblur={() => {
								if (!(drafts[column.id] ?? "").trim()) adding = null;
							}}
						/>
					{:else}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="-ms-1 w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground"
							onclick={() => startAdd(column.id)}
						>
							<IconPlaceholder
								lucide="PlusIcon"
								tabler="IconPlus"
								hugeicons="PlusSignIcon"
								phosphor="PlusIcon"
								remixicon="RiAddLine"
								class="size-3.5"
							/>
							{createLabel}
						</Button>
					{/if}
				</div>
			{/if}
		</section>
	{/each}
</div>
