import path from 'node:path';
import { SDKCore } from 'studiocms:sdk';
import { userProjectRoot } from 'virtual:studiocms-devapps/config';
import { StudioCMSPageDataCategories, StudioCMSPageDataTags } from '@withstudiocms/sdk/tables';
import { Console, Effect, genLogger, Schema } from 'studiocms/effect';
import { decode } from 'studiocms/runtime';
import type { CombinedInsertContent } from 'studiocms/sdk/types';
import {
	APIEndpointConfig,
	CategoryOrTagConfig,
	DownloadPostImageConfig,
	FullPageData,
	ImportEndpointConfig,
	RawPageData,
	StringConfig,
	UseBlogPkgConfig,
} from './configs.js';
import type { PageData } from './importers.js';
import { Page, Post } from './schema.js';
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

const sharedMeta = (data: Post | Page) => ({
	augments: '[]',
	authorId: '',
	categories: '[]',
	tags: '[]',
	contributorIds: '[]',
	draft: data.status !== 'publish',
	heroImage: undefined,
	parentFolder: undefined,
	showAuthor: false,
	showContributors: false,
});

export class WordPressAPIConverters extends Effect.Service<WordPressAPIConverters>()(
	'WordPressAPIConverters',
	{
		dependencies: [WordPressAPIUtils.Default],
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
			 * Retrieves a category by its ID from the database.
			 *
			 * @param id - The ID of the category to retrieve.
			 * @returns A promise that resolves to the category data or undefined if not found.
			 */
			const _getCategoryById = sdk.dbService.withCodec({
				decoder: Schema.UndefinedOr(StudioCMSPageDataCategories.Select),
				encoder: Schema.Number,
				callbackFn: (client, id) =>
					client((db) =>
						db
							.selectFrom('StudioCMSPageDataCategories')
							.selectAll()
							.where('id', '=', id)
							.executeTakeFirst()
					),
			});

			/**
			 * Inserts new category(s) into the database.
			 *
			 * @param categoryData - The data of the category to insert.
			 * @returns A promise that resolves when the category has been inserted.
			 */
			const _insertCategory = sdk.dbService.withEncoder({
				encoder: Schema.Union(
					Schema.Array(StudioCMSPageDataCategories.Insert),
					StudioCMSPageDataCategories.Insert
				),
				callbackFn: (client, data) =>
					client((db) => db.insertInto('StudioCMSPageDataCategories').values(data).execute()),
			});

			/**
			 * Retrieves a tag by its ID from the database.
			 *
			 * @param id - The ID of the tag to retrieve.
			 * @returns A promise that resolves to the tag data or undefined if not found.
			 */
			const _getTagById = sdk.dbService.withCodec({
				decoder: Schema.UndefinedOr(StudioCMSPageDataTags.Select),
				encoder: Schema.Number,
				callbackFn: (client, id) =>
					client((db) =>
						db
							.selectFrom('StudioCMSPageDataTags')
							.selectAll()
							.where('id', '=', id)
							.executeTakeFirst()
					),
			});

			/**
			 * Inserts new tag(s) into the database.
			 *
			 * @param tagData - The data of the tag to insert.
			 * @returns A promise that resolves when the tag has been inserted.
			 */
			const _insertTag = sdk.dbService.withEncoder({
				encoder: Schema.Union(
					Schema.Array(StudioCMSPageDataTags.Insert),
					StudioCMSPageDataTags.Insert
				),
				callbackFn: (client, data) =>
					client((db) => db.insertInto('StudioCMSPageDataTags').values(data).execute()),
			});

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
				const [{ endpoint }, { page }] = yield* Effect.all([ImportEndpointConfig, RawPageData]);

				if (!endpoint) {
					yield* Effect.fail(new Error('Missing endpoint configuration'));
				}
				if (!page) {
					yield* Effect.fail(new Error('Missing page data'));
				}

				const data = yield* Schema.decodeUnknown(Page)(page);

				const cleanHTML = yield* stripHtml.pipe(StringConfig.makeProvide(data.excerpt.rendered));

				const titleImageId = data.featured_media;

				if (!titleImageId || titleImageId === 0) {
					yield* Console.log('No featured media for:', data.title.rendered);

					const pageData: PageData = {
						...sharedMeta(data),
						id: crypto.randomUUID(),
						title: data.title.rendered,
						description: decode(cleanHTML),
						slug: data.slug,
						publishedAt: new Date(data.date_gmt).toISOString(),
						updatedAt: new Date(data.modified_gmt).toISOString(),
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
					...sharedMeta(data),
					id: crypto.randomUUID(),
					title: data.title.rendered,
					description: decode(cleanHTML),
					slug: data.slug,
					publishedAt: new Date(data.date_gmt).toISOString(),
					updatedAt: new Date(data.modified_gmt).toISOString(),
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
				const [
					{ page },
					{
						pageData: { id: pageId },
					},
				] = yield* Effect.all([RawPageData, FullPageData]);

				const data = yield* Schema.decodeUnknown(Page)(page);

				if (!pageId) {
					return yield* Effect.fail(new Error('pageData is missing id'));
				}

				const cleanUpContent = yield* cleanUpHtml.pipe(
					StringConfig.makeProvide(data.content.rendered)
				);
				const htmlWithImages = yield* downloadAndUpdateImages.pipe(
					DownloadPostImageConfig.makeProvide(cleanUpContent, pagesImagesFolder)
				);

				const content = yield* turndown.pipe(StringConfig.makeProvide(htmlWithImages));

				const pageContent: CombinedInsertContent = {
					contentLang: 'default',
					content: content,
				};

				return pageContent;
			});

			const generateCategoriesOrTags = <T extends 'categories' | 'tags'>(type: T) =>
				genLogger(
					'@studiocms/devapps/effects/WordPressAPI/converters.effect.generateCategoriesOrTags'
				)(function* () {
					const [{ endpoint }, { value }] = yield* Effect.all([
						ImportEndpointConfig,
						CategoryOrTagConfig,
					]);

					const TableFnMap = {
						categories: _getCategoryById,
						tags: _getTagById,
					};

					const tableFn = TableFnMap[type];

					const newItems = [];

					const idChecks = yield* Effect.all(
						value.map((val) =>
							tableFn(val).pipe(Effect.map((exists) => ({ val, exists: !!exists })))
						),
						{ concurrency: 10 }
					);

					const missingIds = idChecks.filter(({ exists }) => !exists).map(({ val }) => val);

					const fetchedIds = yield* Effect.all(
						missingIds.map((id) =>
							apiEndpoint.pipe(
								APIEndpointConfig.makeProvide(endpoint, type, String(id)),
								Effect.flatMap((url) => Effect.tryPromise(() => fetch(url))),
								Effect.flatMap((response) => Effect.tryPromise(() => response.json()))
							)
						),
						{ concurrency: 5 } // Limit concurrent API calls
					);

					newItems.push(...fetchedIds);

					if (newItems.length > 0) {
						switch (type) {
							case 'categories': {
								const data = newItems.map(
									(category) =>
										({
											id: category.id,
											name: category.name,
											slug: category.slug,
											description: category.description,
											meta: JSON.stringify(category.meta),
											parent: category.parent || null,
										}) as (typeof StudioCMSPageDataCategories)['Insert']['Type']
								);

								yield* Console.log(
									'Inserting new Categories into the database:',
									data.map((d) => `${d.id}: ${d.name}`).join(', ')
								);
								yield* _insertCategory(data);

								yield* Console.log('Categories inserted!');
								break;
							}
							case 'tags': {
								const tagData = newItems.map(
									(tag) =>
										({
											id: tag.id,
											name: tag.name,
											slug: tag.slug,
											description: tag.description,
											meta: JSON.stringify(tag.meta),
										}) as (typeof StudioCMSPageDataTags)['Insert']['Type']
								);

								yield* Console.log(
									'Inserting new Tags into the database:',
									tagData.map((data) => `${data.id}: ${data.name}`).join(', ')
								);
								yield* _insertTag(tagData);

								yield* Console.log('Tags inserted!');
								break;
							}
						}
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
				const [{ endpoint }, { page: post }, { useBlogPkg }] = yield* Effect.all([
					ImportEndpointConfig,
					RawPageData,
					UseBlogPkgConfig,
				]);

				const data = yield* Schema.decodeUnknown(Post)(post);

				const pkg = useBlogPkg ? '@studiocms/blog' : 'studiocms/markdown';

				const cleanedHTML = yield* stripHtml.pipe(StringConfig.makeProvide(data.excerpt.rendered));

				const titleImageId = data.featured_media;

				if (!titleImageId || titleImageId === 0) {
					yield* Console.log('No featured media for:', data.title.rendered);

					const pageData: PageData = {
						...sharedMeta(data),
						id: crypto.randomUUID(),
						title: data.title.rendered,
						description: decode(cleanedHTML),
						slug: data.slug,
						publishedAt: new Date(data.date_gmt).toISOString(),
						updatedAt: new Date(data.modified_gmt).toISOString(),
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

				yield* generateCategoriesOrTags('categories').pipe(
					ImportEndpointConfig.makeProvide(endpoint),
					CategoryOrTagConfig.makeProvide(data.categories)
				);
				yield* generateCategoriesOrTags('tags').pipe(
					ImportEndpointConfig.makeProvide(endpoint),
					CategoryOrTagConfig.makeProvide(data.tags)
				);

				const pageData: PageData = {
					...sharedMeta(data),
					id: crypto.randomUUID(),
					title: data.title.rendered,
					description: decode(cleanedHTML),
					slug: data.slug,
					publishedAt: new Date(data.date_gmt).toISOString(),
					updatedAt: new Date(data.modified_gmt).toISOString(),
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
				const [
					{
						pageData: { id: pageId },
					},
					{ page: post },
				] = yield* Effect.all([FullPageData, RawPageData]);

				const data = yield* Schema.decodeUnknown(Post)(post);

				if (!pageId) {
					return yield* Effect.fail(new Error('pageData is missing id'));
				}

				const cleanupContent = yield* cleanUpHtml.pipe(
					StringConfig.makeProvide(data.content.rendered)
				);
				const htmlWithImages = yield* downloadAndUpdateImages.pipe(
					DownloadPostImageConfig.makeProvide(cleanupContent, postsImagesFolder)
				);

				const content = yield* turndown.pipe(StringConfig.makeProvide(htmlWithImages));

				const pageContent: CombinedInsertContent = {
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
