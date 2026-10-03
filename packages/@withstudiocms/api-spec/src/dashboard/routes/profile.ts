import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { successResponseSchema, UpdateUserProfilePayload } from '../schemas.js';

/**
 * Update User Profile Endpoint
 *
 * This endpoint allows updating the profile information of the logged-in user in the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const profilePost = HttpApiEndpoint.post('updateUserProfile', '/profile')
	.annotate(Title, 'Update User Profile')
	.annotate(Summary, 'Update the profile information of the logged-in user')
	.annotate(
		Description,
		'Updates the profile information of the logged-in user in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(UpdateUserProfilePayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 401 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
