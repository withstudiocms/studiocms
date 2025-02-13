import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import pluginList from 'studiocms:plugins';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../../utils/simpleResponse.js';

const { testingAndDemoMode } = developerConfig;

export const POST: APIRoute = async (context: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'admin');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
	}

	const { plugin } = context.params;

	const filteredPluginList = pluginList.filter((plugin) => !!plugin.settingsPage);

	const pluginData = filteredPluginList.find((pl) => pl.identifier === plugin);

	if (!pluginData) {
		return simpleResponse(404, 'Plugin not found');
	}

	const { settingsPage } = pluginData;

	if (!settingsPage) {
		return simpleResponse(404, 'Plugin does not have a settings page');
	}

	return settingsPage.onSave(context);
};
