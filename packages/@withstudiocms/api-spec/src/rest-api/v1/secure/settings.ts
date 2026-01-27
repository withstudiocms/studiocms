import { HttpApiEndpoint } from '@effect/platform';
import { Description, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors.js';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	StudioCMSDynamicSiteConfigComplete,
	StudioCMSDynamicSiteConfigData,
	SuccessResponse,
} from '../../schemas.js';

/**
 * GET /settings
 * Retrieves the current settings.
 */
export const SettingsIndexGet = HttpApiEndpoint.get('SettingsIndexGet', '/settings')
	.annotate(Title, 'Get Settings')
	.annotate(Description, 'Retrieves the current settings.')
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.UndefinedOr(StudioCMSDynamicSiteConfigComplete))
	.addError(RestAPIError, { status: 500 });

/**
 * PATCH /settings
 * Updates the current settings.
 */
export const SettingsIndexPatch = HttpApiEndpoint.patch('SettingsIndexPatch', '/settings')
	.annotate(Title, 'Update Settings')
	.annotate(Description, 'Updates the current settings.')
	.setPayload(StudioCMSDynamicSiteConfigData)
	.middleware(RestAPIAuthorization)
	.addSuccess(SuccessResponse)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /settings
 * Provides information about the /settings endpoint.
 */
export const SettingsIndexOptions = HttpApiEndpoint.options('SettingsIndexOptions', '/settings')
	.annotate(Title, 'Options for Settings')
	.annotate(
		Description,
		'Provides information about the /settings endpoint, including allowed methods.'
	)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
