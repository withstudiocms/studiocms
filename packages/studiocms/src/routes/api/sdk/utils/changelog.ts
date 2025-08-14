import type { APIContext } from 'astro';
import type { List, Root } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';
import { toString as ToString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import { Effect, genLogger, HTTPClient, Platform, readAPIContextJson } from '../../../../effect.js';

export type ParserState = 'packageName' | 'version' | 'semverCategory' | 'changes';

export const semverCategories = ['major', 'minor', 'patch'] as const;
export type SemverCategory = (typeof semverCategories)[number];

export type Version = {
	version: string;
	changes: { [key in SemverCategory]: List };
	includes: Set<string>;
};

export type Changelog = {
	packageName: string;
	versions: Version[];
};

function parsePackageReference(str: string) {
	const matches = str.match(/^([@/a-z0-9-]+)@([0-9.]+)$/);
	if (!matches) return;
	const [, packageName, version] = matches;
	return { packageName, version };
}

export class ProcessChangelog extends Effect.Service<ProcessChangelog>()('ProcessChangelog', {
	effect: genLogger('routes/sdk/utils/changelog/ProcessChangelog/effect')(function* () {
		const httpClient = yield* HTTPClient;

		const getRawChangelog = () =>
			genLogger('routes/sdk/utils/changelog/ProcessChangelog/effect.getRawChangelog')(function* () {
				return yield* httpClient
					.get(
						'https://raw.githubusercontent.com/withstudiocms/studiocms/refs/heads/main/packages/studiocms/CHANGELOG.md'
					)
					.pipe(Effect.flatMap((res) => res.text));
			});

		const generateChangelog = (raw: string) =>
			genLogger('routes/sdk/utils/changelog/ProcessChangelog/effect.generateChangelog')(
				function* () {
					let markdown = raw;

					// Convert GitHub usernames in "Thanks ..." sentences to links
					markdown = yield* Effect.try(() =>
						markdown.replace(
							/(?<=Thank[^.!]*? )@([a-z0-9-]+)(?=[\s,.!])/gi,
							'[@$1](https://github.com/$1)'
						)
					);

					const astStart = yield* Effect.try(() => fromMarkdown(markdown));

					const changelog: Changelog = {
						packageName: '',
						versions: [],
					};

					let state: ParserState = 'packageName';
					let version: Version | undefined;
					let semverCategory: SemverCategory | undefined;

					const handleNode = (node: ReturnType<typeof fromMarkdown>['children'][number]) =>
						Effect.try(() => {
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
									if (state === 'packageName' || state === 'version')
										throw new Error('Unexpected h3');
									semverCategory = (
										ToString(node).split(' ')[0] || ''
									).toLowerCase() as SemverCategory;
									if (!semverCategories.includes(semverCategory))
										throw new Error(`Unexpected semver category: ${semverCategory}`);
									state = 'changes';
									return;
								}
							}
							if (node.type === 'list') {
								if (state !== 'changes' || !version || !semverCategory)
									throw new Error('Unexpected list');
								// Go through list items
								for (let listItemIdx = 0; listItemIdx < node.children.length; listItemIdx++) {
									const listItem = node.children[listItemIdx];
									if (!listItem) continue;

									// Check if the current list item ends with a nested sub-list that consists
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
											textNode.value = textNode.value.replace(
												/(^[0-9a-f]{7,}: | \[[0-9a-f]{7,}\]$)/,
												''
											);
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
						});

					for (const node of astStart.children) {
						yield* handleNode(node);
					}

					const ToProcess = changelog;

					const output: string[] = [];

					const astEnd: Root = {
						type: 'root',
						children: [],
					};

					for (const version of ToProcess.versions) {
						const versionChanges: List = { type: 'list', children: [] };

						for (const semverCategory of semverCategories) {
							for (const listItem of version.changes[semverCategory].children) {
								versionChanges.children.push(listItem);
							}
						}

						if (version.includes.size) {
							versionChanges.children.push({
								type: 'listItem',
								children: [
									{
										type: 'paragraph',
										children: [
											{ type: 'text', value: `Includes: ${[...version.includes].join(', ')} ` },
										],
									},
								],
							});
						}

						if (!versionChanges.children.length) continue;

						astEnd.children.push({
							type: 'heading',
							depth: 2,
							children: [{ type: 'text', value: version.version }],
						});

						astEnd.children.push(versionChanges);
					}

					const outputData = yield* Effect.try(() => toMarkdown(astEnd, { bullet: '-' }));

					output.push(outputData);

					const markdownString = output.join('\n');

					return markdownString;
				}
			);

		const renderChangelog = (content: string, context: APIContext) =>
			genLogger('routes/sdk/utils/changelog/ProcessChangelog/effect.renderChangelog')(function* () {
				const currentRequestJson = yield* readAPIContextJson<{
					currentURLOrigin: string;
				}>(context);

				const currentURLOrigin = currentRequestJson.currentURLOrigin;

				const partialUrl = new URL(
					context.locals.StudioCMS?.routeMap.endpointLinks.partials.render,
					currentURLOrigin
				);

				return yield* Platform.HttpClientRequest.post(partialUrl).pipe(
					Platform.HttpClientRequest.setHeaders({
						'Content-Type': 'application/json',
					}),
					Platform.HttpClientRequest.bodyJson({
						content,
					}),
					Effect.flatMap(httpClient.execute),
					Effect.flatMap((response) => response.text)
				);
			});

		return {
			getRawChangelog,
			generateChangelog,
			renderChangelog,
		};
	}),
	dependencies: [HTTPClient.Default],
}) {
	static Provide = Effect.provide(this.Default);
}
