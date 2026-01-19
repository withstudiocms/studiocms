import { Schema } from 'effect';

/**
 * Standard error response schema for the StudioCMS REST API.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export class RestAPIError extends Schema.TaggedError<RestAPIError>()('RestAPIError', {
	error: Schema.String,
}) {}
