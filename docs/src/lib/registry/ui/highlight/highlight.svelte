<script lang="ts" module>
	export type HighlightSegment = { text: string; match: boolean };

	// Lowercase and drop accents, one character at a time, so each normalised character maps back to its source character.
	function fold(text: string) {
		let folded = "";
		const origin: number[] = [];
		let i = 0;
		for (const ch of text) {
			const f = ch.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
			for (let k = 0; k < f.length; k++) origin.push(i);
			folded += f;
			i += ch.length;
		}
		return { folded, origin };
	}

	/** Splits `text` into plain and matching segments. Matching ignores case and accents and finds substrings. */
	export function highlightSegments(text: string, terms: string[]): HighlightSegment[] {
		const needles = terms.map((t) => fold(t.trim()).folded).filter((t) => t.length > 0);
		if (!text || needles.length === 0) return [{ text, match: false }];
		const { folded, origin } = fold(text);
		const ranges: [number, number][] = [];
		for (const needle of needles) {
			let at = folded.indexOf(needle);
			while (at !== -1) {
				ranges.push([at, at + needle.length]);
				at = folded.indexOf(needle, at + 1);
			}
		}
		if (ranges.length === 0) return [{ text, match: false }];
		ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
		const merged: [number, number][] = [];
		for (const r of ranges) {
			const last = merged[merged.length - 1];
			if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
			else merged.push([r[0], r[1]]);
		}
		const segments: HighlightSegment[] = [];
		let cursor = 0;
		for (const [from, to] of merged) {
			const start = origin[from];
			// End just after the source character that holds the last matched folded character.
			const lastChar = origin[to - 1];
			let end = lastChar + (String.fromCodePoint(text.codePointAt(lastChar) ?? 0).length || 1);
			// Keep accents stored as separate characters (e + U+0301) inside the match.
			while (end < text.length && /\p{M}/u.test(text.slice(end, end + 1))) end++;
			if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false });
			segments.push({ text: text.slice(start, end), match: true });
			cursor = end;
		}
		if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
		return segments;
	}
</script>

<script lang="ts">
	import type { WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// Text with the search terms marked. It renders text nodes and <mark> elements, never HTML, so it is safe for text
	// from a message. The mark inherits the font and uses the yellow chip tone.
	let {
		ref = $bindable(null),
		text,
		terms = [],
		class: className,
		...restProps
	}: Omit<WithElementRef<HTMLAttributes<HTMLSpanElement>>, "children"> & {
		text: string;
		/** Words or fragments to mark. Empty or blank terms are ignored. */
		terms?: string[];
	} = $props();

	const segments = $derived(highlightSegments(text, terms));
</script>

<span bind:this={ref} data-slot="highlight" class={className} {...restProps}
	>{#each segments as segment, i (i)}{#if segment.match}<mark
				data-slot="highlight-mark"
				class="rounded-sm bg-[var(--ledger-chip-yellow-bg)] text-[var(--ledger-chip-yellow-ink)] [font:inherit]"
				>{segment.text}</mark
			>{:else}{segment.text}{/if}{/each}</span
>
