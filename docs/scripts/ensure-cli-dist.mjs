import fs from "node:fs";
import path from "node:path";
// The docs import two workspace packages through their built output: `shadcn-svelte/icons` (packages/cli/dist) and
// `@shadcn-svelte/primitives/*` (packages/primitives/dist). A fresh checkout, or an install with scripts turned off, has
// neither, so docs scripts fail with ERR_MODULE_NOT_FOUND or a failed import. This builds them once when an output is
// missing. `pnpm build` always rebuilds them (prebuild runs `build:deps`).
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const outputs = [
	path.join(root, "packages", "cli", "dist", "icons", "index.mjs"),
	path.join(root, "packages", "primitives", "dist", "message-scroller", "index.js"),
];

if (outputs.some((file) => !fs.existsSync(file))) {
	console.log("A workspace package is not built, building shadcn-svelte and primitives first...");
	const result = spawnSync(
		"pnpm",
		["-F", "shadcn-svelte", "-F", "@shadcn-svelte/primitives", "build"],
		{
			cwd: root,
			stdio: "inherit",
		}
	);
	process.exit(result.status ?? 1);
}
