import path from 'node:path';
import { eq } from 'astro:db';
import { SDKCore } from 'studiocms:sdk';
import { userProjectRoot } from 'virtual:studiocms-devapps/config';
import { Console, Effect, genLogger } from 'studiocms/effect';
import { decode } from 'studiocms/runtime';
import { tsPageDataCategories, tsPageDataTags } from 'studiocms/sdk/tables';
import type { Category, Page, Post, Tag } from '../../schema/wp-api.js';
import {
	APIEndpointConfig,
	CategoryOrTagConfig,
	DownloadPostImageConfig,
	FullPageData,
	ImportEndpointConfig,
	RawPageData,
	StringConfig,
	useBlogPkgConf,
} from './configs.js';
import type { PageContent, PageData } from './importers.js';
import { WordPressAPIUtils } from './utils.js';

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

export class WordPressAPIConverters extends Effect.Service<WordPressAPIConverters>()(
	'WordPressAPIConverters',
	{
		dependencies: [SDKCore.Default, WordPressAPIUtils.Default],
		effect: genLogger('@studiocms/devapps/effects/WordPressAPI/converters.effect')(function* () {
			const sdk = yield* SDKCore;

			const {
				apiEndpoint,
				cleanUpHtml,
				downloadAndUpdateImages,
				downloadPostImage,
				stripHtml,
				turndown,
			} = yield* WordPressAPIUtils;

			/**
			 * Converts a given page object to a PageData object.
			 *
			 * @param page - The page object to convert. This is expected to be of an unknown type.
			 * @param endpoint - The API endpoint to fetch additional data, such as media.
			 * @returns A promise that resolves to a PageData object containing the converted page data.
			 */
			const convertToPageData = genLogger(
				'@studiocms/devapps/effects/WordPressAPI/converters.effect.convertToPageData'
			)(function* () {
				const [endpointConfigHandler, pageConfigHandler] = yield* Effect.all([
					ImportEndpointConfig,
					RawPageData,
				]);

				const [endpoint, page] = yield* Effect.all([
					endpointConfigHandler.endpoint,
					pageConfigHandler.page,
				]);

				const data = page as Page;

				const cleanHTML = yield* stripHtml.pipe(StringConfig.makeProvide(data.excerpt.rendered));

				const titleImageId = data.featured_media;

				if (!titleImageId || titleImageId === 0) {
					yield* Console.log('No featured media for:', data.title.rendered);

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
					return pageData;
				}

				const titleImageURL = yield* apiEndpoint.pipe(
					APIEndpointConfig.makeProvide(endpoint, 'media', String(titleImageId))
				);
				const titleImageResponse = yield* Effect.tryPromise(() => fetch(titleImageURL));
				const titleImageJson = yield* Effect.tryPromise(() => titleImageResponse.json());
				const titleImage = yield* downloadPostImage.pipe(
					DownloadPostImageConfig.makeProvide(titleImageJson.source_url, pagesImagesFolder)
				);

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
					heroImage: titleImage,
				};

				return pageData;
			});

			/**
			 * Converts the provided page data and page content into a PageContent object.
			 *
			 * @param pageData - The data of the page to be converted.
			 * @param page - The raw page content to be converted.
			 * @returns A promise that resolves to a PageContent object.
			 */
			const convertToPageContent = genLogger(
				'@studiocms/devapps/effects/WordPressAPI/converters.effect.convertToPageContent'
			)(function* () {
				const [pageConfigHandler, pageDataConfigHandler] = yield* Effect.all([
					RawPageData,
					FullPageData,
				]);

				const [page, pageData] = yield* Effect.all([
					pageConfigHandler.page,
					pageDataConfigHandler.pageData,
				]);

				const data = page as Page;

				// @ts-expect-error - Drizzle broke this
				if (pageData.id === undefined) {
					yield* Effect.fail(new Error('pageData is missing id'));
				}

				const cleanUpContent = yield* cleanUpHtml.pipe(
					StringConfig.makeProvide(data.content.rendered)
				);
				const htmlWithImages = yield* downloadAndUpdateImages.pipe(
					DownloadPostImageConfig.makeProvide(cleanUpContent, pagesImagesFolder)
				);

				const content = yield* turndown.pipe(StringConfig.makeProvide(htmlWithImages));

				const pageContent: PageContent = {
					// @ts-expect-error - Drizzle broke this
					id: crypto.randomUUID(),
					// @ts-expect-error - Drizzle broke this
					contentId: pageData.id,
					contentLang: 'default',
					content: content,
				};

				return pageContent;
			});

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
			const generateCategories = genLogger(
				'@studiocms/devapps/effects/WordPressAPI/converters.effect.generateCategories'
			)(function* () {
				const [endpointConfigHandler, categoriesTagConfig] = yield* Effect.all([
					ImportEndpointConfig,
					CategoryOrTagConfig,
				]);

				const [endpoint, categories] = yield* Effect.all([
					endpointConfigHandler.endpoint,
					categoriesTagConfig.value,
				]);

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
						yield* Console.log(
							`Category with id ${categoryId} already exists in the database. Skipping...`
						);
						continue;
					}

					const categoryURL = yield* apiEndpoint.pipe(
						APIEndpointConfig.makeProvide(endpoint, 'categories', String(categoryId))
					);
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

					yield* Console.log(
						'Inserting new Categories into the database:',
						categoryData
							// @ts-expect-error - Drizzle broke this
							.map((data) => `${data.id}: ${data.name}`)
							.join(', ')
					);
					yield* sdk.dbService.execute((client) =>
						client.insert(tsPageDataCategories).values(categoryData)
					);

					yield* Console.log('Categories inserted!');
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
			const generateTags = genLogger(
				'@studiocms/devapps/effects/WordPressAPI/converters.effect.generateTags'
			)(function* () {
				const [endpointConfigHandler, categoriesTagConfig] = yield* Effect.all([
					ImportEndpointConfig,
					CategoryOrTagConfig,
				]);

				const [endpoint, tags] = yield* Effect.all([
					endpointConfigHandler.endpoint,
					categoriesTagConfig.value,
				]);

				const newTags: Tag[] = [];

				for (const tagId of tags) {
					const tagExists = yield* sdk.dbService.execute((client) =>
						client.select().from(tsPageDataTags).where(eq(tsPageDataTags.id, tagId)).get()
					);

					if (tagExists) {
						yield* Console.log(`Tag with id ${tagId} already exists in the database. Skipping...`);
						continue;
					}

					const tagURL = yield* apiEndpoint.pipe(
						APIEndpointConfig.makeProvide(endpoint, 'tags', String(tagId))
					);
					const response = yield* Effect.tryPromise(() => fetch(tagURL));
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

					yield* Console.log(
						'Inserting new Tags into the database:',
						tagData
							// @ts-expect-error - Drizzle broke this
							.map((data) => `${data.id}: ${data.name}`)
							.join(', ')
					);
					yield* sdk.dbService.execute((client) => client.insert(tsPageDataTags).values(tagData));

					yield* Console.log('Tags inserted!');
				}
			});

			/**
			 * Converts a given post object to PageData format.
			 *
			 * @param post - The post object to be converted.
			 * @param useBlogPkg - A boolean indicating whether to use the blog package.
			 * @param endpoint - The API endpoint to fetch additional data.
			 */
			const convertToPostData = genLogger(
				'@studiocms/devapps/effects/WordPressAPI/converters.effect.convertToPostData'
			)(function* () {
				const [endpointConfigHandler, pageConfigHandler, useBlogPkgConfHandler] = yield* Effect.all(
					[ImportEndpointConfig, RawPageData, useBlogPkgConf]
				);

				const [endpoint, post, useBlogPkg] = yield* Effect.all([
					endpointConfigHandler.endpoint,
					pageConfigHandler.page,
					useBlogPkgConfHandler.useBlogPkg,
				]);

				const data = post as Post;

				const pkg = useBlogPkg ? '@studiocms/blog' : 'studiocms/markdown';

				const cleanedHTML = yield* stripHtml.pipe(StringConfig.makeProvide(data.excerpt.rendered));

				const titleImageId = data.featured_media;

				if (!titleImageId || titleImageId === 0) {
					yield* Console.log('No featured media for:', data.title.rendered);

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
					return pageData;
				}

				const titleImageURL = yield* apiEndpoint.pipe(
					APIEndpointConfig.makeProvide(endpoint, 'media', String(titleImageId))
				);
				const titleImageResponse = yield* Effect.tryPromise(() => fetch(titleImageURL));
				const titleImageJson = yield* Effect.tryPromise(() => titleImageResponse.json());
				const titleImage = yield* downloadPostImage.pipe(
					DownloadPostImageConfig.makeProvide(titleImageJson.source_url, postsImagesFolder)
				);

				yield* generateCategories.pipe(
					ImportEndpointConfig.makeProvide(endpoint),
					CategoryOrTagConfig.makeProvide(data.categories)
				);
				yield* generateTags.pipe(
					ImportEndpointConfig.makeProvide(endpoint),
					CategoryOrTagConfig.makeProvide(data.tags)
				);

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
					heroImage: titleImage,
				};

				return pageData;
			});

			/**
			 * Converts the given post data to a PageContent object.
			 *
			 * @param pageData - The data of the page to which the post content belongs.
			 * @param post - The post data to be converted.
			 */
			const convertToPostContent = genLogger(
				'@studiocms/devapps/effects/WordPressAPI/converters.effect.convertToPostContent'
			)(function* () {
				const [pageDataConfigHandler, pageConfigHandler] = yield* Effect.all([
					FullPageData,
					RawPageData,
				]);

				const [pageData, post] = yield* Effect.all([
					pageDataConfigHandler.pageData,
					pageConfigHandler.page,
				]);

				const data = post as Post;

				// @ts-expect-error - Drizzle broke this
				if (pageData.id === undefined) {
					yield* Effect.fail(new Error('pageData is missing id'));
				}

				const cleanupContent = yield* cleanUpHtml.pipe(
					StringConfig.makeProvide(data.content.rendered)
				);
				const htmlWithImages = yield* downloadAndUpdateImages.pipe(
					DownloadPostImageConfig.makeProvide(cleanupContent, postsImagesFolder)
				);

				const content = yield* turndown.pipe(StringConfig.makeProvide(htmlWithImages));

				const pageContent: PageContent = {
					// @ts-expect-error - Drizzle broke this
					id: crypto.randomUUID(),
					// @ts-expect-error - Drizzle broke this
					contentId: pageData.id,
					contentLang: 'default',
					content: content,
				};

				return pageContent;
			});

			return {
				convertToPageData,
				convertToPageContent,
				convertToPostData,
				convertToPostContent,
			};
		}),
	}
) {}
