import { SDKCore } from 'studiocms:sdk';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSSDKApiSpec } from '@withstudiocms/api-spec';
import { SDKAPIError } from '@withstudiocms/api-spec/sdk';
import { Effect, Layer } from 'effect';
import { ProcessChangelog } from './_utils/changelog.js';

/**
 * Utility function to catch errors in the Effect chain and convert them into SDKAPIError instances with a provided message. This is used to ensure that any errors that occur during the processing of SDK API requests are properly handled and returned in a consistent format to the client.
 *
 * @param message A custom error message to use in the SDKAPIError if an error occurs. This message provides context about where the error occurred and what operation was being attempted, making it easier for clients to understand the nature of the error when they receive it.
 * @returns An Effect that catches any errors that occur in the chain and transforms them into SDKAPIError instances with the provided message.
 */
const catchError = (message: string) =>
	Effect.catchAll((error: Error) => new SDKAPIError({ error: error.message || message }));

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
				catchError('Failed to generate changelog')
			)
		)
		.handle('listPages', () =>
			SDKCore.pipe(
				Effect.flatMap((sdk) => sdk.GET.pages()),
				Effect.map((pages) => ({ lastUpdated: new Date().toISOString(), pages })),
				catchError('Failed to list SDK pages')
			)
		)
		.handle('updateLatestVersionCache', () =>
			SDKCore.pipe(
				Effect.flatMap((sdk) => sdk.UPDATE.latestVersion()),
				Effect.map((latestVersion) => ({ success: true, latestVersion })),
				catchError('Failed to update latest version cache')
			)
		)
);

/**
 * Live SDK API Handler Layer - Provides the SDKAPIHandler with all necessary dependencies for live operation.
 */
export const SDKAPILive = HttpApiBuilder.api(StudioCMSSDKApiSpec).pipe(
	Layer.provide(SDKAPIHandler)
);
