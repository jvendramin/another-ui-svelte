import { describe, it, expect } from "vitest";
import { transformCss } from "../../src/utils/transform-css.js";

const SOURCE = `@import "tailwindcss";\n`;

describe("updateCssVars: @theme mapping", () => {
	it("maps color tokens into @theme as --color-*", () => {
		const out = transformCss(SOURCE, {
			cssVars: { light: { background: "#ffffff", "ledger-chip-blue-bg": "#eaeffc" } },
		});
		expect(out).toContain("--color-background: var(--background);");
		expect(out).toContain("--color-ledger-chip-blue-bg: var(--ledger-chip-blue-bg);");
	});

	it("writes non-color tokens to :root and does not map them into @theme", () => {
		const shadow = "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 0 0 0 transparent";
		const out = transformCss(SOURCE, {
			cssVars: { light: { background: "#ffffff", "ledger-field-shadow": shadow } },
		});
		expect(out).toContain(`--ledger-field-shadow: ${shadow};`);
		// A self-referencing theme variable is invalid CSS if it is ever emitted at :root.
		expect(out).not.toContain("--ledger-field-shadow: var(--ledger-field-shadow)");
	});

	it("keeps a theme variable that was set on purpose, and still maps radius", () => {
		const out = transformCss(SOURCE, {
			cssVars: { theme: { "font-sans": "Inter, sans-serif" }, light: { radius: "0.5rem" } },
		});
		expect(out).toContain("--font-sans: Inter, sans-serif;");
		expect(out).not.toContain("--font-sans: var(--font-sans)");
		expect(out).toContain("--radius-md: calc(var(--radius) * 0.8);");
	});
});
