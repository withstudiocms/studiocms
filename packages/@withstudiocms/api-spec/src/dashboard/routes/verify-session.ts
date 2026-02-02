import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { verifySessionPayload, verifySessionResponse } from '../schemas.js';

/**
 * Verify Session Endpoint
 *
 * This endpoint allows verifying the current user session for the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const verifySessionPost = HttpApiEndpoint.post('verifySession', '/verify-session')
	.annotate(Title, 'Verify Session')
	.annotate(Summary, 'Verify the current user session for the StudioCMS dashboard')
	.annotate(
		Description,
		'Verifies the current user session for the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(verifySessionPayload)
	.addSuccess(verifySessionResponse)
	.addError(DashboardAPIError, { status: 401 })
	.addError(DashboardAPIError, { status: 500 });
