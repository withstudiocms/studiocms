import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import {
	MailerSmtpConfigPayload,
	MailerTestEmailPayload,
	successResponseSchema,
} from '../schemas.js';

/**
 * Test Email Service Endpoint
 *
 * This endpoint allows sending a test email to verify that the mailer service is functioning correctly.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const mailerCheckEmailPost = HttpApiEndpoint.post('test-email-service', '/mailer/test-email')
	.annotate(Title, 'Test Email Service')
	.annotate(Summary, 'Send a test email to verify the mailer service is functioning correctly')
	.annotate(
		Description,
		'Sends a test email to the specified email address to verify that the mailer service is configured and functioning correctly in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(MailerTestEmailPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Mailer Configuration Setup Endpoint
 *
 * This endpoint allows setting up or updating the mailer configuration for the StudioCMS instance.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const mailerConfigPost = HttpApiEndpoint.post('setupMailerConfig', '/mailer/config')
	.annotate(Title, 'Setup Mailer Configuration')
	.annotate(Summary, 'Setup mailer configuration for the StudioCMS instance')
	.annotate(
		Description,
		'Sets up the mailer configuration for the StudioCMS instance.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(MailerSmtpConfigPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Mailer Configuration Update Endpoint
 *
 * This endpoint allows updating the mailer configuration for the StudioCMS instance.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const mailerConfigPatch = HttpApiEndpoint.patch('updateMailerConfig', '/mailer/config')
	.annotate(Title, 'Update Mailer Configuration')
	.annotate(Summary, 'Update mailer configuration for the StudioCMS instance')
	.annotate(
		Description,
		'Updates the mailer configuration for the StudioCMS instance.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(MailerSmtpConfigPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
