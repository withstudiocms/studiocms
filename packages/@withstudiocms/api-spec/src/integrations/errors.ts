import { Schema } from 'effect';
import { IntegrationsErrorResponse } from './schemas.js';

/**
 * Standard error response schema for the StudioCMS Integrations API.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export class IntegrationsAPIError extends Schema.TaggedError<IntegrationsAPIError>()(
	'IntegrationsAPIError',
	IntegrationsErrorResponse
) {}
