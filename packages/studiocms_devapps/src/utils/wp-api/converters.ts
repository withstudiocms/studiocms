import path from 'node:path';
import { db, eq } from 'astro:db';
import Config from 'virtual:studiocms-devapps/wp-api/configPath';
import { tsPageDataCategories, tsPageDataTags } from '@studiocms/core/db/tsTables';
import { decode } from 'html-entities';
import TurndownService from 'turndown';
import type { Category, Page, Post, Tag } from '../../schema/wp-api';
import type { PageContent, PageData } from './index';
import {
	apiEndpoint,
	cleanUpHtml,
	downloadAndUpdateImages,
	downloadPostImage,
	stripHtml,
} from './utils';

const ASTROPUBLICFOLDER = path.resolve(Config.projectRoot, 'public');
const WPImportFolder = path.resolve(ASTROPUBLICFOLDER, 'wp-import');
const pagesImagesFolder = path.resolve(WPImportFolder, 'pages');
const postsImagesFolder = path.resolve(WPImportFolder, 'posts');

export const ConvertToPageData = async (page: unknown): Promise<PageData> => {
	const data = page as Page;

	const titleImageId = data.featured_media;
	const titleImageURL = apiEndpoint(`${titleImageId}`, 'media');
	const titleImageResponse = await fetch(titleImageURL);
	const titleImageJson = await titleImageResponse.json();
	const titleImage = await downloadPostImage(titleImageJson.source_url, pagesImagesFolder);

	const pageData: PageData = {
		id: crypto.randomUUID(),
		title: data.title.rendered,
		description: decode(stripHtml(data.excerpt.rendered)),
		slug: data.slug,
		publishedAt: new Date(data.date_gmt),
		updatedAt: new Date(data.modified_gmt),
		showOnNav: false,
		contentLang: 'default',
		package: 'studiocms',
	};

	if (titleImage) {
		pageData.heroImage = titleImage;
	}

	return pageData;
};

export const ConvertToPageContent = async (
	pageData: PageData,
	page: unknown
): Promise<PageContent> => {
	const data = page as Page;

	if (pageData.id === undefined) {
		throw new Error('pageData is missing id');
	}

	const cleanupContent = cleanUpHtml(data.content.rendered);
	const htmlWithImages = await downloadAndUpdateImages(cleanupContent, pagesImagesFolder);

	const turndownService = new TurndownService({
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
		emDelimiter: '*',
	});

	const content = turndownService.turndown(htmlWithImages);

	const pageContent: PageContent = {
		id: crypto.randomUUID(),
		contentId: pageData.id,
		contentLang: 'default',
		content: content,
	};

	return pageContent;
};

export const generateCatagories = async (categories: number[], endpoint: string) => {
	const newCatagories: Category[] = [];

	for (const catagoryId of categories) {
		// Check if catagory already exists in the database
		const catagoryExists = await db
			.select()
			.from(tsPageDataCategories)
			.where(eq(tsPageDataCategories.id, catagoryId))
			.get();

		if (catagoryExists) {
			console.log(`Catagory with id ${catagoryId} already exists in the database`);
		}

		const catagoryURL = apiEndpoint(endpoint, 'catagories', `${catagoryId}`);
		const response = await fetch(catagoryURL);
		const json = await response.json();
		newCatagories.push(json);
	}

	if (newCatagories.length > 0) {
		const catagoryData = newCatagories.map((catagory) => {
			const data: typeof tsPageDataCategories.$inferInsert = {
				id: catagory.id,
				name: catagory.name,
				slug: catagory.slug,
				description: catagory.description,
				meta: JSON.stringify(catagory.meta),
			};

			if (catagory.parent) {
				data.parent = catagory.parent;
			}

			return data;
		});

		for (const catagory of catagoryData) {
			console.log(`Inserting catagory with id ${catagory.id} into the database`);
			await db.insert(tsPageDataCategories).values(catagory);
		}
	}
};

export const generateTags = async (tags: number[], endpoint: string) => {
	const newTags: Tag[] = [];

	for (const tagId of tags) {
		// Check if tag already exists in the database
		const tagExists = await db
			.select()
			.from(tsPageDataTags)
			.where(eq(tsPageDataTags.id, tagId))
			.get();

		if (tagExists) {
			console.log(`Tag with id ${tagId} already exists in the database`);
		}

		const tagURL = apiEndpoint(endpoint, 'tags', `${tagId}`);
		const response = await fetch(tagURL);
		const json = await response.json();
		newTags.push(json);
	}

	if (newTags.length > 0) {
		const tagData = newTags.map((tag) => {
			const data: typeof tsPageDataTags.$inferInsert = {
				id: tag.id,
				name: tag.name,
				slug: tag.slug,
				description: tag.description,
				meta: JSON.stringify(tag.meta),
			};

			return data;
		});

		for (const tag of tagData) {
			console.log(`Inserting tag with id ${tag.id} into the database`);
			await db.insert(tsPageDataTags).values(tag);
		}
	}
};

export const ConvertToPostData = async (
	post: unknown,
	useBlogPkg: boolean,
	endpoint: string
): Promise<PageData> => {
	const data = post as Post;

	const titleImageId = data.featured_media;
	const titleImageURL = apiEndpoint(endpoint, 'media', `${titleImageId}`);
	const titleImageResponse = await fetch(titleImageURL);
	const titleImageJson = await titleImageResponse.json();
	const titleImage = await downloadPostImage(titleImageJson.source_url, pagesImagesFolder);

	const pkg = useBlogPkg ? '@studiocms/blog' : 'studiocms';

	await generateCatagories(data.categories, endpoint);
	await generateTags(data.tags, endpoint);

	const pageData: PageData = {
		id: crypto.randomUUID(),
		title: data.title.rendered,
		description: decode(stripHtml(data.excerpt.rendered)),
		slug: data.slug,
		publishedAt: new Date(data.date_gmt),
		updatedAt: new Date(data.modified_gmt),
		showOnNav: false,
		contentLang: 'default',
		package: pkg,
		catagories: JSON.stringify(data.categories),
		tags: JSON.stringify(data.tags),
	};

	if (titleImage) {
		pageData.heroImage = titleImage;
	}

	return pageData;
};

export const ConvertToPostContent = async (
	pageData: PageData,
	post: unknown
): Promise<PageContent> => {
	const data = post as Post;

	if (pageData.id === undefined) {
		throw new Error('pageData is missing id');
	}

	const cleanupContent = cleanUpHtml(data.content.rendered);
	const htmlWithImages = await downloadAndUpdateImages(cleanupContent, postsImagesFolder);

	const turndownService = new TurndownService({
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
		emDelimiter: '*',
	});

	const content = turndownService.turndown(htmlWithImages);

	const pageContent: PageContent = {
		id: crypto.randomUUID(),
		contentId: pageData.id,
		contentLang: 'default',
		content: content,
	};

	return pageContent;
};
