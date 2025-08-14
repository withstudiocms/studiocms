import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';

export const { POST, DELETE, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/api-tokens.POST')(function* () {
				const sdk = yield* SDKCore;

				// Check if demo mode is enabled
				if (developerConfig.demoMode !== false) {
					return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
				}

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isEditor;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Get Json Data
				const jsonData = yield* readAPIContextJson<{
					description: string;
					user: string;
				}>(ctx);

				// Validate form data
				if (!jsonData.description) {
					return apiResponseLogger(400, 'Invalid form data, description is required');
				}

				if (!jsonData.user) {
					return apiResponseLogger(400, 'Invalid form data, user is required');
				}

				const newToken = yield* sdk.REST_API.tokens.new(jsonData.user, jsonData.description);

				return createJsonResponse({ token: newToken.key });
			}),
		DELETE: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/api-tokens.DELETE')(function* () {
				const sdk = yield* SDKCore;

				// Check if demo mode is enabled
				if (developerConfig.demoMode !== false) {
					return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
				}

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isEditor;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Get Json Data
				const jsonData = yield* readAPIContextJson<{
					tokenID: string;
					userID: string;
				}>(ctx);

				// Validate form data
				if (!jsonData.tokenID) {
					return apiResponseLogger(400, 'Invalid form data, tokenID is required');
				}

				if (!jsonData.userID) {
					return apiResponseLogger(400, 'Invalid form data, userID is required');
				}

				yield* sdk.REST_API.tokens.delete(jsonData.userID, jsonData.tokenID);

				return apiResponseLogger(200, 'Token deleted');
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST', 'DELETE'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'DELETE', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
