import { logger } from '@it-astro:logger:studiocms-dashboard';
// import { authHelper } from 'studiocms:auth/helpers';
import Config from 'studiocms:config';
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
		if (permissionLevel !== 'admin' && permissionLevel !== 'editor') {
			return simpleResponse(403, 'Unauthorized');
		}
	}

	// Get form data
	const formData = await context.request.formData();
	const pageId = formData.get('page-id')?.toString();
	const slug = formData.get('to-delete')?.toString();
	const pack = formData.get('package')?.toString();
	const slugConfirm = formData.get('slug')?.toString();

	// Check if slug and slugConfirm exists
	if (!slug || !slugConfirm) {
		logger.error('Invalid slug or slug Confirmation');
		return simpleResponse(400, 'Invalid slug or slug Confirmation');
	}

	// Check if slug and slugConfirm are the same
	if (slug !== slugConfirm) {
		logger.error('Slug and Slug Confirmation do not match');
		return simpleResponse(400, 'Slug and Slug Confirmation do not match');
	}

	// Check for Page ID
	if (!pageId) {
		logger.error('Invalid Page ID');
		return simpleResponse(400, 'Invalid Page ID');
	}

	if (pack === '@astrolicious/studiocms') {
		if (slug === 'index') {
			logger.error('Cannot delete Index Page');
			return simpleResponse(400, 'Cannot delete Index Page');
		}
		if (slug === 'about') {
			logger.error('Cannot delete About Page');
			return simpleResponse(400, 'Cannot delete About Page');
		}
	}

	// Update Database

	try {
		await astroDb().pageContent().delete(pageId);
		await astroDb().pageData().delete(pageId);
		return simpleResponse(200, 'Page Deleted');
	} catch (error) {
		// Log error
		if (error instanceof Error) {
			logger.error(error.message);
		}
		// Return Error Response
		return simpleResponse(500, 'Error deleting page');
	}
}
