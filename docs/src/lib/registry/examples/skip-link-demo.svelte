<script lang="ts">
	import { SkipLink } from "$lib/registry/ui/skip-link/index.js";
	import { Button } from "$lib/registry/ui/button/index.js";
</script>

<!-- Press Tab from the start of this preview: the link appears in the preview's corner. Enter puts focus on the content. -->
<div class="relative flex w-full flex-col gap-3 text-sm">
	<SkipLink href="#skip-link-demo-main" class="focus:absolute" />
	<nav aria-label="Demo" class="flex gap-2">
		<Button variant="ghost" size="sm">Home</Button>
		<Button variant="ghost" size="sm">Companies</Button>
		<Button variant="ghost" size="sm">Deals</Button>
		<Button variant="ghost" size="sm">Settings</Button>
	</nav>
	<main id="skip-link-demo-main" tabindex="-1" class="rounded-[8px] border p-4 focus:outline-none">
		<p class="font-medium">Main content</p>
		<p class="text-muted-foreground">Tab once more and focus is on the first control here, not on the nav.</p>
		<Button size="sm" class="mt-3">First control</Button>
	</main>
</div>
