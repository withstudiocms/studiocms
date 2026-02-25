import { SDKCore } from 'studiocms:sdk';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSSDKApiSpec } from '@withstudiocms/api-spec';
import { SDKAPIError } from '@withstudiocms/api-spec/sdk';
import { Effect, Layer } from 'effect';
import { ProcessChangelog } from './_utils/changelog.js';

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
				Effect.flatMap(({ runPipeline }) => runPipeline),
				Effect.map((renderedChangelog) => ({ success: true, changelog: renderedChangelog })),
				ProcessChangelog.Provide,
				Effect.catchAll(
					(err) => new SDKAPIError({ error: err.message || 'Failed to generate changelog' })
				)
			)
		)
		.handle('listPages', () =>
			SDKCore.pipe(
				Effect.flatMap((sdk) => sdk.GET.pages()),
				Effect.map((pages) => ({ lastUpdated: new Date().toISOString(), pages }))
			)
		)
		.handle('updateLatestVersionCache', () =>
			SDKCore.pipe(
				Effect.flatMap((sdk) => sdk.UPDATE.latestVersion()),
				Effect.map((latestVersion) => ({ success: true, latestVersion }))
			)
		)
);

/**
 * Live SDK API Handler Layer - Provides the SDKAPIHandler with all necessary dependencies for live operation.
 */
export const SDKAPILive = HttpApiBuilder.api(StudioCMSSDKApiSpec).pipe(
	Layer.provide(SDKAPIHandler)
);
