import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { SDKAPIError } from '../errors.js';
import { FullChangelogResponseSchema, UpdateLatestVersionCacheResponseSchema } from '../schemas.js';

/**
 * HTTP API endpoint for retrieving the full changelog.
 *
 * @remarks
 * This endpoint provides access to the complete changelog for the StudioCMS SDK in JSON format.
 * It is a POST endpoint that returns the changelog data along with a success status indicator.
 *
 * @endpoint POST /full-changelog
 * @title Get Full Changelog
 * @summary Retrieve the full changelog in JSON format.
 *
 * @returns A response object containing:
 * - `success` - A boolean indicating if the request was successful
 * - `changelog` - A string containing the changelog data
 *
 * @throws {SDKAPIError} Returns a 500 status code on server error
 */
export const fullChangelogPost = HttpApiEndpoint.post('fullChangelog', '/full-changelog')
	.annotate(Title, 'Get Full Changelog')
	.annotate(Summary, 'Retrieve the full changelog in JSON format.')
	.annotate(Description, 'Retrieves the complete changelog for the StudioCMS SDK in JSON format.')
	.setPayload(
		Schema.Struct({
			currentURLOrigin: Schema.String,
		}).annotations({
			title: 'Full Changelog Request Payload',
			description:
				'The payload for requesting the full changelog, containing the current URL origin.',
		})
	)
	.addSuccess(FullChangelogResponseSchema)
	.addError(SDKAPIError, { status: 500 });

/**
 * HTTP API endpoint for updating the latest version cache.
 *
 * @remarks
 * This endpoint triggers an update of the latest version cache for the StudioCMS SDK.
 * It is a GET endpoint that returns a success status and the latest version information.
 *
 * @endpoint GET /update-latest-version-cache
 * @title Update Latest Version Cache
 * @summary Update the latest version cache.
 *
 * @returns A response object containing:
 * - `success` - A boolean indicating if the update was successful
 * - `latestVersion` - An object containing the latest version string and last cache update date
 *
 * @throws {SDKAPIError} Returns a 500 status code on server error
 */
export const updateLatestVersionCacheGet = HttpApiEndpoint.get(
	'updateLatestVersionCache',
	'/update-latest-version-cache'
)
	.annotate(Title, 'Update Latest Version Cache')
	.annotate(Summary, 'Update the latest version cache.')
	.annotate(Description, 'Triggers an update of the latest version cache for the StudioCMS SDK.')
	.addSuccess(UpdateLatestVersionCacheResponseSchema)
	.addError(SDKAPIError, { status: 500 });
