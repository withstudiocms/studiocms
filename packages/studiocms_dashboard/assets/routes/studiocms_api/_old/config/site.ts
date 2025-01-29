import { logger } from '@it-astro:logger:studiocms-dashboard';
import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import { CMSSiteConfigId } from '@studiocms/core/consts';
import type { APIContext } from 'astro';
import { simpleResponse } from '../../../../utils/simpleResponse';

const { testingAndDemoMode } = developerConfig;

export async function POST(context: APIContext): Promise<Response> {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		logger.warn('Testing and demo mode is enabled, this action is disabled.');
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Map Locals
	// const locals = context.locals;
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'owner');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Get form data
	const formData = await context.request.formData();
	const title = formData.get('title')?.toString();
	const description = formData.get('description')?.toString();
	const defaultOgImage = formData.get('defaultOgImage')?.toString();
	const loginPageBackground = formData.get('loginPageBackground')?.toString();
	const loginPageCustomImage = formData.get('loginPageCustomImage')?.toString();
	const siteIcon = formData.get('siteIcon')?.toString();

	// Check if title and description exists
	if (
		!title ||
		!description ||
		!defaultOgImage ||
		!loginPageBackground ||
		!loginPageCustomImage ||
		!siteIcon
	) {
		logger.error('Invalid form data');
		return simpleResponse(400, 'Invalid form data');
	}

	// Update Database
	try {
		await studioCMS_SDK.UPDATE.siteConfig({
			title,
			description,
			id: CMSSiteConfigId,
			defaultOgImage,
			loginPageBackground,
			loginPageCustomImage,
			siteIcon,
		});

		logger.info('Site config updated');
		return simpleResponse(200, 'Site config updated');
	} catch (error) {
		// Log error
		if (error instanceof Error) {
			logger.error(error.message);
		}
		// Return Error Response
		return simpleResponse(500, 'Error updating site config');
	}
}
