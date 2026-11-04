<script lang="ts">
	import BuildingIcon from "@lucide/svelte/icons/building-2";
	import FilterIcon from "@lucide/svelte/icons/list-filter";
	import MailIcon from "@lucide/svelte/icons/mail";
	import UserIcon from "@lucide/svelte/icons/user";
	import * as Sidebar from "$lib/registry/ui/sidebar/index.js";
	import {
		SidebarFavorites,
		type FavoriteItem,
		type FavoriteMove,
	} from "$lib/registry/ui/sidebar-favorites/index.js";

	let items = $state<FavoriteItem[]>([
		{ id: "acme", label: "Acme Signs", href: "#acme", icon: BuildingIcon },
		{ id: "inbox", label: "Unread mail", href: "#inbox", icon: MailIcon, count: 9 },
		{
			id: "clients",
			label: "Clients",
			children: [
				{ id: "priya", label: "Priya Shah", href: "#priya", icon: UserIcon },
				{ id: "globex", label: "Globex", href: "#globex", icon: BuildingIcon, count: 2 },
			],
		},
		{ id: "view", label: "Open deals this month", href: "#deals", icon: FilterIcon },
	]);
	let last = $state("");

	// An app would save the new order here; throw to put the rows back.
	function onMove(move: FavoriteMove) {
		last = `${move.id}: ${move.from ?? "top"} to ${move.to ?? "top"}, position ${move.index + 1}`;
		items = move.items;
	}
</script>

<div class="w-full max-w-xs">
	<Sidebar.Provider class="min-h-0">
		<Sidebar.Root collapsible="none" class="h-auto w-full rounded-md border">
			<Sidebar.Content>
				<SidebarFavorites {items} {onMove} activeHref="#acme" />
			</Sidebar.Content>
		</Sidebar.Root>
	</Sidebar.Provider>
	<p class="mt-2 text-xs text-muted-foreground" aria-live="polite">{last || "Drag a row."}</p>
</div>
