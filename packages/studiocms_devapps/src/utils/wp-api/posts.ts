import { db } from 'astro:db';
import { tsPageContent, tsPageData } from 'studiocms/sdk/tables';
import type { Page } from '../../schema/wp-api.js';
import { ConvertToPostContent, ConvertToPostData } from './converters.js';
import { apiEndpoint, fetchAll } from './utils.js';

/**
 * Generates post data and content from a post object.
 *
 * @param post - The post object to generate data and content from.
 * @param useBlogPkg - A boolean flag indicating whether to use the blog package for generating the post data.
 * @param endpoint - The API endpoint to be used for generating the post data.
 * @returns A promise that resolves with the generated post data and content.
 */
const generatePostFromData = async (post: unknown, useBlogPkg: boolean, endpoint: string) => {
	const pageData = await ConvertToPostData(post, useBlogPkg, endpoint);
	const pageContent = await ConvertToPostContent(pageData, post);

	return { pageData, pageContent };
};

/**
 * Imports a post from the WordPress API and inserts the post data and content into the database.
 *
 * @param post - The post data to be imported. The structure of this object is determined by the `generatePostFromData` function.
 * @param useBlogPkg - A boolean flag indicating whether to use the blog package for generating the post data.
 * @param endpoint - The API endpoint to be used for generating the post data.
 * @throws Will throw an error if inserting post data or content into the database fails.
 * @returns A promise that resolves when the post has been successfully imported.
 */
const importPost = async (post: unknown, useBlogPkg: boolean, endpoint: string) => {
	const { pageData, pageContent } = await generatePostFromData(post, useBlogPkg, endpoint);

	const pageDataResult = await db
		.insert(tsPageData)
		.values(pageData)
		.returning({ id: tsPageData.id, title: tsPageData.title })
		.get();

	if (pageDataResult === undefined) {
		throw new Error('Failed to insert post data');
	}

	const pageContentResult = await db
		.insert(tsPageContent)
		.values(pageContent)
		.returning({ id: tsPageContent.id })
		.get();

	if (pageContentResult === undefined) {
		throw new Error('Failed to insert post content');
	}

	console.log('- Imported new post from WP-API:', pageDataResult.title);
};

/**
 * Imports posts from a WordPress API endpoint.
 *
 * @param endpoint - The API endpoint to fetch posts from.
 * @param useBlogPkg - A boolean indicating whether to use the blog package.
 * @returns A promise that resolves when all posts have been imported.
 *
 * @throws Will throw an error if the import process fails.
 */
export const importPostsFromWPAPI = async (endpoint: string, useBlogPkg: boolean) => {
	const url = apiEndpoint(endpoint, 'posts');

	console.log('Fetching posts from: ', url.origin);

	const posts: Page[] = await fetchAll(url);

	console.log('Total posts: ', posts.length);

	try {
		for (const post of posts) {
			console.log('importing post: ', post.title.rendered);
			await importPost(post, useBlogPkg, endpoint);
		}
	} catch (error) {
		console.error('Failed to import posts from WP-API: ', error);
	}
};
