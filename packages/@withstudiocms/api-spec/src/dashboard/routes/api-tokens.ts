import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import {
	CreateApiTokenPayload,
	CreateApiTokenResponse,
	DeleteApiTokenPayload,
	successResponseSchema,
} from '../schemas.js';

/**
 * Create API Token Endpoint
 *
 * This endpoint allows creating a new API token for accessing the StudioCMS Dashboard API.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const apiTokensPost = HttpApiEndpoint.post('createApiToken', '/api-tokens')
	.annotate(Title, 'Create API Token')
	.annotate(Summary, 'Create a new API token for accessing the StudioCMS Dashboard API')
	.annotate(
		Description,
		'Creates a new API token that can be used to access the StudioCMS Dashboard API.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(CreateApiTokenPayload)
	.addSuccess(CreateApiTokenResponse)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Revoke API Token Endpoint
 *
 * This endpoint allows revoking an existing API token for the StudioCMS Dashboard API.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const apiTokensDelete = HttpApiEndpoint.del('revokeApiToken', '/api-tokens')
	.annotate(Title, 'Revoke API Token')
	.annotate(Summary, 'Revoke an existing API token for the StudioCMS Dashboard API')
	.annotate(
		Description,
		'Revokes an existing API token that was used to access the StudioCMS Dashboard API.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(DeleteApiTokenPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
