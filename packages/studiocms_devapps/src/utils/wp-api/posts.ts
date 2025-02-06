import { db } from 'astro:db';
import { tsPageContent, tsPageData } from '@studiocms/core/sdk-utils/tables';
import type { Page } from '../../schema/wp-api.js';
import { ConvertToPostContent, ConvertToPostData } from './converters.js';
import { apiEndpoint, fetchAll } from './utils.js';

const generatePostFromData = async (post: unknown, useBlogPkg: boolean, endpoint: string) => {
	const pageData = await ConvertToPostData(post, useBlogPkg, endpoint);
	const pageContent = await ConvertToPostContent(pageData, post);

	return { pageData, pageContent };
};

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
