import * as Schema from 'effect/Schema';
import { errorResponseSchema } from './schemas.js';

/**
 * Standard error response schema for the StudioCMS SDK API.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export class SDKAPIError extends Schema.TaggedError<SDKAPIError>()(
	'SDKAPIError',
	errorResponseSchema
) {}
