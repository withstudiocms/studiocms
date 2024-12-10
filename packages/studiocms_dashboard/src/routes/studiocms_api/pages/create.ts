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
		if (permissionLevel !== 'admin' && permissionLevel !== 'editor') {
			return simpleResponse(403, 'Unauthorized');
		}
	}

	// Get form data
	const formData = await context.request.formData();
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
	];

	for (const check of checkArray) {
		if (!check.value) {
			logger.error(`Invalid ${check.name}`);
			return simpleResponse(400, `Invalid ${check.name}`);
		}
	}

	if (!title || !slug || !description || !showOnNav || !heroImage || !content || !pack) {
		logger.error('Invalid data');
		return simpleResponse(400, 'Invalid data');
	}

	const existingCheck = await astroDb().pageData().getBySlug(slug, pack);

	if (existingCheck) {
		logger.error('Page already exists');
		return simpleResponse(400, 'Page already exists');
	}

	try {
		const newPage = await astroDb()
			.pageData()
			.insertPageData({
				title,
				slug,
				package: pack,
				description,
				heroImage,
				publishedAt: new Date(),
				contentLang: 'default',
				showOnNav: showOnNav === 'on',
			});

		if (!newPage) {
			logger.error('Error creating page');
			return simpleResponse(500, 'Error creating page');
		}

		await astroDb()
			.pageContent()
			.insert({ contentId: newPage.id, contentLang: 'default', content });
	} catch (error) {
		if (error instanceof Error) {
			logger.error(error.message);
		}
		return simpleResponse(500, 'Error creating page');
	}

	logger.info('Page created');
	return simpleResponse(200, 'Page created');
}
