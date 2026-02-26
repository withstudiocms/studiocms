import { HTTPClient, Platform, readAPIContextJson } from '@withstudiocms/effect';
import { loadChangelog, semverCategories } from '@withstudiocms/internal_helpers/utils';
import { Data, Effect, pipe } from 'effect';
import { AstroAPIContext } from 'effectify/astro/context';
import type { List, Root } from 'mdast';
import { toMarkdown } from 'mdast-util-to-markdown';

/**
 * Custom error class used for quick escaping from deep error handling in the Effect chain.
 */
export class ChangelogError extends Data.TaggedError('ChangelogError')<{ message: string }> {}

/**
 * Service for processing the changelog of StudioCMS.
 *
 * This service fetches the raw changelog from the GitHub repository, processes it to extract relevant information, and renders it using a partial endpoint.
 */
export class ProcessChangelog extends Effect.Service<ProcessChangelog>()('ProcessChangelog', {
	effect: Effect.gen(function* () {
		const httpClient = yield* HTTPClient;

		/**
		 * Fetches the raw changelog markdown from the GitHub repository. If the fetch fails, it returns a ChangelogError with details about the failure.
		 */
		const getRawChangelog = () =>
			Effect.gen(function* () {
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

		/**
		 * Processes the raw changelog markdown to extract version information and changes, and then converts it back to markdown format. If any step in the processing fails, it returns a ChangelogError with details about the failure.
		 * @param raw The raw changelog markdown content.
		 * @returns The processed changelog in markdown format.
		 * @throws ChangelogError if processing fails at any step.
		 *
		 */
		const generateChangelog = (raw: string) =>
			Effect.gen(function* () {
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
			});

		/**
		 * Renders the processed changelog markdown by sending it to a partial endpoint. If the rendering fails, it returns a ChangelogError with details about the failure.
		 *
		 * @param content The processed changelog markdown content to be rendered.
		 * @returns The rendered changelog content as returned by the partial endpoint.
		 */
		const renderChangelog = (content: string) =>
			Effect.gen(function* () {
				const ctx = yield* AstroAPIContext;
				const currentRequestJson = yield* readAPIContextJson<{
					currentURLOrigin: string;
				}>(ctx);

				const currentURLOrigin = currentRequestJson.currentURLOrigin;

				const partialUrl = new URL(
					ctx.locals.StudioCMS?.routeMap.endpointLinks.partials.render,
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

		/**
		 * Runs the entire changelog processing pipeline, which includes fetching the raw changelog, generating the processed markdown, and rendering it. If any step in the pipeline fails, it returns a ChangelogError with details about the failure.
		 */
		const runPipeline = pipe(
			getRawChangelog(),
			Effect.flatMap(generateChangelog),
			Effect.flatMap(renderChangelog),
			Effect.catchAll(
				(error) =>
					new ChangelogError({
						message: `Failed to process changelog: ${error instanceof Error ? error.message : String(error)}`,
					})
			)
		);

		return {
			getRawChangelog,
			generateChangelog,
			renderChangelog,
			runPipeline,
		};
	}),
	dependencies: [HTTPClient.Default],
}) {
	static Provide = Effect.provide(this.Default);
}
