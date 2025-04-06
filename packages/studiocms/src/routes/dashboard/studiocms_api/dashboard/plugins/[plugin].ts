import { apiResponseLogger } from 'studiocms:logger';
import pluginList from 'studiocms:plugins';
import { settingsEndpoints } from 'studiocms:plugins/endpoints';
import type { APIContext, APIRoute } from 'astro';

export const POST: APIRoute = async (context: APIContext) => {
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

	const filteredPluginList = pluginList.filter((plugin) => !!plugin.settingsPage);

	const pluginData = filteredPluginList.find((pl) => pl.identifier === plugin);

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

	if (!settingsPage.onSave) {
		return apiResponseLogger(404, 'Plugin does not have a settings page');
	}

	return settingsPage.onSave(context);
};
