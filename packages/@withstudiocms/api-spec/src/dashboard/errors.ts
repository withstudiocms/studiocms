import { Schema } from 'effect';
import { errorResponseSchema } from './schemas.js';

/**
 * Standard error response schema for the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export class DashboardAPIError extends Schema.TaggedError<DashboardAPIError>()(
	'DashboardAPIError',
	errorResponseSchema
) {}
