import { SDKCore } from 'studiocms:sdk';
import type { CombinedPageData } from 'studiocms:sdk/types';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSSDKApiSpec } from '@withstudiocms/api-spec';
import { SDKAPIError } from '@withstudiocms/api-spec/sdk';
import { Effect, Layer } from 'effect';
import { ProcessChangelog } from './_utils/changelog.js';

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
 * Utility function to create a response object for the list pages endpoint.
 */
const makePagesResponse = (pages: CombinedPageData[]) => ({
	lastUpdated: new Date().toISOString(),
	pages,
});

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
		.handle('fullChangelog', ({ payload: { currentURLOrigin } }) =>
			ProcessChangelog.pipe(
				Effect.flatMap(({ runPipeline }) => runPipeline(currentURLOrigin)),
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
		// TODO: This endpoint is unused and should be removed
		.handle('listPages', () =>
			SDKCore.pipe(
				Effect.flatMap((sdk) => sdk.GET.pages()),
				Effect.map(makePagesResponse),
				catchError('Failed to list SDK pages')
			)
		)
);

/**
 * Live SDK API Handler Layer - Provides the SDKAPIHandler with all necessary dependencies for live operation.
 */
export const SDKAPILive = HttpApiBuilder.api(StudioCMSSDKApiSpec).pipe(
	Layer.provide(SDKAPIHandler)
);
