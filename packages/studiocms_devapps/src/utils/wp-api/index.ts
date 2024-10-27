import path from 'node:path';
/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import Config from 'virtual:studiocms-devapps/wp-api/configPath';
import { tsPageContent, tsPageData, tsSiteConfig } from '@studiocms/core/db/tsTables';
import type { Page, SiteSettings } from '../../schema/wp-api';
import {
	ConvertToPageContent,
	ConvertToPageData,
	ConvertToPostContent,
	ConvertToPostData,
} from './converters';
import { apiEndpoint, downloadPostImage, fetchAll } from './utils';

const ASTROPUBLICFOLDER = path.resolve(Config.projectRoot, 'public');

export type PageData = typeof tsPageData.$inferInsert;
export type PageContent = typeof tsPageContent.$inferInsert;

const generatePageFromData = async (page: unknown) => {
	const pageData = await ConvertToPageData(page);
	const pageContent = await ConvertToPageContent(pageData, page);

	return { pageData, pageContent };
};

const generatePostFromData = async (post: unknown, useBlogPkg: boolean, endpoint: string) => {
	const pageData = await ConvertToPostData(post, useBlogPkg, endpoint);
	const pageContent = await ConvertToPostContent(pageData, post);

	return { pageData, pageContent };
};

const importPage = async (page: unknown) => {
	const { pageData, pageContent } = await generatePageFromData(page);

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
			await importPage(page);
		}
	} catch (error) {
		console.error('Failed to import pages from WP-API:', error);
	}
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

export const importSettingsFromWPAPI = async (endpoint: string) => {
	const url = apiEndpoint(endpoint, 'settings');

	console.log('Fetching site settings from: ', url.origin);

	const response = await fetch(url);
	const settings: SiteSettings = await response.json();

	console.log('Importing site settings: ', settings);

	let siteIcon: string | undefined = undefined;

	if (settings.site_icon_url) {
		siteIcon = await downloadPostImage(settings.site_icon_url, ASTROPUBLICFOLDER);
	}

	if (!settings.site_icon_url && settings.site_logo) {
		const siteLogoURL = apiEndpoint(endpoint, 'media', `${settings.site_logo}`);
		const siteLogoResponse = await fetch(siteLogoURL);
		const siteLogoJson = await siteLogoResponse.json();
		siteIcon = await downloadPostImage(siteLogoJson.source_url, ASTROPUBLICFOLDER);
	}

	const siteConfig: typeof tsSiteConfig.$inferInsert = {
		id: 1,
		title: settings.name,
		description: settings.description,
	};

	if (siteIcon) {
		siteConfig.siteIcon = siteIcon;
	}

	try {
		const insert = await db
			.update(tsSiteConfig)
			.set(siteConfig)
			.where(eq(tsSiteConfig.id, 1))
			.returning({ id: tsSiteConfig.id })
			.get();

		if (insert) {
			console.log('Updated site settings');
		} else {
			console.error('Failed to update site settings');
		}
	} catch (error) {
		console.error('Failed to import site settings from WP-API: ', error);
	}
};
