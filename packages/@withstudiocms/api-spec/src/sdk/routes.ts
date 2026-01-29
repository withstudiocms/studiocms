import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { PublicV1GetPagesSelect } from '../rest-api/schemas.js';
import { SDKAPIError } from './errors.js';

// TODO: Full changelog endpoint should ideally not use .json in the path
// This is kept in the current spec as this is how it's currently implemented
// We should consider changing this in future versions as it's one of the only
// endpoints using this pattern.

/**
 * HTTP API endpoint for retrieving the full changelog.
 *
 * @remarks
 * This endpoint provides access to the complete changelog for the StudioCMS SDK in JSON format.
 * It is a POST endpoint that returns the changelog data along with a success status indicator.
 *
 * @endpoint POST /full-changelog.json
 * @title Get Full Changelog
 * @summary Retrieve the full changelog in JSON format.
 *
 * @returns A response object containing:
 * - `success` - A boolean indicating if the request was successful
 * - `changelog` - A string containing the changelog data
 *
 * @throws {SDKAPIError} Returns a 500 status code on server error
 */
export const fullChangelogPost = HttpApiEndpoint.post('FullChangelogPost', '/full-changelog.json')
	.annotate(Title, 'Get Full Changelog')
	.annotate(Summary, 'Retrieve the full changelog in JSON format.')
	.annotate(Description, 'Retrieves the complete changelog for the StudioCMS SDK in JSON format.')
	.addSuccess(
		Schema.Struct({
			success: Schema.Boolean,
			changelog: Schema.String,
		})
	)
	.addError(SDKAPIError, { status: 500 });

/**
 * HTTP API endpoint options for the full changelog.
 *
 * Defines the OPTIONS endpoint at `/full-changelog` that provides metadata about
 * the full changelog endpoint, including allowed HTTP methods and capabilities.
 *
 * @remarks
 * This endpoint follows the HTTP OPTIONS pattern to expose endpoint capabilities
 * without performing any data operations.
 *
 * @returns A void response on success
 * @throws {SDKAPIError} When a server error occurs (HTTP 500)
 */
export const fullChangelogOptions = HttpApiEndpoint.options(
	'FullChangelogOptions',
	'/full-changelog.json'
)
	.annotate(Title, 'Options for Full Changelog')
	.annotate(Summary, 'Retrieve Full Changelog Options')
	.annotate(
		Description,
		'Provides information about the /full-changelog endpoint, including allowed methods.'
	)
	.addSuccess(Schema.Void)
	.addError(SDKAPIError, { status: 500 });

/**
 * HTTP API endpoint for listing pages.
 *
 * @remarks
 * This endpoint provides a list of pages available in the StudioCMS SDK.
 * It is a GET endpoint that returns the last updated timestamp and an array of pages.
 *
 * @endpoint GET /list-pages
 * @title List Pages
 * @summary Retrieve a list of pages.
 *
 * @returns A response object containing:
 * - `lastUpdated` - A string timestamp of the last update
 * - `pages` - An array of page objects
 *
 * @throws {SDKAPIError} Returns a 500 status code on server error
 */
export const listPagesGet = HttpApiEndpoint.get('ListPagesGet', '/list-pages')
	.annotate(Title, 'List Pages')
	.annotate(Summary, 'Retrieve a list of pages.')
	.annotate(
		Description,
		'Retrieves a list of pages available in the StudioCMS SDK. (Does not show draft pages)'
	)
	.addSuccess(
		Schema.Struct({
			lastUpdated: Schema.String,
			pages: Schema.Array(PublicV1GetPagesSelect),
		})
	)
	.addError(SDKAPIError, { status: 500 });

/**
 * HTTP API endpoint options for listing pages.
 *
 * Defines the OPTIONS endpoint at `/list-pages` that provides metadata about
 * the list pages endpoint, including allowed HTTP methods and capabilities.
 *
 * @remarks
 * This endpoint follows the HTTP OPTIONS pattern to expose endpoint capabilities
 * without performing any data operations.
 *
 * @returns A void response on success
 * @throws {SDKAPIError} When a server error occurs (HTTP 500)
 */
export const listPagesOptions = HttpApiEndpoint.options('ListPagesOptions', '/list-pages')
	.annotate(Title, 'Options for List Pages')
	.annotate(Summary, 'Retrieve List Pages Options')
	.annotate(
		Description,
		'Provides information about the /list-pages endpoint, including allowed methods.'
	)
	.addSuccess(Schema.Void)
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
	'UpdateLatestVersionCacheGet',
	'/update-latest-version-cache'
)
	.annotate(Title, 'Update Latest Version Cache')
	.annotate(Summary, 'Update the latest version cache.')
	.annotate(Description, 'Triggers an update of the latest version cache for the StudioCMS SDK.')
	.addSuccess(
		Schema.Struct({
			success: Schema.Boolean,
			latestVersion: Schema.Struct({
				version: Schema.String,
				lastCacheUpdate: Schema.Date,
			}),
		})
	)
	.addError(SDKAPIError, { status: 500 });

/**
 * HTTP API endpoint options for updating the latest version cache.
 *
 * Defines the OPTIONS endpoint at `/update-latest-version-cache` that provides metadata about
 * the update latest version cache endpoint, including allowed HTTP methods and capabilities.
 *
 * @remarks
 * This endpoint follows the HTTP OPTIONS pattern to expose endpoint capabilities
 * without performing any data operations.
 *
 * @returns A void response on success
 * @throws {SDKAPIError} When a server error occurs (HTTP 500)
 */
export const updateLatestVersionCacheOptions = HttpApiEndpoint.options(
	'UpdateLatestVersionCacheOptions',
	'/update-latest-version-cache'
)
	.annotate(Title, 'Options for Update Latest Version Cache')
	.annotate(Summary, 'Retrieve Update Latest Version Cache Options')
	.annotate(
		Description,
		'Provides information about the /update-latest-version-cache endpoint, including allowed methods.'
	)
	.addSuccess(Schema.Void)
	.addError(SDKAPIError, { status: 500 });
