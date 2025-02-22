import { db } from 'astro:db';
import { tsPageContent, tsPageData } from 'studiocms/sdk/tables';
import type { Page } from '../../schema/wp-api.js';
import { ConvertToPageContent, ConvertToPageData } from './converters.js';
import { apiEndpoint, fetchAll } from './utils.js';

/**
 * Generates page data and content from the given page and endpoint.
 *
 * @param {unknown} page - The page data to be converted.
 * @param {string} endpoint - The API endpoint to fetch additional data.
 * @returns {Promise<{ pageData: any, pageContent: any }>} An object containing the converted page data and content.
 */
const generatePageFromData = async (page: unknown, endpoint: string) => {
	const pageData = await ConvertToPageData(page, endpoint);
	const pageContent = await ConvertToPageContent(pageData, page);

	return { pageData, pageContent };
};

/**
 * Imports a page from the given endpoint and inserts the page data and content into the database.
 *
 * @param page - The page data to be imported. The structure of this object is unknown.
 * @param endpoint - The API endpoint from which the page data is fetched.
 * @throws Will throw an error if inserting page data or page content into the database fails.
 * @returns {Promise<void>} - A promise that resolves when the page has been successfully imported.
 */
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

/**
 * Imports pages from a WordPress API endpoint.
 *
 * This function fetches all pages from the specified WordPress API endpoint
 * and imports each page individually.
 *
 * @param endpoint - The WordPress API endpoint to fetch pages from.
 *
 * @returns A promise that resolves when all pages have been imported.
 *
 * @throws Will throw an error if the pages cannot be imported.
 */
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
