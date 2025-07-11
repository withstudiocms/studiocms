import fs from 'node:fs';
import path from 'node:path';
import { eq } from 'astro:db';
import { SDKCore } from 'studiocms:sdk';
import type { SiteConfig } from 'studiocms:sdk/types';
import { userProjectRoot } from 'virtual:studiocms-devapps/config';
import { AstroError } from 'astro/errors';
import * as cheerio from 'cheerio';
import { decode } from 'html-entities';
import { Effect, genLogger } from 'studiocms/effect';
import {
	type tsPageContent,
	type tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
} from 'studiocms/sdk/tables';
import TurndownService from 'turndown';
import type { Category, Page, Post, SiteSettings, Tag } from '../schema/wp-api.js';

export type PageData = typeof tsPageData.$inferInsert;
export type PageContent = typeof tsPageContent.$inferInsert;

type APISupportedTypes = 'posts' | 'pages' | 'media' | 'categories' | 'tags' | 'settings';

type loadHTMLContent = Parameters<(typeof cheerio)['load']>[0];

/**
 * Images not downloaded during run
 */
const imagesNotDownloaded = [];

/**
 * User's Astro Public Folder
 */
const ASTRO_PUBLIC_FOLDER = path.resolve(userProjectRoot, 'public');

/**
 * Import directory for WP content
 */
const WPImportFolder = path.resolve(ASTRO_PUBLIC_FOLDER, 'wp-import');

/**
 * Import directory for WP pages
 */
const pagesImagesFolder = path.resolve(WPImportFolder, 'pages');

/**
 * Import directory for WP posts
 */
const postsImagesFolder = path.resolve(WPImportFolder, 'posts');

export class WordPressAPI extends Effect.Service<WordPressAPI>()('WordPressAPI', {
	dependencies: [SDKCore.Default],
	effect: genLogger('@studiocms/devapps/effects/WordPressAPI.effect')(function* () {
		const sdk = yield* SDKCore;

		//// UTILS

		const turndownService = new TurndownService({
			bulletListMarker: '-',
			codeBlockStyle: 'fenced',
			emDelimiter: '*',
		});

		const turndown = (html: string) => Effect.try(() => turndownService.turndown(html));

		/**
		 * Removes all HTML tags from a given string.
		 *
		 * @param string - The input string containing HTML tags.
		 * @returns The input string with all HTML tags removed.
		 */
		const stripHtml = (str: string) => Effect.try(() => {
			let sanitized = str;
			let previous: string;
			do {
				previous = sanitized;
				sanitized = sanitized.replace(/<[^>]*>/g, '');
			} while (sanitized !== previous);
			return sanitized;
		});

		/**
		 * Effectful version of 'cheerio.load()`
		 */
		const loadHTML = (
			content: loadHTMLContent,
			options?: cheerio.CheerioOptions | null,
			isDocument?: boolean
		) =>
			Effect.try({
				try: () => cheerio.load(content, options, isDocument),
				catch: (err) =>
					new AstroError('Error loading content', err instanceof Error ? err.message : `${err}`),
			});

		/**
		 * Cleans up the provided HTML string by removing certain attributes from images
		 * and modifying specific elements related to WordPress polls.
		 *
		 * @param html - The HTML string to be cleaned up.
		 * @returns The cleaned-up HTML string.
		 */
		const cleanUpHtml = (html: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.cleanUpHtml')(function* () {
				const data = yield* loadHTML(html);

				const images = data('img');
				for (const image of images) {
					data(image).removeAttr('class width height data-recalc-dims sizes srcset');
				}

				data('.wp-polls').html(
					'<em>Polls have been temporarily removed while we migrate to a new platform.</em>'
				);
				data('.wp-polls.loading').remove();

				return data.html();
			});

		/**
		 * Fetch all pages for a paginated WP endpoint.
		 */
		const fetchAll = (
			url: URL,
			page = 1,
			// biome-ignore lint/suspicious/noExplicitAny: This is a dynamic function that could return anything as an array
			results: any[] = []
			// biome-ignore lint/suspicious/noExplicitAny: This is a dynamic function that could return anything as an array
		): Effect.Effect<any[], AstroError, never> =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.fetchAll')(function* () {
				url.searchParams.set('per_page', '100');
				url.searchParams.set('page', String(page));

				// Fetch and return data and headers for usage later
				const res = yield* Effect.tryPromise({
					try: () => fetch(url),
					catch: (err) =>
						new AstroError(
							'Unknown Error while querying API',
							err instanceof Error ? err.message : `${err}`
						),
				});

				let data = yield* Effect.tryPromise({
					try: () => res.json(),
					catch: (err) =>
						new AstroError(
							'Unknown Error while reading API data',
							err instanceof Error ? err.message : `${err}`
						),
				});

				// Check for errors
				if (!Array.isArray(data)) {
					if (typeof data === 'object') {
						data = Object.entries(data).map(([id, val]) => {
							if (typeof val === 'object') return { id, ...val };
							return { id };
						});
					} else {
						return yield* Effect.fail(
							new AstroError(
								'Expected WordPress API to return an array of items.',
								`Received ${typeof data}:\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
							)
						);
					}
				}

				// Append the results
				results.push(...data);

				// Check for pagination
				const totalPages = Number.parseInt(res.headers.get('X-WP-TotalPages') || '1');
				console.log('Fetched page', page, 'of', totalPages);

				// If pagination, Recurse through the pages.
				if (page < totalPages) {
					console.log('Fetching next page...');
					return yield* fetchAll(url, page + 1, results);
				}

				// Return final results
				return results;
			});

		/**
		 * Constructs a WordPress API endpoint URL based on the provided parameters.
		 *
		 * @param endpoint - The base URL of the WordPress website.
		 * @param type - The type of resource to access. Can be 'posts', 'pages', 'media', 'categories', 'tags', or 'settings'.
		 * @param path - An optional path to append to the endpoint.
		 * @returns The constructed URL object pointing to the desired API endpoint.
		 * @throws {AstroError} If the `endpoint` argument is missing.
		 */
		const apiEndpoint = (
			endpoint: string,
			type: APISupportedTypes,
			path?: string
		): Effect.Effect<URL, AstroError, never> =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.apiEndpoint')(function* () {
				if (!endpoint) {
					return yield* Effect.fail(
						new AstroError(
							'Missing `endpoint` argument.',
							'Please pass a URL to your WordPress website as the `endpoint` option to the WordPress importer. Most commonly this looks something like `https://example.com/`'
						)
					);
				}

				let newEndpoint = endpoint;
				if (!newEndpoint.endsWith('/')) newEndpoint += '/';

				const apiBase = new URL(newEndpoint);

				if (type === 'settings') {
					apiBase.pathname = 'wp-json/';
					return apiBase;
				}

				apiBase.pathname = `wp-json/wp/v2/${type}/${path ? `${path}/` : ''}`;
				return apiBase;
			});

		/**
		 * Downloads an image from the specified URL and saves it to the given destination.
		 *
		 * @param {string | URL} imageUrl - The URL of the image to download.
		 * @param {string | URL} destination - The file path where the image should be saved.
		 */
		const downloadImage = (imageUrl: string | URL, destination: string | URL) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.downloadImage')(function* () {
				if (fs.existsSync(destination)) {
					console.error('File already exists:', destination);
					return true;
				}

				const response = yield* Effect.tryPromise(() => fetch(imageUrl));

				if (response.ok && response.body) {
					const reader = response.body.getReader();
					const chunks = [];
					let done = false;

					while (!done) {
						const { done: readerDone, value } = yield* Effect.tryPromise(() => reader.read());
						if (value) chunks.push(value);
						done = readerDone;
					}

					const fileBuffer = Buffer.concat(chunks);
					fs.writeFileSync(destination, fileBuffer, { flag: 'wx' });

					console.log('Downloaded image:', imageUrl);

					return true;
				}

				console.error('Failed to download image:', imageUrl);
				return false;
			});

		/**
		 * Downloads an image from the given source URL and saves it to the specified folder.
		 *
		 * @param src - The URL of the image to download.
		 * @param pathToFolder - The path to the folder where the image should be saved.
		 * @returns The file name of the downloaded image if successful, otherwise `undefined`.
		 *
		 * @remarks
		 * - If the `src` or `pathToFolder` parameters are not provided, the function will return immediately.
		 * - If the specified folder does not exist, it will be created recursively.
		 * - If the image already exists in the specified folder, the function will log a message and skip the download.
		 * - If the image download fails, the source URL will be added to the `imagesNotDownloaded` array.
		 */
		const downloadPostImage = (src: string, pathToFolder: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.downloadPostImage')(function* () {
				if (!src || !pathToFolder) return;

				if (!fs.existsSync(pathToFolder)) {
					fs.mkdirSync(pathToFolder, { recursive: true });
				}

				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				const fileName = path.basename(src).split('?')[0]!;
				const destinationFile = path.resolve(pathToFolder, fileName);

				if (fs.existsSync(destinationFile)) {
					console.log(`Post/Page image "${destinationFile}" already exists, skipping...`);
					return fileName;
				}

				const imageDownloaded = yield* downloadImage(src, destinationFile);

				if (!imageDownloaded) imagesNotDownloaded.push(src);

				return imageDownloaded ? fileName : undefined;
			});

		/**
		 * Downloads and updates the image sources in the provided HTML string.
		 *
		 * This function parses the given HTML string, finds all image elements,
		 * downloads the images to the specified folder, and updates the image
		 * sources to point to the downloaded images.
		 *
		 * @param html - The HTML string containing image elements to be processed.
		 * @param pathToFolder - The path to the folder where images should be downloaded.
		 * @returns A promise that resolves to the updated HTML string with new image sources.
		 */
		const downloadAndUpdateImages = (html: string, pathToFolder: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.downloadAndUpdateImages')(
				function* () {
					const data = yield* loadHTML(html);
					const images = data('img');

					for (const image of images) {
						const src = data(image).attr('src');
						if (src) {
							const newSrc = yield* downloadPostImage(src, pathToFolder);
							// biome-ignore lint/style/noNonNullAssertion: <explanation>
							data(image).attr('src', newSrc!);
						}
					}

					return data.html();
				}
			);

		//// Converters

		/**
		 * Converts a given page object to a PageData object.
		 *
		 * @param page - The page object to convert. This is expected to be of an unknown type.
		 * @param endpoint - The API endpoint to fetch additional data, such as media.
		 * @returns A promise that resolves to a PageData object containing the converted page data.
		 */
		const convertToPageData = (page: unknown, endpoint: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.convertToPageData')(function* () {
				const data = page as Page;

				const titleImageId = data.featured_media;
				const titleImageURL = yield* apiEndpoint(endpoint, 'media', String(titleImageId));
				const titleImageResponse = yield* Effect.tryPromise(() => fetch(titleImageURL));
				const titleImageJson = yield* Effect.tryPromise(() => titleImageResponse.json());
				const titleImage = yield* downloadPostImage(titleImageJson.source_url, pagesImagesFolder);

				const cleanHTML = yield* stripHtml(data.excerpt.rendered);

				const pageData: PageData = {
					// @ts-expect-error - Drizzle broke this
					id: crypto.randomUUID(),
					title: data.title.rendered,
					description: decode(cleanHTML),
					slug: data.slug,
					publishedAt: new Date(data.date_gmt),
					updatedAt: new Date(data.modified_gmt),
					showOnNav: false,
					contentLang: 'default',
					package: 'studiocms',
				};

				if (titleImage) {
					// @ts-expect-error - Drizzle broke this
					pageData.heroImage = titleImage;
				}

				return pageData;
			});

		/**
		 * Converts the provided page data and page content into a PageContent object.
		 *
		 * @param pageData - The data of the page to be converted.
		 * @param page - The raw page content to be converted.
		 * @returns A promise that resolves to a PageContent object.
		 */
		const convertToPageContent = (pageData: PageData, page: unknown) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.convertToPageContent')(
				function* () {
					const data = page as Page;

					// @ts-expect-error - Drizzle broke this
					if (pageData.id === undefined) {
						yield* Effect.fail(new Error('pageData is missing id'));
					}

					const cleanUpContent = yield* cleanUpHtml(data.content.rendered);
					const htmlWithImages = yield* downloadAndUpdateImages(cleanUpContent, pagesImagesFolder);

					const content = yield* turndown(htmlWithImages);

					const pageContent: PageContent = {
						// @ts-expect-error - Drizzle broke this
						id: crypto.randomUUID(),
						// @ts-expect-error - Drizzle broke this
						contentId: pageData.id,
						contentLang: 'default',
						content: content,
					};

					return pageContent;
				}
			);

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
		const generateCategories = (categories: number[], endpoint: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.generateCategories')(function* () {
				const newCategories: Category[] = [];

				for (const categoryId of categories) {
					const categoryExists = yield* sdk.dbService.execute((client) =>
						client
							.select()
							.from(tsPageDataCategories)
							.where(eq(tsPageDataCategories.id, categoryId))
							.get()
					);

					if (categoryExists) {
						console.log(
							`Category with id ${categoryId} already exists in the database. Skipping...`
						);
						continue;
					}

					const categoryURL = yield* apiEndpoint(endpoint, 'categories', String(categoryId));
					const response = yield* Effect.tryPromise(() => fetch(categoryURL));
					const jsonData = yield* Effect.tryPromise(() => response.json());

					newCategories.push(jsonData);
				}

				if (newCategories.length > 0) {
					const categoryData = newCategories.map((category) => {
						const data: typeof tsPageDataCategories.$inferInsert = {
							// @ts-expect-error - Drizzle broke this
							id: category.id,
							name: category.name,
							slug: category.slug,
							description: category.description,
							meta: JSON.stringify(category.meta),
						};

						if (category.parent) {
							// @ts-expect-error - Drizzle broke this
							data.parent = category.parent;
						}

						return data;
					});

					console.log(
						'Inserting new Categories into the database:',
						categoryData
							// @ts-expect-error - Drizzle broke this
							.map((data) => `${data.id}: ${data.name}`)
							.join(', ')
					);
					yield* sdk.dbService.execute((client) =>
						client.insert(tsPageDataCategories).values(categoryData)
					);

					console.log('Categories inserted!');
				}
			});

		/**
		 * Generates and inserts tags into the database if they do not already exist.
		 *
		 * @param {number[]} tags - An array of tag IDs to be processed.
		 * @param {string} endpoint - The API endpoint to fetch tag data from.
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
		const generateTags = (tags: number[], endpoint: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.generateCategories')(function* () {
				const newTags: Tag[] = [];

				for (const tagId of tags) {
					const categoryExists = yield* sdk.dbService.execute((client) =>
						client.select().from(tsPageDataTags).where(eq(tsPageDataTags.id, tagId)).get()
					);

					if (categoryExists) {
						console.log(`Tag with id ${tagId} already exists in the database. Skipping...`);
						continue;
					}

					const categoryURL = yield* apiEndpoint(endpoint, 'tags', String(tagId));
					const response = yield* Effect.tryPromise(() => fetch(categoryURL));
					const jsonData = yield* Effect.tryPromise(() => response.json());

					newTags.push(jsonData);
				}

				if (newTags.length > 0) {
					const tagData = newTags.map((tag) => {
						const data: typeof tsPageDataTags.$inferInsert = {
							// @ts-expect-error - Drizzle broke this
							id: tag.id,
							name: tag.name,
							slug: tag.slug,
							description: tag.description,
							meta: JSON.stringify(tag.meta),
						};

						return data;
					});

					console.log(
						'Inserting new Tags into the database:',
						tagData
							// @ts-expect-error - Drizzle broke this
							.map((data) => `${data.id}: ${data.name}`)
							.join(', ')
					);
					yield* sdk.dbService.execute((client) => client.insert(tsPageDataTags).values(tagData));

					console.log('Tags inserted!');
				}
			});

		/**
		 * Converts a given post object to PageData format.
		 *
		 * @param post - The post object to be converted.
		 * @param useBlogPkg - A boolean indicating whether to use the blog package.
		 * @param endpoint - The API endpoint to fetch additional data.
		 */
		const convertToPostData = (post: unknown, useBlogPkg: boolean, endpoint: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.convertToPostData')(function* () {
				const data = post as Post;

				const titleImageId = data.featured_media;
				const titleImageURL = yield* apiEndpoint(endpoint, 'media', String(titleImageId));
				const titleImageResponse = yield* Effect.tryPromise(() => fetch(titleImageURL));
				const titleImageJson = yield* Effect.tryPromise(() => titleImageResponse.json());
				const titleImage = yield* downloadPostImage(titleImageJson.source_url, pagesImagesFolder);

				const pkg = useBlogPkg ? '@studiocms/blog' : 'studiocms/markdown';

				yield* generateCategories(data.categories, endpoint);
				yield* generateTags(data.tags, endpoint);

				const cleanedHTML = yield* stripHtml(data.excerpt.rendered);

				const pageData: PageData = {
					// @ts-expect-error - Drizzle broke this
					id: crypto.randomUUID(),
					title: data.title.rendered,
					description: decode(cleanedHTML),
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
					// @ts-expect-error - Drizzle broke this
					pageData.heroImage = titleImage;
				}

				return pageData;
			});

		/**
		 * Converts the given post data to a PageContent object.
		 *
		 * @param pageData - The data of the page to which the post content belongs.
		 * @param post - The post data to be converted.
		 */
		const convertToPostContent = (pageData: PageData, post: unknown) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.convertToPostContent')(
				function* () {
					const data = post as Post;

					// @ts-expect-error - Drizzle broke this
					if (pageData.id === undefined) {
						yield* Effect.fail(new Error('pageData is missing id'));
					}

					const cleanupContent = yield* cleanUpHtml(data.content.rendered);
					const htmlWithImages = yield* downloadAndUpdateImages(cleanupContent, postsImagesFolder);

					const content = yield* turndown(htmlWithImages);

					const pageContent: PageContent = {
						// @ts-expect-error - Drizzle broke this
						id: crypto.randomUUID(),
						// @ts-expect-error - Drizzle broke this
						contentId: pageData.id,
						contentLang: 'default',
						content: content,
					};

					return pageContent;
				}
			);

		//// Main

		/**
		 * Imports site settings from a WordPress API endpoint and updates the local database.
		 *
		 * @param endpoint - The WordPress API endpoint to fetch settings from.
		 *
		 * This function performs the following steps:
		 * 1. Constructs the URL for the settings endpoint.
		 * 2. Fetches the site settings from the constructed URL.
		 * 3. Logs the fetched settings.
		 * 4. Downloads the site icon if available.
		 * 5. If the site icon is not available, attempts to download the site logo.
		 * 6. Constructs the site configuration object.
		 * 7. Updates the local database with the fetched settings.
		 * 8. Logs the success or failure of the database update.
		 */
		const importSettingsFromWPAPI = (endpoint: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.importSettingsFromWPAPI')(
				function* () {
					const url = yield* apiEndpoint(endpoint, 'settings');

					console.log('Fetching site settings from: ', url.origin);

					const response = yield* Effect.tryPromise(() => fetch(url));
					const settings: SiteSettings = yield* Effect.tryPromise(() => response.json());

					console.log('Importing site settings: ', settings);

					let siteIcon: string | undefined = undefined;

					if (settings.site_icon_url) {
						siteIcon = yield* downloadPostImage(settings.site_icon_url, ASTRO_PUBLIC_FOLDER);
					}

					if (!settings.site_icon_url && settings.site_logo) {
						const siteLogoUrl = yield* apiEndpoint(endpoint, 'media', String(settings.site_logo));
						const siteLogoResponse = yield* Effect.tryPromise(() => fetch(siteLogoUrl));
						const siteLogoData = yield* Effect.tryPromise(() => siteLogoResponse.json());

						siteIcon = yield* downloadPostImage(siteLogoData.source_url, ASTRO_PUBLIC_FOLDER);
					}

					const siteConfig: Partial<SiteConfig> = {
						title: settings.name,
						description: settings.description,
					};

					if (siteIcon) {
						siteConfig.siteIcon = siteIcon;
					}

					// @ts-expect-error - Drizzle broken types
					const insert = yield* sdk.UPDATE.siteConfig(siteConfig);

					if (insert.lastCacheUpdate) {
						console.log('Updated site settings');
					} else {
						console.error('Failed to update site settings');
					}
				}
			);

		/**
		 * Imports pages from a WordPress API endpoint.
		 *
		 * This function fetches all pages from the specified WordPress API endpoint
		 * and imports each page individually.
		 *
		 * @param endpoint - The WordPress API endpoint to fetch pages from.
		 */
		const importPagesFromWPAPI = (endpoint: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.importPagesFromWPAPI')(
				function* () {
					const url = yield* apiEndpoint(endpoint, 'pages');

					console.log('fetching pages from: ', url.origin);

					const pages: Page[] = yield* fetchAll(url);

					console.log('Total pages: ', pages.length);

					for (const page of pages) {
						console.log('importing page:', page.title.rendered);

						const pageData = yield* convertToPageData(page, endpoint);
						const pageContent = yield* convertToPageContent(pageData, page);

						// @ts-expect-error - Drizzle broken types
						yield* sdk.POST.databaseEntry.pages(pageData, pageContent);

						console.log('- Imported new page from WP-API: ', page.title.rendered);
					}
				}
			);

		/**
		 * Imports a post from the WordPress API and inserts the post data and content into the database.
		 *
		 * @param post - The post data to be imported. The structure of this object is determined by the `generatePostFromData` function.
		 * @param useBlogPkg - A boolean flag indicating whether to use the blog package for generating the post data.
		 * @param endpoint - The API endpoint to be used for generating the post data.
		 */
		const importPostsFromWPAPI = (endpoint: string, useBlogPkg: boolean) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.importPagesFromWPAPI')(
				function* () {
					const url = yield* apiEndpoint(endpoint, 'posts');

					console.log('fetching posts from: ', url.origin);

					const pages: Page[] = yield* fetchAll(url);

					console.log('Total posts: ', pages.length);

					for (const page of pages) {
						console.log('importing post:', page.title.rendered);

						const pageData = yield* convertToPostData(page, useBlogPkg, endpoint);
						const pageContent = yield* convertToPostContent(pageData, page);

						// @ts-expect-error - Drizzle broken types
						yield* sdk.POST.databaseEntry.pages(pageData, pageContent);

						console.log('- Imported new post from WP-API: ', page.title.rendered);
					}
				}
			);

		return {
			importSettingsFromWPAPI,
			importPagesFromWPAPI,
			importPostsFromWPAPI
		};
	}),
}) {
	static Provide = Effect.provide(this.Default);
}
