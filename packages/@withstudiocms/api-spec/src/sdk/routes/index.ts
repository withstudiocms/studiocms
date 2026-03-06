import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { CombinedUserDataSchema } from '../../rest-api/schemas.js';
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

/**
 * HTTP API endpoint for rendering Markdown to HTML.
 *
 * @endpoint GET /render
 * @title Render Markdown
 * @summary Render Markdown to HTML.
 *
 * @returns A response object containing:
 * - `html` - A string containing the rendered HTML
 *
 * @throws {SDKAPIError} Returns a 500 status code on server error
 */
export const renderMarkdown = HttpApiEndpoint.get('renderMarkdown', '/render')
	.annotate(Title, 'Render Markdown')
	.annotate(Summary, 'Render Markdown to HTML.')
	.annotate(Description, 'Renders the provided Markdown content to HTML format.')
	.setUrlParams(
		Schema.Struct({
			content: Schema.optional(Schema.String).annotations({
				description:
					'The Markdown content to be rendered. This can also be provided in the request payload.',
			}),
			'preload-content': Schema.optional(Schema.String).annotations({
				description:
					'Optional preloaded Markdown content that can be used for rendering. This is useful for cases where the content is too large to be sent as a URL parameter and can be included in the request payload instead.',
			}),
		}).annotations({
			title: 'Render Markdown URL Parameters',
			description:
				'The URL parameters for the render Markdown endpoint, including the Markdown content to be rendered and optional preloaded content.',
		})
	)
	.setPayload(
		Schema.Struct({
			content: Schema.optional(Schema.String).annotations({
				description:
					'The Markdown content to be rendered. This can also be provided as a URL parameter.',
			}),
		}).annotations({
			title: 'Render Markdown Request Payload',
			description:
				'The payload for the render Markdown endpoint, containing the Markdown content to be rendered. This can also be provided as a URL parameter.',
		})
	)
	.addSuccess(
		Schema.Struct({
			html: Schema.String.annotations({
				description: 'The rendered HTML content resulting from the Markdown input.',
			}),
		}).annotations({
			title: 'Render Markdown Response',
			description:
				'The response schema for the render Markdown endpoint, containing the rendered HTML.',
			example: {
				html: '<p>This is the rendered HTML content.</p>',
			},
		})
	)
	.addError(SDKAPIError, { status: 500 });

/**
 * HTTP API endpoint for retrieving user list items for the SDK.
 */
export const userListItems = HttpApiEndpoint.post('userListItems', '/user-list-items')
	.annotate(Title, 'Get User List Items')
	.annotate(Summary, 'Retrieve a list of user items for the SDK.')
	.annotate(Description, 'Retrieves a list of user items that can be used in the SDK.')
	.setPayload(
		Schema.Struct({
			users: Schema.Array(CombinedUserDataSchema),
			searchQuery: Schema.optional(Schema.String),
		})
	)
	.addSuccess(
		Schema.Struct({
			html: Schema.String.annotations({
				description: 'The rendered HTML content for the user list items.',
			}),
		})
	)
	.addError(SDKAPIError, { status: 500 });
