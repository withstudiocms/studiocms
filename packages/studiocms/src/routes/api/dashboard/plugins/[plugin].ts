import { apiResponseLogger } from 'studiocms:logger';
import pluginList from 'studiocms:plugins';
import { settingsEndpoints } from 'studiocms:plugins/endpoints';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	pipe,
} from '../../../../effect.js';

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/plugins/[plugin].POST')(function* () {
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

				const { plugin } = ctx.params;

				const settingsPage = yield* Effect.try({
					try: () =>
						pipe(
							pluginList.filter(({ settingsPage }) => !!settingsPage),
							(p) => p.find(({ identifier }) => identifier === plugin),
							(p) => {
								if (!p) {
									return apiResponseLogger(404, 'Plugin not found');
								}
								const settingsPage = settingsEndpoints.find(
									({ identifier }) => identifier === plugin
								);
								if (!settingsPage) {
									return apiResponseLogger(404, 'Plugin does not have a settings page');
								}
								return settingsPage;
							}
						),
					catch: (cause) =>
						new Error('An error occurred while fetching plugin settings page', { cause }),
				});

				if (settingsPage instanceof Response) {
					return settingsPage;
				}

				if (!settingsPage.onSave) {
					return apiResponseLogger(404, 'Plugin does not have a settings page');
				}

				return settingsPage.onSave(ctx);
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
