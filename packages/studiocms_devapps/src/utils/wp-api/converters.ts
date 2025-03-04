import path from 'node:path';
import { db, eq } from 'astro:db';
import { userProjectRoot } from 'virtual:studiocms-devapps/config';
import { decode } from 'html-entities';
import { tsPageDataCategories, tsPageDataTags } from 'studiocms/sdk/tables';
import TurndownService from 'turndown';
import type { Category, Page, Post, Tag } from '../../schema/wp-api.js';
import type { PageContent, PageData } from './index.js';
import {
	apiEndpoint,
	cleanUpHtml,
	downloadAndUpdateImages,
	downloadPostImage,
	stripHtml,
} from './utils.js';

const ASTROPUBLICFOLDER = path.resolve(userProjectRoot, 'public');
const WPImportFolder = path.resolve(ASTROPUBLICFOLDER, 'wp-import');
const pagesImagesFolder = path.resolve(WPImportFolder, 'pages');
const postsImagesFolder = path.resolve(WPImportFolder, 'posts');

/**
 * Converts a given page object to a PageData object.
 *
 * @param page - The page object to convert. This is expected to be of an unknown type.
 * @param endpoint - The API endpoint to fetch additional data, such as media.
 * @returns A promise that resolves to a PageData object containing the converted page data.
 *
 * @throws Will throw an error if fetching the title image fails.
 */
export const ConvertToPageData = async (page: unknown, endpoint: string): Promise<PageData> => {
	const data = page as Page;

	const titleImageId = data.featured_media;
	const titleImageURL = apiEndpoint(endpoint, 'media', `${titleImageId}`);
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

/**
 * Converts the provided page data and page content into a PageContent object.
 *
 * @param pageData - The data of the page to be converted.
 * @param page - The raw page content to be converted.
 * @returns A promise that resolves to a PageContent object.
 * @throws Will throw an error if the pageData is missing an id.
 */
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

/**
 * Generates and inserts categories into the database if they do not already exist.
 *
 * @param categories - An array of category IDs to be processed.
 * @param endpoint - The API endpoint to fetch category data from.
 * @returns A promise that resolves when the categories have been processed and inserted into the database.
 *
 * This function performs the following steps:
 * 1. Iterates over the provided category IDs.
 * 2. Checks if each category already exists in the database.
 * 3. If a category does not exist, fetches the category data from the specified API endpoint.
 * 4. Collects the new category data.
 * 5. Maps the new category data to the database schema.
 * 6. Inserts the new categories into the database.
 */
export const generateCategories = async (categories: number[], endpoint: string) => {
	const newCategories: Category[] = [];

	for (const categoryId of categories) {
		// Check if category already exists in the database
		const categoryExists = await db
			.select()
			.from(tsPageDataCategories)
			.where(eq(tsPageDataCategories.id, categoryId))
			.get();

		if (categoryExists) {
			console.log(`Category with id ${categoryId} already exists in the database`);
			continue;
		}

		const categoryURL = apiEndpoint(endpoint, 'categories', `${categoryId}`);
		const response = await fetch(categoryURL);
		const json = await response.json();
		newCategories.push(json);
	}

	if (newCategories.length > 0) {
		const categoryData = newCategories.map((category) => {
			const data: typeof tsPageDataCategories.$inferInsert = {
				id: category.id,
				name: category.name,
				slug: category.slug,
				description: category.description,
				meta: JSON.stringify(category.meta),
			};

			if (category.parent) {
				data.parent = category.parent;
			}

			return data;
		});

		for (const category of categoryData) {
			console.log(`Inserting category with id ${category.id} into the database`);
			await db.insert(tsPageDataCategories).values(category);
		}
	}
};

/**
 * Generates and inserts tags into the database if they do not already exist.
 *
 * @param {number[]} tags - An array of tag IDs to be processed.
 * @param {string} endpoint - The API endpoint to fetch tag data from.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 *
 * @example
 * const tags = [1, 2, 3];
 * const endpoint = 'https://example.com/wp-json/wp/v2';
 * await generateTags(tags, endpoint);
 *
 * @remarks
 * This function checks if each tag ID already exists in the database. If a tag does not exist,
 * it fetches the tag data from the specified API endpoint and inserts it into the database.
 * The function logs messages to the console for each tag that is processed.
 */
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
			continue;
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

/**
 * Converts a given post object to PageData format.
 *
 * @param post - The post object to be converted.
 * @param useBlogPkg - A boolean indicating whether to use the blog package.
 * @param endpoint - The API endpoint to fetch additional data.
 * @returns A promise that resolves to the converted PageData object.
 *
 * @throws Will throw an error if fetching the title image or downloading the post image fails.
 */
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

	const pkg = useBlogPkg ? '@studiocms/blog' : 'studiocms/markdown';

	await generateCategories(data.categories, endpoint);
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
		categories: JSON.stringify(data.categories),
		tags: JSON.stringify(data.tags),
	};

	if (titleImage) {
		pageData.heroImage = titleImage;
	}

	return pageData;
};

/**
 * Converts the given post data to a PageContent object.
 *
 * @param pageData - The data of the page to which the post content belongs.
 * @param post - The post data to be converted.
 * @returns A promise that resolves to a PageContent object.
 * @throws Will throw an error if the pageData is missing an id.
 */
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
