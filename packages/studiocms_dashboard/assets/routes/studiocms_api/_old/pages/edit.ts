import { logger } from '@it-astro:logger:studiocms-dashboard';
// import { authHelper } from 'studiocms:auth/helpers';
import Config from 'studiocms:config';
import type { APIContext } from 'astro';
import { simpleResponse } from '../../../../utils/simpleResponse';
import { astroDb } from '../../../utils/astroDb';

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
	const title = formData.get('title')?.toString();
	const slug = formData.get('slug')?.toString();
	const description = formData.get('description')?.toString();
	const showOnNav = formData.get('show-on-nav')?.toString();
	const heroImage = formData.get('hero-image')?.toString();
	const content = formData.get('content')?.toString();
	const pack = formData.get('package')?.toString();

	// TODO: Implement this for i18n support
	// const contentLang = formData.get("content-lang")?.toString();

	const checkArray: { name: string; value: string | undefined }[] = [
		{ name: 'title', value: title },
		{ name: 'slug', value: slug },
		{ name: 'description', value: description },
		{ name: 'showOnNav', value: showOnNav },
		{ name: 'heroImage', value: heroImage },
		{ name: 'content', value: content },
		{ name: 'pack', value: pack },
		{ name: 'pageId', value: pageId },
	];

	for (const check of checkArray) {
		if (!check.value) {
			logger.error(`Invalid ${check.name}`);
			return simpleResponse(400, `Invalid ${check.name}`);
		}
	}

	if (!title || !slug || !description || !showOnNav || !heroImage || !content || !pack || !pageId) {
		logger.error('Invalid data');
		return simpleResponse(400, 'Invalid data');
	}

	return await astroDb()
		.pageData()
		.update({
			id: pageId,
			title,
			slug,
			description,
			showOnNav: showOnNav === 'on',
			heroImage,
			package: pack,
			updatedAt: new Date(),
		})
		.then(async () => {
			await astroDb().pageContent().update({
				id: pageId,
				content,
			});
			return simpleResponse(200, 'Page and Page Content updated');
		})
		.catch((error) => {
			logger.error(error);
			return simpleResponse(500, 'Error updating page');
		});
}
