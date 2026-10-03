import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { successResponseSchema, UpdateConfigPayload } from '../schemas.js';

/**
 * Dashboard Configuration Update Endpoint
 *
 * This endpoint allows updating the configuration settings for the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const configPost = HttpApiEndpoint.post('updateSiteConfig', '/config')
	.annotate(Title, 'Update Dashboard Configuration')
	.annotate(Summary, 'Update the configuration settings for the StudioCMS dashboard')
	.annotate(
		Description,
		'Updates the configuration settings for the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(UpdateConfigPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
