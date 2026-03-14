import * as Schema from 'effect/Schema';
import { AuthAPIErrorSchema } from './schemas.js';

/**
 * Standard error response schema for the StudioCMS Auth API.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export class AuthAPIError extends Schema.TaggedError<AuthAPIError>()(
	'AuthAPIError',
	AuthAPIErrorSchema
) {}
