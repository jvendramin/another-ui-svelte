// !! BROWSER SAFE !!

import MagicString from "magic-string";
import { walk, type Node } from "estree-walker";
import { parse as parseSvelte } from "svelte/compiler";
import { iconLibraries, type IconLibrary } from "../../icons/libraries.js";
import { error } from "../errors.js";
import type { Transformer, TransformerResult } from "./index.js";
import type { ImportDeclaration } from "acorn";

export const transformIcons: Transformer = async ({ content, filePath, config }) => {
	if (!filePath.endsWith(".svelte")) return {};

	const src = new MagicString(content);

	const ast = parseSvelte(content, { filename: filePath, modern: true });

	const iconLibrary = iconLibraries[config.iconLibrary];

	const icons: { name: string }[] = [];
	let placeholderImportNode: ImportDeclaration | null = null;

	const enter = (node: Node) => {
		// @ts-expect-error wrong.
		if (node.type === "Component" && node.name === "IconPlaceholder") {
			// @ts-expect-error wrong
			const otherAttributes = node.attributes.filter(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(attr: any) => !Object.keys(iconLibraries).includes(attr.name)
			);

			// @ts-expect-error wrong
			const iconNameAttr = node.attributes.find(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(attr: any) => attr.name === config.iconLibrary
			);

			const iconName = iconNameAttr?.value[0]?.data;
			if (!iconName) {
				throw error(
					`Couldn't find icon name attribute for ${config.iconLibrary} in ${filePath}. This is a bug please report it here: https://github.com/huntabyte/shadcn-svelte/issues`
				);
			}

			const restProps = otherAttributes
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.map((attr: any) => src.slice(attr.start, attr.end))
				.join(" ");

			// A weight the placeholder sets itself (weight="fill", weight={w} or the {weight} shorthand) wins, so the
			// transform never writes the attribute twice.
			const hasWeight = otherAttributes.some((attr: { name?: string }) => attr.name === "weight");
			const iconSrc = iconLibrary.usage({ name: iconName }, restProps, { hasWeight });

			// @ts-expect-error wrong
			src.overwrite(node.start, node.end, iconSrc);

			icons.push({ name: iconName });
		} else if (node.type === "ImportDeclaration") {
			const specifier = node.specifiers[0];
			if (
				specifier?.type === "ImportDefaultSpecifier" &&
				specifier.local.name === "IconPlaceholder"
			) {
				placeholderImportNode = node as ImportDeclaration;
			}
		}
	};

	walk(ast as never, { enter });

	// replace IconPlaceholder default import with the actual icon imports
	if (placeholderImportNode) {
		const imports: string[] = (iconLibrary as IconLibrary).getAdditionalImports?.() ?? [];
		// An icon used twice in one file (a placeholder in two branches) is imported once; a second
		// `import SparkleIcon from ...` is a "has already been declared" parse error.
		const seen = new Set<string>(imports);
		for (const icon of icons) {
			const line = iconLibrary.import(icon);
			if (seen.has(line)) continue;
			seen.add(line);
			imports.push(line);
		}

		// @ts-expect-error wrong
		src.overwrite(placeholderImportNode.start, placeholderImportNode.end, imports.join("\n\t"));
	}

	return {
		content: src.toString(),
		devDependencies: placeholderImportNode !== null ? [...iconLibrary.packages] : [],
	} satisfies Partial<TransformerResult>;
};
