import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { EmailNotificationSettingsPayload, successResponseSchema } from '../schemas.js';

/**
 * Update Email Notifications Settings Endpoint
 *
 * This endpoint allows updating the email notifications settings for the StudioCMS instance.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const emailNotificationsSettingsPost = HttpApiEndpoint.post(
	'updateEmailNotificationsSettings',
	'/email-notifications-settings-site'
)
	.annotate(Title, 'Update Email Notifications Settings')
	.annotate(Summary, 'Update the email notifications settings for the StudioCMS instance')
	.annotate(
		Description,
		'Updates the email notifications settings for the StudioCMS instance.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(EmailNotificationSettingsPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
