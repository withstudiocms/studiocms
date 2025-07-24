import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { tsSiteConfigSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context: APIContext): Promise<Response> =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/config.POST')(function* () {
			const sdk = yield* SDKCore;

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isOwner;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Get Json Data
			const siteConfig: Omit<tsSiteConfigSelect, 'id'> = yield* Effect.tryPromise(() =>
				context.request.json()
			);

			// Validate form data
			if (!siteConfig.title) {
				return apiResponseLogger(400, 'Invalid form data, title is required');
			}

			if (!siteConfig.description) {
				return apiResponseLogger(400, 'Invalid form data, description is required');
			}

			if (!siteConfig.loginPageBackground) {
				return apiResponseLogger(400, 'Invalid form data, loginPageBackground is required');
			}

			if (siteConfig.loginPageBackground === 'custom' && !siteConfig.loginPageCustomImage) {
				return apiResponseLogger(400, 'Invalid form data, loginPageCustomImage is required');
			}

			yield* sdk.UPDATE.siteConfig(siteConfig);

			return apiResponseLogger(200, 'Site config updated');
		})
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
