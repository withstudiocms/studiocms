import fs from 'node:fs';
import type { List } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString as ToString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';

export type Changelog = {
	packageName: string;
	versions: Version[];
};

export type Version = {
	version: string;
	changes: { [key in SemverCategory]: List };
	includes: Set<string>;
};

export const semverCategories = ['major', 'minor', 'patch'] as const;
export type SemverCategory = (typeof semverCategories)[number];

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
					// biome-ignore lint/complexity/noForEach: <explanation>
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

	// biome-ignore lint/complexity/noForEach: <explanation>
	ast.children.forEach((node) => {
		handleNode(node);
	});

	return changelog;
}

function parsePackageReference(str: string) {
	const matches = str.match(/^([@/a-z0-9-]+)@([0-9.]+)$/);
	if (!matches) return;
	const [, packageName, version] = matches;
	return { packageName, version };
}
