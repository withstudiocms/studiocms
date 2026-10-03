import { SDKCore } from 'studiocms:sdk';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSSDKApiSpec } from '@withstudiocms/api-spec';
import { SDKAPIError } from '@withstudiocms/api-spec/sdk';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Effect, Layer } from 'effect';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
// biome-ignore lint/suspicious/noTsIgnore: Typechecker override for Astro component imports
// @ts-ignore - This is an Astro component, so we ignore TypeScript errors for this import
import UserListItems from '../../../components/dashboard/user-mgmt/UserListItems.astro';
import { ProcessChangelog } from './_utils/changelog.js';

/**
 * Parses a Markdown string and returns the rendered output to HTML.
 *
 * @param str - The Markdown string to parse.
 * @returns The rendered output as a string.
 */
export const parseMarkdown = (str: string) =>
	micromark(str, {
		extensions: [gfm()],
		htmlExtensions: [gfmHtml()],
	});

/**
 * Utility function to catch errors in the Effect chain and convert them into SDKAPIError instances with a provided message.
 */
const catchError = (message: string) =>
	Effect.catchAll((error: Error) => new SDKAPIError({ error: error.message || message }));

/**
 * Utility function to create a response object for the changelog endpoint.
 */
const makeChangelogResponse = (changelog: string) => ({ success: true, changelog });

/**
 * Utility function to create a response object for the latest version cache update endpoint.
 */
const makeVersionResponse = (latestVersion: { version: string; lastCacheUpdate: Date }) => ({
	success: true,
	latestVersion,
});

/**
 * SDK API Handler - Handles all API routes related to the StudioCMS SDK, including changelog generation and page listing.
 *
 * Endpoints:
 * - POST /sdk/full-changelog.json: Generates and returns the full changelog in markdown format.
 * - GET /sdk/list-pages: Retrieves a list of all SDK documentation pages with their last updated timestamp.
 * - POST /sdk/update-latest-version-cache: Updates the cache for the latest SDK version and returns the new version information.
 *
 * Each endpoint is implemented as an Effect that interacts with the SDKCore and other utilities to perform the necessary operations.
 */
export const SDKAPIHandler = HttpApiBuilder.group(StudioCMSSDKApiSpec, 'sdk', (handlers) =>
	handlers
		.handle('fullChangelog', () =>
			ProcessChangelog.pipe(
				Effect.flatMap(({ runPipeline }) => runPipeline()),
				Effect.map(makeChangelogResponse),
				ProcessChangelog.Provide,
				catchError('Failed to generate changelog')
			)
		)
		.handle('updateLatestVersionCache', () =>
			SDKCore.pipe(
				Effect.flatMap((sdk) => sdk.UPDATE.latestVersion()),
				Effect.map(makeVersionResponse),
				catchError('Failed to update latest version cache')
			)
		)
);

/**
 * SDK Utilities Handler - Handles utility API routes related to the StudioCMS SDK, such as rendering markdown content.
 */
export const SDKUtilsHandler = HttpApiBuilder.group(StudioCMSSDKApiSpec, 'utils', (handlers) =>
	handlers
		.handle(
			'renderMarkdown',
			Effect.fn(
				({
					urlParams: { content: queryParamContent, 'preload-content': preloadContent },
					payload: { content: payloadContent },
				}) =>
					Effect.try({
						try: () => {
							let markdownContent: string | undefined;

							if (payloadContent) {
								markdownContent = payloadContent;
							} else if (queryParamContent && queryParamContent !== 'null') {
								markdownContent = queryParamContent;
							} else if (preloadContent && preloadContent !== 'null') {
								markdownContent = preloadContent;
							} else {
								markdownContent = 'No content provided';
							}

							const html = parseMarkdown(markdownContent);

							return { html };
						},
						catch: () => new SDKAPIError({ error: 'Failed to render markdown' }),
					})
			)
		)
		.handle(
			'userListItems',
			Effect.fn(({ payload }) =>
				Effect.tryPromise({
					try: async () => {
						const container = await AstroContainer.create();

						let html = 'fail';

						try {
							html = await container.renderToString(UserListItems, {
								props: payload,
							});
						} catch (error) {
							console.error('Error rendering UserListItems:', error);
							throw new SDKAPIError({ error: 'Failed to render user list items' });
						}

						return {
							html,
						};
					},
					catch: () => new SDKAPIError({ error: 'Failed to render user list items' }),
				})
			)
		)
);

/**
 * Live SDK API Handler Layer - Provides the SDKAPIHandler with all necessary dependencies for live operation.
 */
export const SDKAPILive = HttpApiBuilder.api(StudioCMSSDKApiSpec).pipe(
	Layer.provide(SDKAPIHandler),
	Layer.provide(SDKUtilsHandler)
);
