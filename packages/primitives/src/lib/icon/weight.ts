/**
 * Phosphor icon weight. Open, non-enclosed glyphs (Plus, Minus, X, Check, Arrow*, Caret*, Dots*, TextT and the like) are always
 * bold, whatever weight is passed. Enclosed icons (circle, square, folder, tray and so on) keep the weight they are given, so
 * a duotone CheckCircle stays duotone while a bare Check is bold.
 */
export type PhosphorWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

/** Glyph families that are always bold when open (not enclosed). */
export const OPEN_GLYPH_FAMILIES = ["Plus", "Minus", "X", "Check", "Arrow", "Caret", "Dots", "TextT"] as const;

/** Names that mark an icon as enclosed, so it keeps its weight even inside an open family. */
const ENCLOSED = /Circle|Square|Folder|Tray|Rectangle|Seal|Badge|Frame/;

/** True for an open, non-enclosed glyph: the exact name, or a family name followed by a modifier that is not an enclosure. */
export function isOpenGlyph(name: string): boolean {
	if (ENCLOSED.test(name)) return false;
	return OPEN_GLYPH_FAMILIES.some((family) => name === family || name.startsWith(family));
}

/** The weight to draw a Phosphor icon with: bold for an open glyph whatever is passed, otherwise the weight given. */
export function iconWeight(name: string, weight: PhosphorWeight): PhosphorWeight {
	return isOpenGlyph(name) ? "bold" : weight;
}
