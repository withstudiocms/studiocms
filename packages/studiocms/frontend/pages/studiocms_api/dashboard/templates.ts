import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import templateEngine from 'studiocms:template-engine';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '@withstudiocms/effect';

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/templates.POST')(function* () {
				const [sdk, { templates }, engine] = yield* Effect.all([
					SDKCore,
					readAPIContextJson<{ templates: Record<string, string> }>(ctx),
					templateEngine,
				]);

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
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const keys = engine.availableTemplates;
				type Keys = (typeof keys)[number];
				const updates: Partial<Record<Keys, string>> = {};
				for (const key of keys) {
					if (key in templates) {
						updates[key] = templates[key];
					}
				}

				if (Object.keys(updates).length === 0) {
					return apiResponseLogger(400, 'No valid templates provided for update.');
				}

				const updatedConfig = yield* sdk.CONFIG.templateConfig.update(updates);
				if (!updatedConfig) {
					return apiResponseLogger(500, 'Failed to update templates.');
				}

				return apiResponseLogger(200, 'Templates updated successfully.');
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
