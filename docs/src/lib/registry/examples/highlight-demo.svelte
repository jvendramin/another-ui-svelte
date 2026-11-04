<script lang="ts">
	import { Highlight } from "$lib/registry/ui/highlight/index.js";
	import { Input } from "$lib/registry/ui/input/index.js";

	let query = $state("cafe renewal");
</script>

<div class="flex w-full max-w-md flex-col gap-3">
	<Input aria-label="Search terms" bind:value={query} />
	<p class="text-sm">
		<Highlight
			text="Re: Café renewal terms. We can renew the café lease on the same terms."
			terms={query.split(/\s+/)}
		/>
	</p>
</div>
