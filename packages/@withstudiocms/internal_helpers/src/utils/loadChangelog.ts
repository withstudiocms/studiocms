import fs from 'node:fs';
import type { List } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString as ToString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';

/**
 * Represents a changelog entry for a specific version.
 *
 * @property version - The semantic version string (e.g., "1.2.3").
 * @property changes - An object mapping each semantic version category to a list of changes.
 * @property includes - A set of strings indicating included features or modules for this version.
 */
export type Version = {
	version: string;
	changes: { [key in SemverCategory]: List };
	includes: Set<string>;
};

/**
 * Represents the changelog for a package, including its name and a list of versions.
 *
 * @property packageName - The name of the package.
 * @property versions - An array of version objects associated with the package.
 */
export type Changelog = {
	packageName: string;
	versions: Version[];
};

/**
 * Defines the semantic versioning categories used to classify changes.
 * - `major`: Indicates breaking changes.
 * - `minor`: Indicates backward-compatible feature additions.
 * - `patch`: Indicates backward-compatible bug fixes.
 */
export const semverCategories = ['major', 'minor', 'patch'] as const;

/**
 * Represents a semantic versioning category, derived from the `semverCategories` array.
 *
 * This type is useful for constraining values to valid semantic version categories.
 */
export type SemverCategory = (typeof semverCategories)[number];

// TODO: Setup tests for loadChangelog
/**
 * Loads and parses a changelog markdown file from the specified path.
 *
 * This function reads the changelog file, converts GitHub usernames in "Thanks ..." sentences
 * to markdown links, and parses the markdown into a structured `Changelog` object.
 * It expects the changelog to follow a specific heading and list structure:
 * - H1 for package name
 * - H2 for version
 * - H3 for semantic version category (major, minor, patch)
 * - Lists for changes, with special handling for package references and dependency updates
 *
 * @param path - The file path to the changelog markdown file.
 * @returns The parsed `Changelog` object containing package name, versions, categorized changes, and included package references.
 * @throws If the markdown structure is unexpected or contains unknown semantic version categories.
 */
export function loadChangelog(path: string): Changelog {
	let markdown = fs.readFileSync(path, 'utf8');

	// Convert GitHub usernames in "Thanks ..." sentences to links
	markdown = markdown.replace(
		/(?<=Thank[^.!]*? )@([a-z0-9-]+)(?=[\s,.!])/gi,
		'[@$1](https://github.com/$1)'
	);

	const ast = fromMarkdown(markdown);
	// const lines = readFileSync(path, 'utf8')
	// 	.split(/\r?\n/)
	// 	.map((line) => line.trimEnd())
	const changelog: Changelog = {
		packageName: '',
		versions: [],
	};
	type ParserState = 'packageName' | 'version' | 'semverCategory' | 'changes';
	let state: ParserState = 'packageName';
	let version: Version | undefined;
	let semverCategory: SemverCategory | undefined;

	function handleNode(node: ReturnType<typeof fromMarkdown>['children'][number]) {
		if (node.type === 'heading') {
			if (node.depth === 1) {
				if (state !== 'packageName') throw new Error('Unexpected h1');
				changelog.packageName = ToString(node);
				state = 'version';
				return;
			}
			if (node.depth === 2) {
				if (state === 'packageName') throw new Error('Unexpected h2');
				version = {
					version: ToString(node),
					changes: {
						major: { type: 'list', children: [] },
						minor: { type: 'list', children: [] },
						patch: { type: 'list', children: [] },
					},
					includes: new Set<string>(),
				};
				changelog.versions.push(version);
				state = 'semverCategory';
				return;
			}
			if (node.depth === 3) {
				if (state === 'packageName' || state === 'version') throw new Error('Unexpected h3');
				semverCategory = (ToString(node).split(' ')[0] || '').toLowerCase() as SemverCategory;
				if (!semverCategories.includes(semverCategory))
					throw new Error(`Unexpected semver category: ${semverCategory}`);
				state = 'changes';
				return;
			}
		}
		if (node.type === 'list') {
			if (state !== 'changes' || !version || !semverCategory) throw new Error('Unexpected list');
			// Go through list items
			for (let listItemIdx = 0; listItemIdx < node.children.length; listItemIdx++) {
				const listItem = node.children[listItemIdx];
				if (!listItem) continue;

				// Check if the current list item ends with a nested sublist that consists
				// of items matching the pattern `<some-package-name>@<version>`
				const lastChild = listItem.children[listItem.children.length - 1];
				if (lastChild?.type === 'list') {
					const packageRefs: string[] = [];
					lastChild.children.forEach((subListItem) => {
						const text = ToString(subListItem);
						if (parsePackageReference(text)) packageRefs.push(text);
					});
					if (packageRefs.length === lastChild.children.length) {
						// If so, add the packages to `includes`
						for (const packageRef of packageRefs) {
							version.includes.add(packageRef);
						}
						// Remove the sub-list from the list item
						listItem.children.pop();
					}
				}

				const firstPara =
					listItem.children[0]?.type === 'paragraph' ? listItem.children[0] : undefined;
				if (firstPara) {
					// Remove IDs like `bfed62a: ...` or `... [85dbab8]` from the first paragraph
					visit(firstPara, 'text', (textNode) => {
						textNode.value = textNode.value.replace(/(^[0-9a-f]{7,}: | \[[0-9a-f]{7,}\]$)/, '');
					});
					// Skip list items that only contain the text `Updated dependencies`
					const firstParaText = ToString(firstPara);
					if (firstParaText === 'Updated dependencies') continue;
					// If the list item is a package reference, add it to `includes` instead
					const packageRef = parsePackageReference(firstParaText);
					if (packageRef) {
						version.includes.add(firstParaText);
						continue;
					}
					// Add the list item to the changes
					version.changes[semverCategory].children.push(listItem);
				}
			}
			return;
		}
		throw new Error(`Unexpected node: ${JSON.stringify(node)}`);
	}

	ast.children.forEach((node) => {
		handleNode(node);
	});

	return changelog;
}

/**
 * Parses a package reference string in the format `<packageName>@<version>`.
 *
 * The package name can include scoped names (e.g., `@scope/package`) and hyphens.
 * The version must consist of digits and dots (e.g., `1.2.3`).
 *
 * @param str - The package reference string to parse.
 * @returns An object containing `packageName` and `version` if parsing succeeds; otherwise, `undefined`.
 */
function parsePackageReference(str: string) {
	const matches = str.match(/^([@/a-z0-9-]+)@([0-9.]+)$/);
	if (!matches) return;
	const [, packageName, version] = matches;
	return { packageName, version };
}
