import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { PluginPathParamSchema, PluginSettingsPayload, successResponseSchema } from '../schemas.js';

/**
 * Save Plugin Settings Endpoint
 *
 * This endpoint allows saving the settings for a specific plugin in the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const pluginsSettingsPost = HttpApiEndpoint.post('savePluginSettings', '/plugins/:plugin')
	.setPath(PluginPathParamSchema)
	.annotate(Title, 'Save Plugin Settings')
	.annotate(Summary, 'Save settings for a specific plugin')
	.annotate(
		Description,
		'Saves the settings for a specific plugin in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(PluginSettingsPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
