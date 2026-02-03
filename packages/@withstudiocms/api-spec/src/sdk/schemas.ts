import * as Schema from 'effect/Schema';
import { PublicV1GetPagesSelect } from '../rest-api/schemas.js';

/**
 * Standard error response schema for the StudioCMS APIs.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export const errorResponseSchema = Schema.Struct({
	error: Schema.String,
});

/**
 * Response schema for the full changelog endpoint.
 *
 * @remarks
 * This schema defines the structure of the response returned by the full changelog endpoint.
 * It includes two properties:
 * - `success`: A boolean indicating whether the request was successful.
 * - `changelog`: A string containing the full changelog information.
 */
export const FullChangelogResponseSchema = Schema.Struct({
	success: Schema.Boolean,
	changelog: Schema.String,
}).annotations({
	title: 'FullChangelogResponse',
	description: 'Response schema for the full changelog endpoint.',
});

/**
 * Response schema for the list pages endpoint.
 *
 * @remarks
 * This schema defines the structure of the response returned by the list pages endpoint.
 * It includes two properties:
 * - `lastUpdated`: A string timestamp indicating when the pages were last updated.
 * - `pages`: An array of page objects as defined by the PublicV1GetPagesSelect schema.
 */
export const ListPagesResponseSchema = Schema.Struct({
	lastUpdated: Schema.String,
	pages: Schema.Array(PublicV1GetPagesSelect),
}).annotations({
	title: 'ListPagesResponse',
	description: 'Response schema for the list pages endpoint.',
});

/**
 * Response schema for the update latest version cache endpoint.
 *
 * @remarks
 * This schema defines the structure of the response returned by the update latest version cache endpoint.
 * It includes two properties:
 * - `success`: A boolean indicating whether the request was successful.
 * - `latestVersion`: An object containing the latest version information.
 */
export const UpdateLatestVersionCacheResponseSchema = Schema.Struct({
	success: Schema.Boolean,
	latestVersion: Schema.Struct({
		version: Schema.String,
		lastCacheUpdate: Schema.Date,
	}),
}).annotations({
	title: 'UpdateLatestVersionCacheResponse',
	description: 'Response schema for the update latest version cache endpoint.',
});
