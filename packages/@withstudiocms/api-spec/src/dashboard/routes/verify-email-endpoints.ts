import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import * as Schema from 'effect/Schema';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { ResendVerifyEmailPayload, successResponseSchema, verifyEmailParams } from '../schemas.js';

/**
 * Resend Verify Email Endpoint
 *
 * This endpoint allows resending the verification email to the user.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const resendVerifyEmailPost = HttpApiEndpoint.post(
	'resendVerifyEmail',
	'/resend-verify-email'
)
	.annotate(Title, 'Resend Verify Email')
	.annotate(Summary, 'Resend the verification email to the user')
	.annotate(
		Description,
		'Resends the verification email to the user.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(ResendVerifyEmailPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 401 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Verify Email Endpoint
 *
 * This endpoint allows verifying the user email using the provided token.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const verifyEmailGet = HttpApiEndpoint.get('verifyEmail', '/verify-email')
	.annotate(Title, 'Verify Email')
	.annotate(Summary, 'Verify the user email using the provided token')
	.annotate(
		Description,
		'Verifies the user email using the provided token.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setUrlParams(verifyEmailParams)
	.addSuccess(
		Schema.Null.annotations({
			Description: 'Redirect... (Location header set to URL)',
		}),
		{ status: 302 } // Astro Redirects default to 302
	)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 401 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
