import postcss from "postcss";

const docsScope = ":is(.dark .style-ledger, .style-ledger.dark, .style-ledger .dark)";

/** Ship the same filled-control rules as the docs, without requiring a docs-only style class. */
export function ledgerFillCss(source: string): Record<string, Record<string, string>> {
	const result: Record<string, Record<string, string>> = {};
	postcss.parse(source).walkRules((rule) => {
		const declarations: Record<string, string> = {};
		rule.walkDecls((decl) => { declarations[decl.prop] = decl.value; });
		const isFillRule = "--ledger-primary-own" in declarations ||
			declarations["--primary"]?.startsWith("var(--primary-fill,") ||
			(rule.selector.includes('[data-variant="default"]') && declarations["--foreground"] === "#000");
		if (!isFillRule) return;
		if (!rule.selector.startsWith(docsScope)) throw new Error("Ledger fill rule has an unknown scope");
		result[rule.selector.replace(docsScope, ".dark")] = declarations;
	});
	if (Object.keys(result).length !== 3) throw new Error("Expected Ledger capture, fill and hover rules");
	return result;
}
