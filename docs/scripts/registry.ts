import fs from "node:fs";
import path from "node:path";
import * as acorn from "acorn";
import * as svelte from "svelte/compiler";
import { tsPlugin } from "@sveltejs/acorn-typescript";
import { walk, type Node } from "estree-walker";
import { registryItemSchema, type Registry } from "shadcn-svelte/schema";
import { fonts } from "../src/lib/registry/fonts.js";

const REGISTRY_DEPENDENCY = "$lib/";
const UTILS_PATH = "$lib/utils.js";
const REGISTRY_LIB_PATH = "$lib/registry/lib/";

const tsParser = acorn.Parser.extend(tsPlugin());

// npm packages an item imports are declared on the item, so `shadcn-svelte add` installs them. A bare import is a
// dependency unless it is one of these: the framework, the app's own aliases, or a Node built-in.
const NOT_A_DEPENDENCY = (name: string) =>
	name === "svelte" ||
	name === "@sveltejs/kit" ||
	name.startsWith("node:") ||
	["fs", "path", "url", "os", "crypto", "util", "child_process"].includes(name);

function readJson(file: string): Record<string, unknown> {
	return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
}

// The version each package is declared with in the docs app, so an app gets a range the registry was built against.
// A workspace package (the primitives) has no range of its own, so its published version is used.
const DOCS_PACKAGE_VERSIONS: Record<string, string> = (() => {
	const pkg = readJson(path.resolve("package.json")) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const versions = { ...pkg.devDependencies, ...pkg.dependencies };

	// Workspace packages are found by the name in their own package.json (the folder name can differ).
	const workspace = new Map<string, string>();
	const packagesDir = path.resolve("..", "packages");
	for (const dir of fs.readdirSync(packagesDir)) {
		const file = path.join(packagesDir, dir, "package.json");
		if (!fs.existsSync(file)) continue;
		const own = readJson(file) as { name?: string; version?: string };
		if (own.name && own.version) workspace.set(own.name, own.version);
	}
	for (const [name, range] of Object.entries(versions)) {
		if (range.startsWith("workspace:")) {
			const version = workspace.get(name);
			versions[name] = version ? `^${version}` : "latest";
		}
	}
	return versions;
})();

/** The package a bare import specifier belongs to: `shiki/core` is `shiki`, `@scope/pkg/sub` is `@scope/pkg`. */
function packageOf(specifier: string): string {
	const parts = specifier.split("/");
	return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
}

/** `name@range` for an npm package, or the bare name when the docs app does not pin it. */
function withVersion(name: string): string {
	const range = DOCS_PACKAGE_VERSIONS[name];
	return range ? `${name}@${range}` : name;
}

/** The item's `dependencies` field, left out when empty so items without npm imports stay as they were. */
function npmField(deps: Iterable<string>): { dependencies?: string[] } {
	const list = [...new Set([...deps].map(withVersion))].sort();
	return list.length ? { dependencies: list } : {};
}

type RegistryItems = Registry["items"];
type RegistryItemFiles = Registry["items"][number]["files"];

export async function buildRegistry(): Promise<RegistryItems> {
	const registryRootPath = path.resolve("src", "lib", "registry");

	const paths = {
		ui: path.resolve(registryRootPath, "ui"),
		examples: path.resolve(registryRootPath, "examples"),
		blocks: path.resolve(registryRootPath, "blocks"),
		hooks: path.resolve(registryRootPath, "hooks"),
		lib: path.resolve(registryRootPath, "lib"),
		fonts: path.resolve(registryRootPath, "fonts.ts"),
	};

	return (
		await Promise.all([
			crawlUI(paths.ui),
			crawlExamples(paths.examples),
			crawlBlocks(paths.blocks),
			crawlHooks(paths.hooks),
			crawlLib(paths.lib),
			assembleFonts(),
			assembleLedgerTokens(registryRootPath),
		])
	).flat();
}

async function crawlUI(rootPath: string): Promise<RegistryItems> {
	const dir = fs.readdirSync(rootPath, { recursive: true, withFileTypes: true });
	const dirs = dir.filter((dirent) => dirent.isDirectory());
	return Promise.all(
		dirs.map((dirent) => buildUIRegistry(path.resolve(rootPath, dirent.name), dirent.name))
	);
}

async function buildUIRegistry(
	componentPath: string,
	componentName: string
): Promise<RegistryItems[number]> {
	const dir = fs.readdirSync(componentPath, {
		withFileTypes: true,
	});

	const fileEntries = dir.filter((d) => d.isFile());
	const registryDependencies = new Set<string>();
	const npmDependencies = new Set<string>();

	let meta: Partial<RegistryItems[number]> = {};
	const files: RegistryItemFiles = [];

	await Promise.all(
		fileEntries.map(async (dirent) => {
			const filepath = path.join(componentPath, dirent.name);
			const relativePath = path.relative(process.cwd(), filepath);
			const source = fs.readFileSync(filepath, { encoding: "utf8" });

			if (dirent.name === "meta.json") {
				meta = registryItemSchema.parse(JSON.parse(source));
				// dependencies that can't be inferred from imports (e.g. a hook used alongside the component)
				meta.registryDependencies?.forEach((dep) => registryDependencies.add(dep));
				// Declared by hand, for a package the imports do not show.
				meta.dependencies?.forEach((dep) => npmDependencies.add(packageOf(dep)));
				return;
			}

			files.push({ path: relativePath, type: "registry:file" });

			// Stylesheets (the twenty-theme variant) carry no imports to resolve.
			if (dirent.name.endsWith(".css")) return;

			const deps = await getFileDependencies(filepath, source);
			if (!deps) return;
			deps.registryDependencies.forEach((dep) => registryDependencies.add(dep));
			deps.npmDependencies.forEach((dep) => npmDependencies.add(dep));
		})
	);

	return {
		...meta,
		type: "registry:ui",
		files,
		name: componentName,
		registryDependencies: Array.from(registryDependencies),
		...npmField(npmDependencies),
	} satisfies RegistryItems[number];
}

async function crawlExamples(rootPath: string): Promise<RegistryItems> {
	const dir = fs.readdirSync(rootPath, { withFileTypes: true });
	const files = dir.filter((d) => d.name.endsWith(".svelte") && d.isFile());
	return Promise.all(
		files.map(async (dirent) => {
			const [name] = dirent.name.split(".svelte");
			const filepath = path.join(rootPath, dirent.name);
			const source = fs.readFileSync(filepath, { encoding: "utf8" });
			const relativePath = path.relative(process.cwd(), filepath);
			const { registryDependencies, npmDependencies } = await getFileDependencies(filepath, source);
			return {
				name,
				type: "registry:example" as const,
				files: [{ path: relativePath, type: "registry:component" as const }],
				registryDependencies: Array.from(registryDependencies),
				...npmField(npmDependencies),
			};
		})
	);
}

async function buildBlockRegistry(
	blockPath: string,
	blockName: string
): Promise<RegistryItems[number]> {
	const dir = fs.readdirSync(blockPath, { withFileTypes: true, recursive: true });
	const registryDependencies = new Set<string>();
	const npmDependencies = new Set<string>();

	const pagesNames = ["+page.svelte"];
	const fileNames = ["data.json", "data.ts"];
	const fileEntries = dir.filter((d) => d.isFile());

	const files = await Promise.all(
		fileEntries.map(async (dirent) => {
			const isPage = pagesNames.includes(dirent.name);
			const isFile = fileNames.includes(dirent.name);
			const type = isPage || isFile ? "registry:page" : "registry:component";

			// TODO: fix
			const compPath =
				isPage || isFile ? dirent.name : path.join(path.basename(dirent.parentPath), dirent.name);
			const filepath = path.join(blockPath, compPath);
			const relativePath = path.relative(process.cwd(), filepath);
			const source = fs.readFileSync(filepath, { encoding: "utf8" });

			const deps = await getFileDependencies(filepath, source);
			if (deps) {
				deps.registryDependencies.forEach((dep) => registryDependencies.add(dep));
				deps.npmDependencies.forEach((dep) => npmDependencies.add(dep));
			}

			return { path: relativePath, type } satisfies RegistryItemFiles[number];
		})
	);

	return {
		type: "registry:block",
		files,
		name: blockName,
		registryDependencies: Array.from(registryDependencies),
		...npmField(npmDependencies),
	} satisfies RegistryItems[number];
}

async function crawlBlocks(rootPath: string): Promise<RegistryItems> {
	const dir = fs.readdirSync(rootPath, { withFileTypes: true });
	return Promise.all(
		dir.map(async (dirent) => {
			const filepath = path.join(rootPath, dirent.name);
			if (!dirent.isFile()) {
				return buildBlockRegistry(filepath, dirent.name);
			}
			if (!dirent.name.endsWith(".svelte")) return null;

			const [name] = dirent.name.split(".svelte");
			const source = fs.readFileSync(filepath, { encoding: "utf8" });
			const relativePath = path.relative(process.cwd(), filepath);
			const { registryDependencies, npmDependencies } = await getFileDependencies(filepath, source);
			return {
				name,
				type: "registry:block" as const,
				files: [{ path: relativePath, type: "registry:component" as const }],
				registryDependencies: Array.from(registryDependencies),
				...npmField(npmDependencies),
			};
		})
	).then((results) => results.filter((r) => r !== null));
}

async function crawlLib(rootPath: string): Promise<RegistryItems> {
	const dir = fs.readdirSync(rootPath, { withFileTypes: true });
	const files = dir.filter((d) => d.isFile());
	return Promise.all(
		files.map(async (dirent) => {
			const [name] = dirent.name.split(".ts");
			const filepath = path.join(rootPath, dirent.name);
			const source = fs.readFileSync(filepath, { encoding: "utf8" });
			const relativePath = path.relative(process.cwd(), filepath);
			const { registryDependencies, npmDependencies } = await getFileDependencies(filepath, source);
			return {
				name,
				type: "registry:lib" as const,
				files: [{ path: relativePath, type: "registry:lib" as const }],
				registryDependencies: Array.from(registryDependencies),
				...npmField(npmDependencies),
			};
		})
	);
}

async function assembleFonts(): Promise<RegistryItems> {
	const items: RegistryItems = [];

	for (const font of fonts) {
		items.push({
			name: `font-${font.name.replace("font-", "")}`,
			type: "registry:font",
			font: font.font,
			files: [],
			registryDependencies: [],
		});
	}

	return items;
}

// The Ledger design tokens ship as a registry item, so an app installs them with `shadcn-svelte add ledger-tokens`
// (the CLI writes them into :root and .dark in the app's CSS) and a later token fix arrives with a re-add. The single
// source stays styles/ledger-tokens.css, which the docs site also imports; this reads it so the two cannot drift.
async function assembleLedgerTokens(registryRootPath: string): Promise<RegistryItems> {
	const cssPath = path.resolve(registryRootPath, "styles", "ledger-tokens.css");
	const css = fs.readFileSync(cssPath, "utf8");

	// A token block is `<selector list> { --name: value; ... }` with no nested rules. Every `--name:` declaration in the
	// block must be parsed, so a multi-line value, two declarations on one line or a trailing comment fails the build
	// instead of shipping a short token set.
	const readBlock = (selectorPattern: RegExp): Record<string, string> => {
		const match = selectorPattern.exec(css);
		if (!match) throw new Error(`ledger-tokens.css: block ${selectorPattern} not found`);
		const open = css.indexOf("{", match.index);
		const close = css.indexOf("}", open);
		const body = css.slice(open + 1, close);
		if (body.includes("{"))
			throw new Error(`ledger-tokens.css: nested rule in block ${selectorPattern}`);

		const declared = (body.match(/--[a-z0-9-]+\s*:/g) ?? []).length;
		const vars: Record<string, string> = {};
		for (const line of body.split("\n")) {
			const decl = line.match(/^\s*--([a-z0-9-]+):\s*(.+?);\s*$/);
			if (decl) vars[decl[1]!] = decl[2]!;
		}
		if (Object.keys(vars).length !== declared) {
			throw new Error(
				`ledger-tokens.css: parsed ${Object.keys(vars).length} of ${declared} tokens in ${selectorPattern}; keep one "--name: value;" per line`
			);
		}
		return vars;
	};

	const light = readBlock(/^\.style-ledger\s*\{/m);
	const dark = readBlock(/^\.dark\s+\.style-ledger\b/m);
	if (!Object.keys(light).length || !Object.keys(dark).length) {
		throw new Error("ledger-tokens.css: no tokens parsed");
	}

	return [
		{
			name: "ledger-tokens",
			type: "registry:style",
			title: "Ledger tokens",
			description:
				"The Ledger design tokens (colors, radius, chip tones, field border and shadow) written into :root and .dark, plus the base layer that sets the default border and outline color. Re-add to update them. Color values come from the twenty-ui theme tokens (github.com/twentyhq/twenty, MIT License, Copyright (c) 2023-present Twenty.com, PBC).",
			cssVars: { light, dark },
			// The base layer every Ledger app needs. Tailwind 4 defaults a bare `border` to currentColor (black lines in a
			// table row or a divider) and the outline of a focused control to the browser default. shadcn's init adds this;
			// shipping it here means an app that installs the tokens gets it too.
			css: {
				"@layer base": {
					"*": {
						"@apply border-border outline-ring/50": {},
					},
				},
			},
			files: [],
			registryDependencies: [],
		},
	];
}

async function crawlHooks(rootPath: string): Promise<RegistryItems> {
	const dir = fs.readdirSync(rootPath, { withFileTypes: true });
	const files = dir.filter((d) => d.isFile());
	return Promise.all(
		files.map(async (dirent) => {
			const [name] = dirent.name.split(".svelte.ts");
			const filepath = path.join(rootPath, dirent.name);
			const source = fs.readFileSync(filepath, { encoding: "utf8" });
			const relativePath = path.relative(process.cwd(), filepath);
			const { registryDependencies, npmDependencies } = await getFileDependencies(filepath, source);
			return {
				name,
				type: "registry:hook" as const,
				files: [{ path: relativePath, type: "registry:hook" as const }],
				registryDependencies: Array.from(registryDependencies),
				...npmField(npmDependencies),
			};
		})
	);
}

async function getFileDependencies(
	filename: string,
	content: string
): Promise<{ registryDependencies: Set<string>; npmDependencies: Set<string> }> {
	let ast: unknown;
	let moduleAst: unknown;
	let fragmentAst: unknown;

	if (filename.endsWith(".svelte")) {
		const { code } = await svelte.preprocess(content, [], { filename });
		const result = svelte.parse(code, { filename });
		ast = result.instance;
		if (result.module) {
			moduleAst = result.module;
		}
		// The markup can hold `{#await import("...")}`, a lazy load the script blocks do not show.
		fragmentAst = result.html;
	} else {
		ast = tsParser.parse(content, { ecmaVersion: "latest", sourceType: "module" });
	}

	const registryDependencies = new Set<string>();
	const npmDependencies = new Set<string>();

	const enter = (node: Node) => {
		// A static `import x from "..."` or a dynamic `import("...")` with a literal path.
		const isStatic = node.type === "ImportDeclaration";
		const isDynamic =
			(node.type as string) === "ImportExpression" &&
			// @ts-expect-error ImportExpression is not in this Node union
			node.source?.type === "Literal" &&
			// @ts-expect-error same
			typeof node.source.value === "string";
		if (isStatic || isDynamic) {
			// @ts-expect-error both node kinds carry source.value here
			const source = node.source.value as string;

			// A bare specifier is an npm package (relative paths and the `$lib`, `$app` aliases are not).
			if (!source.startsWith(".") && !source.startsWith("$") && !source.startsWith("/")) {
				const name = packageOf(source);
				if (!NOT_A_DEPENDENCY(name)) npmDependencies.add(name);
			}

			if (source.startsWith(REGISTRY_DEPENDENCY) && source !== UTILS_PATH) {
				if (source.startsWith(REGISTRY_LIB_PATH)) {
					const lib = source.split("/").at(-1)!.split(".")[0];
					registryDependencies.add(lib);
				} else if (source.includes("ui")) {
					const component = source.split("/").at(-2)!;
					registryDependencies.add(component);
				} else if (source.includes("hook")) {
					const hook = source.split("/").at(-1)!.split(".")[0];
					registryDependencies.add(hook);
				}
			}
		}
	};

	// @ts-expect-error yea, stfu
	walk(ast, { enter });

	if (moduleAst) {
		// @ts-expect-error yea, stfu x2
		walk(moduleAst, { enter });
	}

	if (fragmentAst) {
		// @ts-expect-error the template tree mixes Svelte and ESTree nodes
		walk(fragmentAst, { enter });
	}

	return { registryDependencies, npmDependencies };
}
