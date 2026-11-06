import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { ledgerFillCss } from "./ledger-fill.js";

const source = fs.readFileSync(new URL("../src/lib/registry/styles/ledger-overrides.css", import.meta.url), "utf8");
test("registry ships all three dark fill rules without a docs class", () => {
	const css = ledgerFillCss(source);
	assert.equal(Object.keys(css).length, 3);
	assert.ok(Object.keys(css).every((s) => s.startsWith(".dark") && !s.includes(".style-ledger")));
	const fill = Object.entries(css).find(([, props]) => "--primary" in props)!;
	assert.equal(fill[1]["--primary"], "var(--primary-fill, var(--ledger-primary-own))");
	assert.equal(fill[1]["--primary-foreground"], "var(--primary-fill-foreground, var(--ledger-primary-foreground-own))");
	for (const slot of ["button", "checkbox", "switch", "progress-indicator", "slider-range", "avatar-badge"]) {
		assert.ok(fill[0].includes(`[data-slot="${slot}"]`));
	}
	assert.ok(!fill[0].includes('[class~="text-primary"]'));
	const hover = Object.entries(css).find(([, props]) => props["--foreground"] === "#000")!;
	assert.ok(hover[0].includes('[data-slot="button"][class~="bg-primary"]'));
	assert.ok(!Object.values(css).some((props) => "--ring" in props));
});
test("a missing source rule fails the registry build", () => {
	assert.throws(() => ledgerFillCss(""), /Expected Ledger/);
});
