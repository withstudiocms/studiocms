import { HttpApi } from '@effect/platform';
import { Description, Title } from '@effect/platform/OpenApi';
import { RestAPIError } from './errors.js';
import { RestApiV1PublicSpec, RestApiV1SecureSpec } from './v1/index.js';

export * from './errors.js';
export * from './middleware.js';
export * from './schemas.js';

/**
 * StudioCMS REST API Specification
 *
 * Defines the complete REST API specification for StudioCMS, combining both secure and public API endpoints.
 *
 * @remarks
 * This class extends HttpApi to create a comprehensive API specification that includes:
 * - A base prefix of `/studiocms_api/rest` for all endpoints
 * - Secure API endpoints (v1) requiring authentication
 * - Public API endpoints (v1) accessible without authentication
 *
 * The API is built using the Effect HTTP API framework and follows OpenAPI/Swagger standards
 * through the Title and Description annotations.
 *
 * @see {@link RestApiV1SecureSpec} for secure endpoint definitions
 * @see {@link RestApiV1PublicSpec} for public endpoint definitions
 */
export class StudioCMSRestApiSpec extends HttpApi.make('StudioCMSRestApiSpec')
	.annotate(Title, 'StudioCMS REST API Specification')
	.annotate(Description, 'API specification for StudioCMS REST API')
	.prefix('/studiocms_api/rest')
	.add(RestApiV1SecureSpec)
	.add(RestApiV1PublicSpec)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 }) {}
