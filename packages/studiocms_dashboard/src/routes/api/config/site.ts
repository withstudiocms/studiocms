import { logger } from '@it-astro:logger:studiocms-dashboard';
// import { authHelper } from 'studiocms:auth/helpers';
import Config from 'virtual:studiocms/config';
import type { APIContext } from 'astro';
import { astroDb } from '../../../utils/astroDb';
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
	const title = formData.get('title')?.toString();
	const description = formData.get('description')?.toString();

	// Check if title and description exists
	if (!title || !description) {
		logger.error('Invalid title or description');
		return simpleResponse(400, 'Invalid title or description');
	}

	// Update Database
	try {
		await astroDb().siteConfig().update({ title, description });
	} catch (error) {
		// Log error
		if (error instanceof Error) {
			logger.error(error.message);
		}
		// Return Error Response
		return simpleResponse(500, 'Error updating site config');
	}

	// Return Response
	logger.info('Site config updated');
	return simpleResponse(200, 'Site config updated');
}
