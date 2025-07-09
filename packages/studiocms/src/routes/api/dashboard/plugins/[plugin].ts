import { apiResponseLogger } from 'studiocms:logger';
import pluginList from 'studiocms:plugins';
import { settingsEndpoints } from 'studiocms:plugins/endpoints';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/plugins/[plugin].POST')(function* () {
			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isAdmin;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const { plugin } = context.params;

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

			return settingsPage.onSave(context);
		})
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
