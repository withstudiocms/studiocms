import { apiResponseLogger } from 'studiocms:logger';
import pluginList from 'studiocms:plugins';
import { settingsEndpoints } from 'studiocms:plugins/endpoints';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../../effect.js';

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
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

			const filteredPluginList = yield* Effect.try(() =>
				pluginList.filter((plugin) => !!plugin.settingsPage)
			);

			const pluginData = yield* Effect.try(() =>
				filteredPluginList.find((pl) => pl.identifier === plugin)
			);

			if (!pluginData) {
				return apiResponseLogger(404, 'Plugin not found');
			}

			const settingsPage = settingsEndpoints.find((endpoint) => endpoint.identifier === plugin);

			if (!settingsPage) {
				return apiResponseLogger(404, 'Plugin does not have a settings page');
			}

			if (!settingsPage.onSave) {
				return apiResponseLogger(404, 'Plugin does not have a settings page');
			}

			return settingsPage.onSave(ctx);
		})
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['POST'] });

export const ALL: APIRoute = async () => AllResponse();
