import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { ResetPasswordPayload, successResponseSchema } from '../schemas.js';

/**
 * Reset Password Endpoint
 *
 * This endpoint allows resetting the user password using the provided token.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const resetPasswordPost = HttpApiEndpoint.post('resetPassword', '/reset-password')
	.annotate(Title, 'Reset Password')
	.annotate(Summary, 'Reset the user password using the provided token')
	.annotate(
		Description,
		'Resets the user password using the provided token.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(ResetPasswordPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
