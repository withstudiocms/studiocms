import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import type { List, Root } from 'mdast';
import { toMarkdown } from 'mdast-util-to-markdown';
import { loadChangelog, semverCategories } from './changelogLoader.js';

const { resolve } = createResolver(import.meta.url);

export const changelogHelper = defineUtility('astro:config:setup')((params) => {
	const changelog = loadChangelog(resolve('../../../CHANGELOG.md'));

	// Generate markdown output
	const output: string[] = [];

	const ast: Root = {
		type: 'root',
		children: [],
	};

	// Get the latest version changelog
	const latestVersion = changelog.versions[0];

	// Get the latest version changes
	const latestVersionChanges: List = { type: 'list', children: [] };

	if (latestVersion) {
		for (const semverCategory of semverCategories) {
			for (const listItem of latestVersion.changes[semverCategory].children) {
				latestVersionChanges.children.push(listItem);
			}
		}

		if (latestVersion.includes.size) {
			latestVersionChanges.children.push({
				type: 'listItem',
				children: [
					{
						type: 'paragraph',
						children: [
							{ type: 'text', value: `Includes: ${[...latestVersion.includes].join(', ')} ` },
						],
					},
				],
			});
		}

		ast.children.push({
			type: 'heading',
			depth: 2,
			children: [{ type: 'text', value: `${latestVersion.version}` }],
		});
	}

	if (latestVersionChanges.children.length) {
		ast.children.push(latestVersionChanges);
	}

	output.push(toMarkdown(ast, { bullet: '-' }));

	const markdownString = output.join('\n');

	addVirtualImports(params, {
		name: 'studiocms/changelog',
		imports: {
			'studiocms:changelog': `export default ${JSON.stringify(markdownString)};`,
		},
	});
});
