import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
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
export const SettingsIndexGet = HttpApiEndpoint.get('getSettings', '/settings')
	.annotate(Title, 'Get Settings')
	.annotate(Summary, 'Retrieve Settings')
	.annotate(Description, 'Retrieves the current settings.')
	.middleware(RestAPIAuthorization)
	.addSuccess(StudioCMSDynamicSiteConfigComplete)
	.addError(RestAPIError, { status: 500 });

/**
 * PATCH /settings
 * Updates the current settings.
 */
export const SettingsIndexPatch = HttpApiEndpoint.patch('updateSettings', '/settings')
	.annotate(Title, 'Update Settings')
	.annotate(Summary, 'Update Settings')
	.annotate(Description, 'Updates the current settings.')
	.setPayload(StudioCMSDynamicSiteConfigData)
	.middleware(RestAPIAuthorization)
	.addSuccess(SuccessResponse)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 });
