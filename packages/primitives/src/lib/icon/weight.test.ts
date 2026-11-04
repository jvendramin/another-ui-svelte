import { describe, expect, it } from "vitest";
import { iconWeight, isOpenGlyph } from "./weight";

/** The open glyphs that are always bold, whatever weight is passed. */
const BOLD_SET = ["Plus", "Minus", "X", "Check", "ArrowRight", "ArrowUpRight", "ArrowLeft", "CaretDown", "CaretUp", "DotsThree", "DotsSixVertical", "TextT"];

/** Enclosed icons that keep the weight they are given, even when their name starts with an open family. */
const ENCLOSED_SET = ["CheckCircle", "CheckSquare", "XCircle", "PlusCircle", "MinusSquare", "ArrowCircleRight", "FolderSimple", "Tray", "Envelope", "Trash"];

describe("open glyphs are always bold", () => {
	for (const name of BOLD_SET) {
		it(`${name} is bold, whatever weight is passed`, () => {
			expect(isOpenGlyph(name)).toBe(true);
			expect(iconWeight(name, "duotone")).toBe("bold");
			expect(iconWeight(name, "regular")).toBe("bold");
			expect(iconWeight(name, "fill")).toBe("bold");
		});
	}
});

describe("enclosed icons keep the weight they are given", () => {
	for (const name of ENCLOSED_SET) {
		it(`${name} keeps its weight`, () => {
			expect(iconWeight(name, "duotone")).toBe("duotone");
			expect(iconWeight(name, "regular")).toBe("regular");
		});
	}
});

describe("other icons keep the weight they are given", () => {
	it("a plain non-open name keeps its weight", () => {
		expect(iconWeight("Bell", "duotone")).toBe("duotone");
		expect(iconWeight("Note", "regular")).toBe("regular");
	});
});
