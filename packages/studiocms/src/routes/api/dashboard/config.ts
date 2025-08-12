import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { tsSiteConfigSelect } from 'studiocms:sdk/types';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/config.POST')(function* () {
			const sdk = yield* SDKCore;

			// Get user data
			const userData = ctx.locals.StudioCMS.security?.userSessionData;

			// Check if user is logged in
			if (!userData?.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isOwner;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Get Json Data
			const siteConfig: Omit<tsSiteConfigSelect, 'id'> = yield* Effect.tryPromise(() =>
				ctx.request.json()
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

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['POST'] });

export const ALL: APIRoute = async () => AllResponse();
