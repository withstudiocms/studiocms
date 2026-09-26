import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import * as Schema from 'effect/Schema';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { successResponseSchema } from '../schemas.js';

/**
 * Update Email Templates Endpoint
 *
 * This endpoint allows updating the email templates for the StudioCMS instance.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const templatesPost = HttpApiEndpoint.post('updateEmailTemplates', '/templates')
	.annotate(Title, 'Update Email Templates')
	.annotate(Summary, 'Update the email templates for the StudioCMS instance')
	.annotate(
		Description,
		'Updates the email templates for the StudioCMS instance.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(
		Schema.Record({
			key: Schema.String,
			value: Schema.String,
		})
	)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
