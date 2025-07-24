import { eq } from 'astro:db';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB, SDKCore_Generators, SDKCore_Users } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import {
	tsDiffTracking,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
} from '../tables.js';
import type {
	CombinedInsertContent,
	MultiPageInsert,
	addDatabaseEntryInsertPage,
	tsDiffTrackingSelect,
	tsPageContentSelect,
	tsPageDataCategoriesSelect,
	tsPageDataSelect,
	tsPageDataTagsSelect,
	tsPageFolderSelect,
	tsPermissionsInsert,
} from '../types/index.js';
import {
	CacheContext,
	_ClearUnknownError,
	_clearLibSQLError,
	isCacheEnabled,
	pageDataReturn,
} from '../utils.js';
import { SDKCore_CLEAR } from './clear.js';
import { SDKCore_GET } from './get.js';
import { SDKCore_UPDATE } from './update.js';

/**
 * SDKCore_POST provides a set of database insertion operations for StudioCMS entities,
 * including pages, page content, tags, categories, permissions, diff tracking, and folders.
 * 
 * @remarks
 * This service is designed to be used within the StudioCMS SDK core, leveraging effectful
 * operations and dependency injection for database access and cache management.
 * 
 * @example
 * ```typescript
 * const sdkPost = new SDKCore_POST();
 * sdkPost.databaseEntry.pages(pageData, pageContent);
 * ```
 * 
 * @module studiocms/sdk/SDKCore/modules/post
 * 
 * @dependencies
 * - AstroDB.Default
 * - SDKCore_CLEAR.Default
 * - SDKCore_Users.Default
 * - SDKCore_UPDATE.Default
 * - SDKCore_Generators.Default
 * - SDKCore_GET.Default
 * 
 * @effect
 * Provides effectful methods for:
 * - Inserting single and multiple pages, tags, categories, permissions, folders, and diff tracking entries.
 * - Handling errors from the database layer and providing clear error messages.
 * - Managing cache and updating folder structures after insertions.
 * 
 * @throws {StudioCMS_SDK_Error}
 * Throws when database operations fail or when attempting to insert duplicate permissions.
 */
export class SDKCore_POST extends Effect.Service<SDKCore_POST>()(
	'studiocms/sdk/SDKCore/modules/post',
	{
		dependencies: [
			AstroDB.Default,
			SDKCore_CLEAR.Default,
			SDKCore_Users.Default,
			SDKCore_UPDATE.Default,
			SDKCore_Generators.Default,
			SDKCore_GET.Default
		],
		effect: genLogger('studiocms/sdk/SDKCore/modules/post/effect')(function* () {
			const [dbService, CLEAR, UPDATE, GET, { generateRandomIDNumber }, { pages }] = yield* Effect.all([
				AstroDB,
				SDKCore_CLEAR,
				SDKCore_UPDATE,
				SDKCore_GET,
				SDKCore_Generators,
				CacheContext,
			]);

			const POST = {
				databaseEntry: {
					/**
					 * Insert a new page into the database.
					 *
					 * @param pageData - The data to insert into the page data table.
					 * @param pageContent - The data to insert into the page content table.
					 * @returns A promise that resolves to the inserted page data and page content.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the page.
					 */
					pages: (pageData: tsPageDataSelect, pageContent: CombinedInsertContent) =>
						Effect.gen(function* () {
							const newContentID = pageData.id || crypto.randomUUID().toString();

							const {
								id = newContentID,
								title,
								slug,
								description,
								authorId = null,
								package: packageName = 'studiocms',
								contentLang = 'default',
								heroImage = '',
								showOnNav = false,
								showAuthor = false,
								showContributors = false,
								categories = [],
								tags = [],
								contributorIds = [],
								draft = false,
								parentFolder = null,
							} = pageData;

							const stringified = {
								categories: categories || [],
								tags: tags || [],
								contributorIds: contributorIds || [],
							};

							const contentData = {
								id: crypto.randomUUID().toString(),
								contentId: newContentID,
								contentLang: contentLang,
								content: pageContent.content || '',
							};

							const NOW = new Date();

							const newPageData = yield* dbService.execute((db) =>
								db
									.insert(tsPageData)
									.values({
										// @ts-expect-error Drizzle... removed this from the type?
										id,
										title,
										slug,
										description,
										authorId,
										contentLang,
										heroImage,
										showAuthor,
										showContributors,
										showOnNav,
										draft,
										parentFolder,
										package: packageName,
										publishedAt: NOW,
										updatedAt: NOW,
										...stringified,
									})
									.returning({ id: tsPageData.id })
							);

							const newPageContent = yield* dbService.execute((db) =>
								db.insert(tsPageContent).values(contentData).returning({ id: tsPageContent.id })
							);

							return {
								pageData: newPageData,
								pageContent: newPageContent,
							} as addDatabaseEntryInsertPage;
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntry.pages', cause),
							})
						),
					/**
					 * Inserts new page content into the database.
					 *
					 * @param pageContent - The data to insert into the page content table.
					 * @returns A promise that resolves to the inserted page content.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the page content.
					 */
					pageContent: dbService.makeQuery((ex, pageContent: tsPageContentSelect) =>
						ex((db) =>
							db
								.insert(tsPageContent)
								.values({
									// @ts-expect-error Drizzle... removed this from the type?
									id: pageContent.id || crypto.randomUUID().toString(),
									contentId: pageContent.contentId,
									contentLang: pageContent.contentLang || 'default',
									content: pageContent.content || '',
								})
								.returning({ id: tsPageContent.id })
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntry.pageContent', cause),
							})
						)
					),
					/**
					 * Inserts a new tag into the database.
					 *
					 * @param tag - The data to insert into the page data tags table.
					 * @returns A promise that resolves to the inserted tag.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the tag.
					 */
					tags: (tag: tsPageDataTagsSelect) =>
						Effect.gen(function* () {
							const id = tag.id || (yield* generateRandomIDNumber(9));

							return yield* dbService.execute((db) =>
								db
									.insert(tsPageDataTags)
									.values({
										// @ts-expect-error Drizzle... removed this from the type?
										id,
										name: tag.name,
										description: tag.description,
										slug: tag.slug,
										meta: JSON.stringify(tag.meta),
									})
									.returning({ id: tsPageDataTags.id })
							);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntry.tags', cause),
							})
						),
					/**
					 * Inserts a new category into the database.
					 *
					 * @param category - The data to insert into the page data categories table.
					 * @returns A promise that resolves to the inserted category.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the category.
					 */
					categories: (category: tsPageDataCategoriesSelect) =>
						Effect.gen(function* () {
							const id = category.id || (yield* generateRandomIDNumber(9));

							return yield* dbService.execute((db) =>
								db
									.insert(tsPageDataCategories)
									.values({
										// @ts-expect-error Drizzle... removed this from the type?
										id,
										name: category.name,
										description: category.description,
										slug: category.slug,
										meta: JSON.stringify(category.meta),
									})
									.returning({ id: tsPageDataCategories.id })
							);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntry.tags', cause),
							})
						),
					/**
					 * Inserts a new permission into the database.
					 *
					 * @param userId - The ID of the user to assign the rank to.
					 * @param rank - The rank to assign to the user.
					 * @returns A promise that resolves to the inserted permission.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the permission.
					 */
					permissions: (userId: string, rank: string) =>
						Effect.gen(function* () {
							const userExists = yield* dbService.execute((db) =>
								db.select().from(tsPermissions).where(eq(tsPermissions.user, userId)).get()
							);

							if (userExists) {
								return yield* Effect.fail(
									yield* _clearLibSQLError(
										'POST.databaseEntry.permissions',
										'User already is already assigned a rank, please update the existing rank instead.'
									)
								);
							}

							return yield* dbService.execute((db) =>
								db
									.insert(tsPermissions)
									.values({
										user: userId,
										rank,
									})
									.returning({ user: tsPermissions.user, rank: tsPermissions.rank })
							);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntry.permissions', cause),
							})
						),
					/**
					 * Inserts a new diff tracking entry into the database.
					 *
					 * @param diff - The data to insert into the diff tracking table.
					 * @returns A promise that resolves to the inserted diff tracking entry.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the diff tracking entry.
					 */
					diffTracking: dbService.makeQuery((ex, diff: tsDiffTrackingSelect) =>
						ex((db) =>
							db
								.insert(tsDiffTracking)
								.values({
									// @ts-expect-error Drizzle... removed this from the type?
									id: diff.id || crypto.randomUUID().toString(),
									userId: diff.userId,
									pageId: diff.pageId,
									diff: diff.diff || '',
									timestamp: diff.timestamp || new Date(),
									pageContentStart: diff.pageContentStart,
									pageMetaData: JSON.stringify(diff.pageMetaData || {}),
								})
								.returning()
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntry.diffTracking', cause),
							})
						)
					),
					/**
					 * Inserts a new folder into the database.
					 *
					 * @param folder - The data to insert into the page folder structure table.
					 * @returns A promise that resolves to the inserted folder.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the folder.
					 */
					folder: dbService.makeQuery((ex, folder: tsPageFolderSelect) =>
						ex((db) =>
							db
								.insert(tsPageFolderStructure)
								.values({
									// @ts-expect-error Drizzle... removed this from the type?
									id: folder.id || crypto.randomUUID().toString(),
									name: folder.name,
									parent: folder.parent || null,
								})
								.returning()
								.get()
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntry.folder', cause),
							})
						)
					),
				},
				databaseEntries: {
					/**
					 * Inserts multiple tags into the database.
					 *
					 * @param data - The data to insert into the page data tags table.
					 * @returns A promise that resolves to the inserted tags.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the tags.
					 */
					tags: (data: tsPageDataTagsSelect[]) =>
						Effect.gen(function* () {
							const entries: tsPageDataTagsSelect[] = [];

							for (const item of data) {
								const id = item.id || (yield* generateRandomIDNumber(9));
								entries.push({
									id,
									name: item.name,
									slug: item.slug,
									description: item.description,
									meta: JSON.stringify(item.meta),
								});
							}

							return yield* dbService.execute((db) =>
								db.insert(tsPageDataTags).values(entries).returning({ id: tsPageDataTags.id })
							);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntries.tags', cause),
							})
						),
					/**
					 * Inserts multiple categories into the database.
					 *
					 * @param data - The data to insert into the page data categories table.
					 * @returns A promise that resolves to the inserted categories.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the categories.
					 */
					categories: (data: tsPageDataCategoriesSelect[]) =>
						Effect.gen(function* () {
							const entries: tsPageDataCategoriesSelect[] = [];

							for (const item of data) {
								const id = item.id || (yield* generateRandomIDNumber(9));
								entries.push({
									id,
									name: item.name,
									slug: item.slug,
									description: item.description,
									meta: JSON.stringify(item.meta),
									parent: null,
								});
							}

							return yield* dbService.execute((db) =>
								db
									.insert(tsPageDataCategories)
									.values(entries)
									.returning({ id: tsPageDataCategories.id })
							);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntries.categories', cause),
							})
						),
					/**
					 * Inserts multiple permissions into the database.
					 *
					 * @param data - The data to insert into the permissions table.
					 * @returns A promise that resolves to the inserted permissions.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the permissions.
					 */
					permissions: (data: tsPermissionsInsert[]) =>
						Effect.gen(function* () {
							const currentPermittedUsers = yield* dbService.execute((db) =>
								db.select().from(tsPermissions)
							);

							for (const permission of data) {
								const userAlreadyExists = currentPermittedUsers.find(
									(user) => user.user === permission.user
								);

								if (userAlreadyExists) {
									return yield* Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`User with ID ${permission.user} already has a rank assigned. Please update the existing rank instead.`
											),
										})
									);
								}
							}

							return yield* dbService.execute((db) =>
								db
									.insert(tsPermissions)
									.values(
										data.map((permission) => {
											return {
												user: permission.user,
												rank: permission.rank,
											};
										})
									)
									.returning({ user: tsPermissions.user, rank: tsPermissions.rank })
							);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('POST.databaseEntries.permissions', cause),
							})
						),
					/**
					 * Inserts multiple pages into the database.
					 *
					 * @param pages - The data to insert into the page data and page content tables.
					 * @returns A promise that resolves to the inserted pages.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the pages.
					 */
					pages: (pages: MultiPageInsert) =>
						Effect.gen(function* () {
							for (const { pageData, pageContent } of pages) {
								yield* POST.databaseEntry.pages(pageData, pageContent);
							}
						}),
				},
				folder: (data: tsPageFolderSelect) =>
					Effect.gen(function* () {
						const newEntry = yield* POST.databaseEntry.folder(data);

						yield* CLEAR.folderList();
						yield* CLEAR.folderTree();

						yield* UPDATE.folderList;
						yield* UPDATE.folderTree;

						return newEntry;
					}),
				page: (data: {
					pageData: tsPageDataSelect;
					pageContent: CombinedInsertContent;
				}) =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;

						if (!status) {
							const newPage = yield* POST.databaseEntry.pages(data.pageData, data.pageContent);

							const { data: toReturn } = yield* GET.page.byId(newPage.pageData[0].id);

							return pageDataReturn(toReturn);
						}

						const newPage = yield* POST.databaseEntry.pages(data.pageData, data.pageContent);

						const { data: toReturn } = yield* GET.page.byId(newPage.pageData[0].id);

						pages.set(toReturn.id, pageDataReturn(toReturn));
						yield* CLEAR.folderList();
						yield* CLEAR.folderTree();

						return pageDataReturn(toReturn);
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _ClearUnknownError('POST.page', cause),
						})
					),
			};

			return POST;
		}),
	}
) {}
