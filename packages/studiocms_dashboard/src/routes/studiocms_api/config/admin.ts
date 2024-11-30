import { logger } from '@it-astro:logger:studiocms-dashboard';
import { db } from 'astro:db';
// import { authHelper } from 'studiocms:auth/helpers';
import Config from 'virtual:studiocms/config';
import { tsPermissions } from '@studiocms/core/db/tsTables';
import type { APIContext } from 'astro';
import { simpleResponse } from '../../../utils/simpleResponse';

import { getUserData } from 'studiocms:auth/lib/user';

const {
	dashboardConfig: {
		developerConfig: { testingAndDemoMode },
	},
} = Config;

export async function POST(context: APIContext): Promise<Response> {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		logger.warn('Testing and demo mode is enabled, this action is disabled.');
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Map Locals
	// const locals = context.locals;
	const userdata = await getUserData(context);

	// Check if user is logged in
	if (!userdata.isLoggedIn) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Check if user has permission
	if (userdata.isLoggedIn) {
		const { permissionLevel } = userdata;
		if (permissionLevel !== 'admin') {
			return simpleResponse(403, 'Unauthorized');
		}
	}

	// Get form data
	const formData = await context.request.formData();
	const newUser = formData.get('username')?.toString();
	const rank = formData.get('rank')?.toString();

	// Check if newUser and rank Exists
	if (!newUser || !rank) {
		logger.error('Invalid User or Rank');
		return simpleResponse(400, 'Invalid User or Rank');
	}

	// Check if User already exists
	const currentAdmins = await db.select().from(tsPermissions);
	for (const admin of currentAdmins) {
		if (admin.user === newUser) {
			logger.error('Admin already exists');
			return simpleResponse(400, 'Admin already exists');
		}
	}

	// Update Database
	try {
		await db.insert(tsPermissions).values({ user: newUser, rank: rank }).returning();
	} catch (error) {
		// Log error
		if (error instanceof Error) {
			logger.error(error.message);
		}
		// Return Error Response
		return simpleResponse(500, 'Error updating Admin list');
	}

	// Return Response
	logger.info('New Admin Added');
	return simpleResponse(200, 'New Admin Added');
}
