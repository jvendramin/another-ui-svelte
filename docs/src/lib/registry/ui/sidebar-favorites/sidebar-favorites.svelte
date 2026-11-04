<script lang="ts" module>
	import type { Component } from "svelte";

	/** A favorite: a link. Give it `children` to make it a folder (one level deep). */
	export type FavoriteItem = {
		id: string;
		label: string;
		href?: string;
		/** A component that renders an icon, such as a Lucide or Phosphor icon. */
		icon?: Component<{ class?: string }>;
		/** Shown as a badge, such as unread. */
		count?: number;
		children?: FavoriteItem[];
	};

	export type FavoriteMove = {
		id: string;
		/** The folder id the item came from, or null for the top level. */
		from: string | null;
		/** The folder id it landed in, or null for the top level. */
		to: string | null;
		index: number;
		/** The ids of the list it landed in, in order. */
		order: string[];
		/** The whole list after the move. Take this as the new `items`. */
		items: FavoriteItem[];
	};
</script>

<script lang="ts">
	import { dndzone, TRIGGERS, type DndEvent } from "svelte-dnd-action";
	import { fromAction } from "svelte/attachments";
	import * as Collapsible from "$lib/registry/ui/collapsible/index.js";
	import * as Sidebar from "$lib/registry/ui/sidebar/index.js";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { cn } from "$lib/utils.js";

	// The Favorites group of an app sidebar: links and one level of folders, with counts. Drag a row (or focus it and press
	// Space, then the arrow keys) to reorder it or move it into or out of a folder. Composed from the Sidebar parts; the drag
	// is svelte-dnd-action (MIT), the same as Kanban. Put it inside a Sidebar.Content.
	let {
		items,
		activeHref,
		label = "Favorites",
		onMove,
		onMoveError,
		class: className,
	}: {
		items: FavoriteItem[];
		/** The row whose `href` equals this is marked active. */
		activeHref?: string;
		label?: string;
		/** Called when a row lands somewhere new. Throw to reject: the rows snap back and `onMoveError` runs. Update `items` on success. */
		onMove?: (move: FavoriteMove) => void | Promise<void>;
		onMoveError?: (error: unknown, move: FavoriteMove) => void;
		class?: string;
	} = $props();

	// One shared type so a row can cross between the top level and the folders.
	const uid = $props.id();
	const dndType = `favorites-${uid}`;

	let local = $state<FavoriteItem[]>([]);
	let dragging = $state(false);
	// Copy `items` in when it changes, but never in the middle of a drag; a change that arrives during a drag lands when it ends.
	let synced: FavoriteItem[] | null = null;
	$effect(() => {
		const next = items;
		if (dragging || next === synced) return;
		synced = next;
		local = next;
	});

	let closed = $state<Record<string, boolean>>({});
	// svelte-dnd-action marks a shadow row on the objects it hands back, and hides the DOM node it uses as a placeholder.
	// After a drop, drop the marker from the data, and clear the placeholder look from every zone's rows (Svelte keeps
	// the keyed nodes, so a row can otherwise stay hidden).
	const zones = new Set<Element>();
	function clearPlaceholders() {
		for (const zone of zones) {
			for (const el of zone.children as Iterable<HTMLElement>) {
				if (el.style.visibility !== "hidden" && !el.hasAttribute("data-is-dnd-shadow-item-hint"))
					continue;
				el.removeAttribute("data-is-dnd-shadow-item-hint");
				el.removeAttribute("data-is-dnd-shadow-item-internal");
				el.style.removeProperty("visibility");
			}
		}
	}
	const clean = (list: FavoriteItem[]) =>
		list.map((item) => {
			const { isDndShadowItem: _marker, ...rest } = item as FavoriteItem & {
				isDndShadowItem?: boolean;
			};
			return rest as FavoriteItem;
		});

	const zone = (list: FavoriteItem[]) => ({
		items: list,
		flipDurationMs: 0,
		type: dndType,
		delayTouchStart: true,
		dropTargetStyle: { outline: "2px solid var(--ring)", "outline-offset": "-2px" },
	});

	function setList(folderId: string | null, list: FavoriteItem[]) {
		local =
			folderId === null
				? list
				: local.map((item) => (item.id === folderId ? { ...item, children: list } : item));
	}

	// A folder dropped into a folder goes to the top level, just after that folder: folders do not nest.
	function flatten(list: FavoriteItem[]): FavoriteItem[] {
		const out: FavoriteItem[] = [];
		for (const item of list) {
			if (!item.children) {
				out.push(item);
				continue;
			}
			const keep = item.children.filter((child) => !child.children);
			const hoisted = item.children.filter((child) => child.children);
			out.push({ ...item, children: keep }, ...hoisted);
		}
		return out;
	}

	function find(list: FavoriteItem[], id: string) {
		const top = list.findIndex((item) => item.id === id);
		if (top !== -1)
			return { folder: null as string | null, index: top, order: list.map((i) => i.id) };
		for (const folder of list) {
			const index = folder.children?.findIndex((child) => child.id === id) ?? -1;
			if (index !== -1) {
				return {
					folder: folder.id as string | null,
					index,
					order: folder.children!.map((i) => i.id),
				};
			}
		}
		return null;
	}

	// The list after the move, built from the app's current items, so an update the app made since the drag began is kept.
	function applyMove(
		base: FavoriteItem[],
		id: string,
		folder: string | null,
		index: number
	): FavoriteItem[] | null {
		let moved: FavoriteItem | undefined;
		const without = base
			.filter((item) => {
				if (item.id === id) {
					moved = item;
					return false;
				}
				return true;
			})
			.map((item) => {
				if (!item.children) return item;
				const kept = item.children.filter((child) => {
					if (child.id === id) {
						moved = child;
						return false;
					}
					return true;
				});
				return kept.length === item.children.length ? item : { ...item, children: kept };
			});
		if (!moved) return null;
		const place = (list: FavoriteItem[]) => {
			const at = Math.max(0, Math.min(index, list.length));
			return [...list.slice(0, at), moved!, ...list.slice(at)];
		};
		if (folder === null) return flatten(place(without));
		if (!without.some((item) => item.id === folder)) return null;
		return flatten(
			without.map((item) =>
				item.id === folder ? { ...item, children: place(item.children ?? []) } : item
			)
		);
	}

	function consider(folderId: string | null, event: CustomEvent<DndEvent<FavoriteItem>>) {
		dragging = true;
		setList(folderId, event.detail.items);
	}

	async function finalize(folderId: string | null, event: CustomEvent<DndEvent<FavoriteItem>>) {
		const before = items;
		setList(folderId, clean(event.detail.items));
		local = flatten(local).map((item) =>
			item.children ? { ...item, children: clean(item.children) } : item
		);
		setTimeout(() => (dragging = false), 0);
		const { id, trigger } = event.detail.info;
		// Only the list the row lands in reports the move; the list it left reports "dropped into another".
		if (trigger !== TRIGGERS.DROPPED_INTO_ZONE) return;
		const to = find(local, String(id));
		const from = find(before, String(id));
		if (!to) return;
		if (from && from.folder === to.folder && from.order.join() === to.order.join()) return;
		const fresh = applyMove(items, String(id), to.folder, to.index);
		if (fresh) {
			synced = items;
			local = fresh;
		}
		const move: FavoriteMove = {
			id: String(id),
			from: from?.folder ?? null,
			to: to.folder,
			index: to.index,
			order: to.order,
			items: $state.snapshot(fresh ?? local) as FavoriteItem[],
		};
		try {
			await onMove?.(move);
		} catch (error) {
			// Back to what the app holds now, not to a snapshot: an earlier move may have been saved since.
			synced = items;
			local = items;
			onMoveError?.(error, move);
		}
	}

	// svelte-dnd-action reports through custom "consider" and "finalize" events; listen for them on the zone element.
	const events = (folderId: string | null) => (node: Element) => {
		const onConsider = (e: Event) => consider(folderId, e as CustomEvent<DndEvent<FavoriteItem>>);
		const onFinalize = (e: Event) => {
			finalize(folderId, e as CustomEvent<DndEvent<FavoriteItem>>);
			setTimeout(clearPlaceholders, 60);
		};
		zones.add(node);
		// The library can restyle a row after the drop; while no drag is going on, any placeholder look is stale.
		const watcher = new MutationObserver(() => {
			if (!dragging) clearPlaceholders();
		});
		watcher.observe(node, {
			attributes: true,
			subtree: true,
			attributeFilter: ["data-is-dnd-shadow-item-hint", "style"],
		});
		node.addEventListener("consider", onConsider);
		node.addEventListener("finalize", onFinalize);
		return () => {
			zones.delete(node);
			watcher.disconnect();
			node.removeEventListener("consider", onConsider);
			node.removeEventListener("finalize", onFinalize);
		};
	};

	const active = (item: FavoriteItem) => Boolean(activeHref && item.href === activeHref);
	// Do not start a link navigation when a drag ends on it.
	function click(event: MouseEvent) {
		if (dragging) event.preventDefault();
	}
</script>

<Sidebar.Group data-slot="sidebar-favorites" class={cn(className)}>
	<Sidebar.GroupLabel>{label}</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu
			aria-label={label}
			{@attach fromAction(dndzone, () => zone(local))}
			{@attach events(null)}
		>
			{#each local as item (item.id)}
				<Sidebar.MenuItem>
					{#if item.children}
						<Collapsible.Root
							open={!closed[item.id]}
							onOpenChange={(open) => (closed[item.id] = !open)}
						>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton {...props} class="group/folder">
										<IconPlaceholder
											lucide="FolderIcon"
											tabler="IconFolder"
											hugeicons="Folder01Icon"
											phosphor="FolderIcon"
											remixicon="RiFolderLine"
										/>
										<span>{item.label}</span>
										{#if item.count != null && item.count > 0}
											<span class="ms-auto text-xs text-sidebar-foreground/70 tabular-nums"
												>{item.count}</span
											>
										{/if}
										<IconPlaceholder
											lucide="ChevronRightIcon"
											tabler="IconChevronRight"
											hugeicons="ArrowRight01Icon"
											phosphor="CaretRightIcon"
											remixicon="RiArrowRightSLine"
											class={cn(
												"transition-transform group-data-[state=open]/folder:rotate-90",
												item.count ? "" : "ms-auto"
											)}
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub
									aria-label={item.label}
									class="min-h-6"
									{@attach fromAction(dndzone, () => zone(item.children ?? []))}
									{@attach events(item.id)}
								>
									{#each item.children as sub (sub.id)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton isActive={active(sub)}>
												{#snippet child({ props })}
													<svelte:element
														this={sub.href ? "a" : "button"}
														{...props}
														href={sub.href}
														type={sub.href ? undefined : "button"}
														onclick={click}
													>
														{#if sub.icon}<sub.icon />{/if}
														<span>{sub.label}</span>
														{#if sub.count != null && sub.count > 0}
															<span class="ms-auto text-xs text-sidebar-foreground/70 tabular-nums"
																>{sub.count}</span
															>
														{/if}
													</svelte:element>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Collapsible.Root>
					{:else}
						<Sidebar.MenuButton isActive={active(item)} tooltipContent={item.label}>
							{#snippet child({ props })}
								<svelte:element
									this={item.href ? "a" : "button"}
									{...props}
									href={item.href}
									type={item.href ? undefined : "button"}
									onclick={click}
								>
									{#if item.icon}<item.icon />{/if}
									<span>{item.label}</span>
								</svelte:element>
							{/snippet}
						</Sidebar.MenuButton>
						{#if item.count != null && item.count > 0}
							<Sidebar.MenuBadge>{item.count}</Sidebar.MenuBadge>
						{/if}
					{/if}
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
