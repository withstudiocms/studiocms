import { Effect, genLogger, HTTPClient, Platform, readAPIContextJson } from '@withstudiocms/effect';
import { loadChangelog, semverCategories } from '@withstudiocms/internal_helpers/utils';
import type { APIContext } from 'astro';
import { Data } from 'effect';
import type { List, Root } from 'mdast';
import { toMarkdown } from 'mdast-util-to-markdown';

export class ChangelogError extends Data.TaggedError('ChangelogError')<{ message: string }> {}

export class ProcessChangelog extends Effect.Service<ProcessChangelog>()('ProcessChangelog', {
	effect: genLogger('routes/sdk/utils/changelog/ProcessChangelog/effect')(function* () {
		const httpClient = yield* HTTPClient;

		const getRawChangelog = () =>
			genLogger('routes/sdk/utils/changelog/ProcessChangelog/effect.getRawChangelog')(function* () {
				const data = yield* httpClient.get(
					'https://raw.githubusercontent.com/withstudiocms/studiocms/refs/heads/main/packages/studiocms/CHANGELOG.md'
				);

				if (data.status !== 200) {
					return yield* new ChangelogError({
						message: `Failed to fetch CHANGELOG.md: ${data.status} ${data.toString()}`,
					});
				}

				return yield* data.text;
			});

		const generateChangelog = (raw: string) =>
			genLogger('routes/sdk/utils/changelog/ProcessChangelog/effect.generateChangelog')(
				function* () {
					const ToProcess = yield* Effect.try(() => loadChangelog({ raw }));

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
