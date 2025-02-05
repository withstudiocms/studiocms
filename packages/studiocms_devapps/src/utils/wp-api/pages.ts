import { db } from 'astro:db';
import { tsPageContent, tsPageData } from '@studiocms/core/sdk-utils/tables';
import type { Page } from '../../schema/wp-api.js';
import { ConvertToPageContent, ConvertToPageData } from './converters.js';
import { apiEndpoint, fetchAll } from './utils.js';

const generatePageFromData = async (page: unknown, endpoint: string) => {
	const pageData = await ConvertToPageData(page, endpoint);
	const pageContent = await ConvertToPageContent(pageData, page);

	return { pageData, pageContent };
};

const importPage = async (page: unknown, endpoint: string) => {
	const { pageData, pageContent } = await generatePageFromData(page, endpoint);

	const pageDataResult = await db
		.insert(tsPageData)
		.values(pageData)
		.returning({ id: tsPageData.id, title: tsPageData.title })
		.get();

	if (pageDataResult === undefined) {
		throw new Error('Failed to insert page data');
	}

	const pageContentResult = await db
		.insert(tsPageContent)
		.values(pageContent)
		.returning({ id: tsPageContent.id })
		.get();

	if (pageContentResult === undefined) {
		throw new Error('Failed to insert page content');
	}

	console.log('- Imported new page from WP-API: ', pageDataResult.title);
};

export const importPagesFromWPAPI = async (endpoint: string) => {
	const url = apiEndpoint(endpoint, 'pages');

	console.log('fetching pages from: ', url.origin);

	const pages: Page[] = await fetchAll(url);

	console.log('Total pages: ', pages.length);

	try {
		for (const page of pages) {
			console.log('importing page:', page.title.rendered);
			await importPage(page, endpoint);
		}
	} catch (error) {
		console.error('Failed to import pages from WP-API:', error);
	}
};
