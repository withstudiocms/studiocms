import { logger } from '@it-astro:logger:studiocms-dashboard';
import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext } from 'astro';
import { simpleResponse } from '../../../utils/simpleResponse';

import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';

const { testingAndDemoMode } = developerConfig;

export async function POST(context: APIContext): Promise<Response> {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		logger.warn('Testing and demo mode is enabled, this action is disabled.');
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

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

	// Get form data
	const formData = await context.request.formData();
	const newUser = formData.get('userid')?.toString();
	const rank = formData.get('rank')?.toString();

	// Check if newUser and rank Exists
	if (!newUser || !rank) {
		logger.error('Invalid User or Rank');
		return simpleResponse(400, 'Invalid User or Rank');
	}

	// Check userID
	const userExists = await studioCMS_SDK.GET.databaseEntry.users.byId(newUser);

	if (!userExists) {
		logger.error('User does not exist');
		return simpleResponse(400, 'User does not exist');
	}

	try {
		const userHasRank = await studioCMS_SDK.AUTH.permission.currentStatus(newUser);

		if (userHasRank) {
			await studioCMS_SDK.UPDATE.permissions({ user: userHasRank.user, rank: rank });
			logger.info('New Admin Added');
			return simpleResponse(200, 'New Admin Added');
		}

		await studioCMS_SDK.POST.databaseEntry.permissions(newUser, rank);
		logger.info('New Admin Added');
		return simpleResponse(200, 'New Admin Added');
	} catch (error) {
		if (error instanceof Error) {
			logger.error(error.message);
		}
		return simpleResponse(500, 'Error updating Admin list');
	}
}
