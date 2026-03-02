import { Password, User } from 'studiocms:auth/lib';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsPageContentSelect, tsPageData, tsPageDataSelect } from 'studiocms:sdk/types';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSRestApiV1Spec } from '@withstudiocms/api-spec';
import {
	APISafeUserFields,
	CurrentRestAPIUser,
	RestAPIError,
} from '@withstudiocms/api-spec/rest-api';
import type { AvailablePermissionRanks } from '@withstudiocms/auth-kit/types';
import {
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPageFolderStructure,
} from '@withstudiocms/sdk/tables';
import { Effect, Layer, Schema } from 'effect';
import { isValidEmail } from '#schemas';
import { RestAPIAuthorizationLive } from '../../../_middleware/restApi.js';
import { sharedDBErrors, sharedNotifierErrors, sharedPageCollectionErrors } from './_shared.js';

/**
 * Utility schema for encoding Arrays of Strings
 */
const StringArrayCodec = Schema.transform(Schema.String, Schema.Array(Schema.String), {
	strict: true,
	decode: (data) => JSON.parse(data),
	encode: (data) => JSON.stringify(data),
});

/**
 * Function that uses the String Array Schema to create a JSON.stringify like function for string arrays
 */
const encodeStringArray = Schema.encode(StringArrayCodec);

/**
 * Array of available permission levels for the REST API. This is used to check user permissions when accessing secure endpoints, ensuring that only users with the appropriate rank can perform certain actions. The ranks are defined in ascending order of permissions, with 'unknown' having the least permissions and 'owner' having the most.
 */
const permissionLevels: AvailablePermissionRanks[] = [
	'unknown',
	'visitor',
	'editor',
	'admin',
	'owner',
];

/**
 * REST API v1 Secure Handler
 *
 * This handler is responsible for managing all secure endpoints of the REST API v1. It includes endpoints for creating, updating, deleting, and retrieving categories, folders, pages, settings, tags, and users. Each endpoint is currently implemented as a placeholder that returns an empty Effect, but can be expanded in the future to include actual logic for interacting with the database and performing the necessary operations.
 */
export const RestApiSecureHandler = HttpApiBuilder.group(
	StudioCMSRestApiV1Spec,
	'restV1',
	(handlers) =>
		handlers
			// Category Endpoints
			.handle(
				'createCategory',
				Effect.fn(
					function* ({ payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const newId = yield* sdk.UTIL.Generators.generateRandomIDNumber(9);
						const newCategory = { id: newId, ...payload };

						yield* sdk.POST.databaseEntry.categories(newCategory);
						yield* notifier
							.sendEditorNotification('new_category', newCategory.name)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for new category' })
								)
							);

						return yield* sdk.GET.categories
							.byId(newId)
							.pipe(
								Effect.flatMap((category) =>
									category
										? Effect.succeed(category)
										: Effect.fail(
												new RestAPIError({ error: 'Failed to retrieve newly created category' })
											)
								)
							);
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						GeneratorError: () =>
							new RestAPIError({ error: 'Failed to generate new ID for category' }),
					})
				)
			)
			.handle(
				'deleteCategory',
				Effect.fn(
					function* ({ path: { id } }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const checkForChildrenCategories = sdk.dbService.withCodec({
							encoder: Schema.Number,
							decoder: Schema.Array(StudioCMSPageDataCategories.Select),
							callbackFn: (client, categoryId) =>
								client((db) =>
									db
										.selectFrom('StudioCMSPageDataCategories')
										.where('parent', '=', categoryId)
										.selectAll()
										.execute()
								),
						});

						const getPageList = sdk.GET.pages(true, true);

						const flattenAndCount = <T extends { id: number }>(arrays: T[][]): boolean => {
							return arrays.flat().filter((data) => data.id === id).length > 0;
						};

						const checkForChildrenPagesCategories = () =>
							getPageList.pipe(
								Effect.map((data) => data.map(({ categories }) => categories)),
								Effect.map(flattenAndCount)
							);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const existingCategory = yield* sdk.GET.categories.byId(id);

						if (!existingCategory) {
							return yield* new RestAPIError({ error: 'Category not found' });
						}

						const hasChildrenCategories = yield* checkForChildrenCategories(id).pipe(
							Effect.map((categories) => categories.length > 0)
						);

						if (hasChildrenCategories) {
							return yield* new RestAPIError({
								error: 'Cannot delete category with child categories',
							});
						}

						const hasChildrenPages = yield* checkForChildrenPagesCategories();

						if (hasChildrenPages) {
							return yield* new RestAPIError({ error: 'Cannot delete category assigned to pages' });
						}

						yield* sdk.DELETE.categories(id);
						yield* notifier
							.sendEditorNotification('delete_category', existingCategory.name)
							.pipe(
								Effect.catchAll(
									() =>
										new RestAPIError({ error: 'Failed to send notification for category deletion' })
								)
							);

						return { success: true };
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						...sharedPageCollectionErrors,
					})
				)
			)
			.handle(
				'updateCategory',
				Effect.fn(
					function* ({ path: { id }, payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const updateCategory = sdk.dbService.withCodec({
							encoder: Schema.partial(StudioCMSPageDataCategories.Select),
							decoder: StudioCMSPageDataCategories.Select,
							callbackFn: (db, data) =>
								db((client) =>
									client.transaction().execute(async (trx) => {
										await trx
											.updateTable('StudioCMSPageDataCategories')
											.set(data)
											.where('id', '=', id)
											.executeTakeFirstOrThrow();

										return await trx
											.selectFrom('StudioCMSPageDataCategories')
											.selectAll()
											.where('id', '=', id)
											.executeTakeFirstOrThrow();
									})
								),
						});

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						if (payload.id && payload.id !== id) {
							return yield* new RestAPIError({
								error: "ID in payload does not match ID in path, ID's must match to update.",
							});
						}

						const parentId = payload.parent;
						if (parentId && parentId === id) {
							return yield* new RestAPIError({
								error: 'Category cannot be its own parent',
							});
						}

						const updatedCategory = yield* updateCategory(payload);

						yield* notifier
							.sendEditorNotification('update_category', updatedCategory.name)
							.pipe(
								Effect.catchAll(
									() =>
										new RestAPIError({ error: 'Failed to send notification for category update' })
								)
							);

						return updatedCategory;
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
			.handle(
				'getCategories',
				Effect.fn(function* ({ urlParams: { name, parent } }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					let categories = yield* sdk.GET.categories.getAll();

					if (name) {
						categories = categories.filter((category) => category.name.includes(name));
					}
					if (parent) {
						categories = categories.filter((category) => category.parent === parent);
					}

					return categories;
				}, Effect.catchTags(sharedDBErrors))
			)
			.handle(
				'getCategory',
				Effect.fn(function* ({ path: { id } }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					return yield* sdk.GET.categories
						.byId(id)
						.pipe(
							Effect.flatMap((category) =>
								category
									? Effect.succeed(category)
									: Effect.fail(new RestAPIError({ error: 'Category not found' }))
							)
						);
				}, Effect.catchTags(sharedDBErrors))
			)

			// Folder Endpoints
			.handle(
				'createFolder',
				Effect.fn(
					function* ({ payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const newFolderData = { ...payload, id: crypto.randomUUID() };

						yield* sdk.POST.databaseEntry.folder(newFolderData);

						yield* notifier
							.sendEditorNotification('new_folder', newFolderData.name)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for new folder' })
								)
							);

						yield* Effect.all([sdk.UPDATE.folderList, sdk.UPDATE.folderTree]);

						return {
							message: `Folder created successfully with id: ${newFolderData.id}`,
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						FolderTreeError: () =>
							new RestAPIError({ error: 'Failed to update folder tree after creating folder' }),
					})
				)
			)
			.handle(
				'deleteFolder',
				Effect.fn(
					function* ({ path: { id } }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						/**
						 * Check for child folders before deletion
						 */
						const checkForChildrenFolders = sdk.dbService.withCodec({
							encoder: Schema.String,
							decoder: Schema.Array(StudioCMSPageFolderStructure),
							callbackFn: (client, id) =>
								client((db) =>
									db
										.selectFrom('StudioCMSPageFolderStructure')
										.where('parent', '=', id)
										.selectAll()
										.execute()
								),
						});

						/**
						 * Check for child pages before deletion
						 */
						const checkForChildrenPages = sdk.dbService.withCodec({
							encoder: Schema.String,
							decoder: Schema.Array(StudioCMSPageData),
							callbackFn: (client, id) =>
								client((db) =>
									db
										.selectFrom('StudioCMSPageData')
										.where('parentFolder', '=', id)
										.selectAll()
										.execute()
								),
						});

						/**
						 * Check for any children (folders or pages) before deletion
						 */
						const checkForChildren = Effect.fn((id: string) =>
							Effect.all({
								folders: checkForChildrenFolders(id),
								pages: checkForChildrenPages(id),
							}).pipe(
								Effect.map(({ folders, pages }) => {
									return { hasChildren: folders.length > 0 || pages.length > 0 };
								})
							)
						);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const existingFolder = yield* sdk.GET.folder(id);

						if (!existingFolder) {
							return yield* new RestAPIError({ error: 'Folder not found' });
						}

						const { hasChildren } = yield* checkForChildren(id);

						if (hasChildren) {
							return yield* new RestAPIError({
								error: 'Cannot delete folder with child folders or pages',
							});
						}

						yield* Effect.all([
							sdk.DELETE.folder(id),
							sdk.UPDATE.folderList,
							sdk.UPDATE.folderTree,
						]);

						yield* notifier
							.sendEditorNotification('folder_deleted', existingFolder.name)
							.pipe(
								Effect.catchAll(
									() =>
										new RestAPIError({ error: 'Failed to send notification for folder deletion' })
								)
							);

						return {
							success: true,
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						FolderTreeError: () =>
							new RestAPIError({ error: 'Failed to update folder tree after deleting folder' }),
					})
				)
			)
			.handle(
				'updateFolder',
				Effect.fn(
					function* ({ path: { id }, payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const { folderName, parentFolder } = payload;

						if (parentFolder && parentFolder === id) {
							return yield* new RestAPIError({ error: 'Folder cannot be its own parent' });
						}

						const existingFolder = yield* sdk.GET.folder(id);

						if (!existingFolder) {
							return yield* new RestAPIError({ error: 'Folder not found' });
						}

						const folderData = yield* sdk.UPDATE.folder({
							id,
							name: folderName,
							parent: parentFolder || null,
						});

						yield* notifier
							.sendEditorNotification('folder_updated', folderData.name)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for folder update' })
								)
							);

						yield* Effect.all([sdk.UPDATE.folderList, sdk.UPDATE.folderTree]);

						return {
							message: 'Folder updated successfully',
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						FolderTreeError: () =>
							new RestAPIError({ error: 'Failed to update folder tree after creating folder' }),
					})
				)
			)
			.handle(
				'getFolders',
				Effect.fn(function* ({ urlParams: { name, parent } }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					let folders = yield* sdk.GET.folderList();

					if (name) {
						folders = folders.filter((folder) => folder.name.includes(name));
					}
					if (parent) {
						folders = folders.filter((folder) => folder.parent === parent);
					}

					return folders;
				}, Effect.catchTags(sharedDBErrors))
			)
			.handle(
				'getFolder',
				Effect.fn(function* ({ path: { id } }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					if (user.rank !== 'owner' && user.rank !== 'admin' && user.rank !== 'editor') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					return yield* sdk.GET.folder(id).pipe(
						Effect.flatMap((folder) =>
							folder
								? Effect.succeed(folder)
								: Effect.fail(new RestAPIError({ error: 'Folder not found' }))
						)
					);
				}, Effect.catchTags(sharedDBErrors))
			)

			// Page Endpoints
			.handle(
				'createPage',
				Effect.fn(
					function* ({ payload: { data, content } }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank, userId } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						if (!data) {
							return yield* new RestAPIError({ error: 'Page data is required' });
						}

						if (!content) {
							return yield* new RestAPIError({ error: 'Page content is required' });
						}

						if (!data.title) {
							return yield* new RestAPIError({ error: 'Page title is required in page data' });
						}

						const dataId = crypto.randomUUID();

						const {
							title,
							slug,
							description,
							categories,
							tags,
							contributorIds,
							augments,
							id: ___id,
							authorId: __authorId,
							updatedAt: __updatedAt,
							publishedAt: __publishedAt,
							...restPageData
						} = data;

						const { id: ____id, ...contentData } = content;

						yield* sdk.POST.databaseEntry.pages(
							{
								id: dataId,
								title,
								slug:
									slug ||
									title
										.toLowerCase()
										.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
										.replace(/\s+/g, '-') // Replace spaces with hyphens
										.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
										.replace(/^-|-$/g, ''), // Remove leading/trailing hyphens '-'),
								description: description || '',
								authorId: userId,
								updatedAt: new Date().toISOString(),
								publishedAt: new Date().toISOString(),
								categories: yield* encodeStringArray(categories || []),
								tags: yield* encodeStringArray(tags || []),
								contributorIds: yield* encodeStringArray(contributorIds || []),
								augments: yield* encodeStringArray(augments || []),
								...(restPageData as Omit<
									tsPageData['Insert']['Type'],
									| 'id'
									| 'title'
									| 'slug'
									| 'description'
									| 'authorId'
									| 'updatedAt'
									| 'publishedAt'
									| 'categories'
									| 'tags'
									| 'contributorIds'
									| 'augments'
								>),
							},
							{ ...contentData } as tsPageContentSelect
						);

						yield* notifier
							.sendEditorNotification('new_page', data.title)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for new page' })
								)
							);

						return {
							message: `Page created successfully with id: ${dataId}`,
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						ParseError: () =>
							new RestAPIError({ error: 'Failed to parse page data during creation' }),
					})
				)
			)
			.handle(
				'deletePage',
				Effect.fn(
					function* ({ path: { id }, payload: { slug } }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const existingPage = yield* sdk.GET.page.byId(id);

						if (!existingPage) {
							return yield* new RestAPIError({ error: 'Page not found' });
						}

						if (!slug || existingPage.slug !== slug) {
							return yield* new RestAPIError({
								error: 'Slug is required and must match the existing page slug for deletion',
							});
						}

						yield* sdk.DELETE.page(id);
						yield* sdk.CLEAR.page.byId(id);

						yield* notifier
							.sendEditorNotification('page_deleted', existingPage.title)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for page deletion' })
								)
							);

						return {
							message: 'Page deleted successfully',
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						...sharedPageCollectionErrors,
					})
				)
			)
			.handle(
				'updatePage',
				Effect.fn(
					function* ({ path: { id }, payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const { data, content } = payload;

						if (!data) {
							return yield* new RestAPIError({ error: 'Page data is required' });
						}

						if (!content) {
							return yield* new RestAPIError({ error: 'Page content is required' });
						}

						if (!data.id) {
							return yield* new RestAPIError({ error: 'Page ID is required in page data' });
						}

						if (data.id && data.id !== id) {
							return yield* new RestAPIError({
								error: "ID in payload does not match ID in path, ID's must match to update.",
							});
						}

						const existingPage = yield* sdk.GET.page.byId(id);

						if (!existingPage) {
							return yield* new RestAPIError({ error: 'Page not found' });
						}

						const { authorId, contributorIds, defaultContent } = existingPage;

						let AuthorId = authorId;

						if (!authorId) {
							AuthorId = user.userId;
						}

						const ContributorIds = contributorIds || [];

						if (!ContributorIds.includes(user.userId)) {
							ContributorIds.push(user.userId);
						}

						const newData: tsPageData['Insert']['Type'] = {
							...(data as tsPageDataSelect),
							authorId: AuthorId,
							contributorIds: yield* encodeStringArray(ContributorIds),
							updatedAt: new Date().toISOString(),
							publishedAt:
								existingPage.draft && data.draft === false
									? new Date().toISOString()
									: existingPage.publishedAt?.toISOString() || new Date().toISOString(),
							categories: yield* encodeStringArray(data.categories || []),
							tags: yield* encodeStringArray(data.tags || []),
							augments: yield* encodeStringArray(data.augments || []),
						};

						const getMetaData = sdk.dbService.withCodec({
							encoder: Schema.String,
							decoder: StudioCMSPageData.Select,
							callbackFn: (query, input) =>
								query((db) =>
									db
										.selectFrom('StudioCMSPageData')
										.selectAll()
										.where('id', '=', input)
										.executeTakeFirstOrThrow()
								),
						});

						const startMetaData = yield* getMetaData(data.id);

						yield* sdk.UPDATE.page.byId(data.id, {
							pageData: newData,
							pageContent: content as tsPageContentSelect,
						});

						const updatedMetaData = yield* getMetaData(data.id);

						const siteConfig = yield* sdk.GET.siteConfig();

						if (!siteConfig) {
							return yield* new RestAPIError({ error: 'Site configuration not found' });
						}

						const { enableDiffs, diffPerPage = 10 } = siteConfig.data;

						if (enableDiffs) {
							yield* sdk.diffTracking.insert(
								user.userId,
								data.id,
								{
									content: {
										start: defaultContent?.content || '',
										end: content.content || '',
									},
									metaData: {
										start: startMetaData,
										end: updatedMetaData,
									},
								},
								diffPerPage
							);
						}

						yield* sdk.CLEAR.page.byId(id);

						yield* notifier
							.sendEditorNotification('page_updated', newData.title)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for page update' })
								)
							);

						return {
							message: 'Page updated successfully',
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						...sharedPageCollectionErrors,
						ParsersError: () =>
							new RestAPIError({ error: 'Failed to parse page data during update' }),
						DiffError: () => new RestAPIError({ error: 'Failed to track changes for page update' }),
					})
				)
			)
			.handle(
				'getPages',
				Effect.fn(
					function* ({ urlParams: { author, draft, parentFolder, published, slug, title } }) {
						const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

						if (user.rank !== 'owner' && user.rank !== 'admin' && user.rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const allPages = yield* sdk.GET.pages(true);

						let filteredPages = allPages;

						if (author) {
							filteredPages = filteredPages.filter((page) => page.authorId === author);
						}
						if (typeof draft === 'boolean') {
							filteredPages = filteredPages.filter((page) => page.draft === draft);
						}
						if (parentFolder) {
							filteredPages = filteredPages.filter((page) => page.parentFolder === parentFolder);
						}
						if (typeof published === 'boolean') {
							filteredPages = filteredPages.filter((page) => !page.draft);
						}
						if (slug) {
							filteredPages = filteredPages.filter((page) => page.slug === slug);
						}
						if (title) {
							filteredPages = filteredPages.filter((page) => page.title.includes(title));
						}

						return filteredPages;
					},
					Effect.catchTags({
						...sharedDBErrors,
						...sharedPageCollectionErrors,
					})
				)
			)
			.handle(
				'getPage',
				Effect.fn(
					function* ({ path: { id } }) {
						const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

						if (user.rank !== 'owner' && user.rank !== 'admin' && user.rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const page = yield* sdk.GET.page.byId(id);

						if (!page) {
							return yield* new RestAPIError({ error: 'Page not found' });
						}

						return page;
					},
					Effect.catchTags({
						...sharedDBErrors,
						...sharedPageCollectionErrors,
					})
				)
			)
			.handle(
				'getPageHistory',
				Effect.fn(
					function* ({ path: { id }, urlParams: { limit: _limit } }) {
						const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

						if (user.rank !== 'owner' && user.rank !== 'admin' && user.rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const page = yield* sdk.GET.page.byId(id);

						if (!page) {
							return yield* new RestAPIError({ error: 'Page not found' });
						}

						const limit = _limit && _limit > 0 ? Math.min(_limit, 100) : undefined;

						const diffs = limit
							? yield* sdk.diffTracking.get.byPageId.latest(id, limit)
							: yield* sdk.diffTracking.get.byPageId.all(id);

						return diffs;
					},
					Effect.catchTags({
						...sharedDBErrors,
						...sharedPageCollectionErrors,
						ParsersError: () => new RestAPIError({ error: 'Failed to parse page history data' }),
					})
				)
			)
			.handle(
				'getPageHistoryEntry',
				Effect.fn(
					function* ({ path: { id, diffId } }) {
						const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

						if (user.rank !== 'owner' && user.rank !== 'admin' && user.rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const diff = yield* sdk.diffTracking.get.single(diffId);

						if (!diff) {
							return yield* new RestAPIError({ error: 'Diff entry not found' });
						}

						if (diff.pageId !== id) {
							return yield* new RestAPIError({
								error: 'Diff entry does not belong to the specified page',
							});
						}

						return diff;
					},
					Effect.catchTags({
						...sharedDBErrors,
						ParsersError: () => new RestAPIError({ error: 'Failed to parse diff data' }),
					})
				)
			)

			// Settings Endpoints
			.handle(
				'getSettings',
				Effect.fn(
					function* () {
						const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

						if (user.rank !== 'owner') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const siteConfig = yield* sdk.GET.siteConfig();

						if (!siteConfig) {
							return yield* new RestAPIError({ error: 'Site configuration not found' });
						}

						return siteConfig;
					},
					Effect.catchTags({
						...sharedDBErrors,
						UnknownException: () =>
							new RestAPIError({
								error: 'An unknown error occurred while retrieving site configuration',
							}),
					})
				)
			)
			.handle(
				'updateSettings',
				Effect.fn(function* ({ payload }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					if (user.rank !== 'owner') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					if (!payload.title || payload.title.trim() === '') {
						return yield* new RestAPIError({ error: 'Invalid form data, title is required' });
					}

					if (!payload.description || payload.description.trim() === '') {
						return yield* new RestAPIError({
							error: 'Invalid form data, description is required',
						});
					}

					if (!payload.loginPageBackground || payload.loginPageBackground.trim() === '') {
						return yield* new RestAPIError({
							error: 'Invalid form data, loginPageBackground is required',
						});
					}

					if (
						payload.loginPageBackground === 'custom' &&
						(!payload.loginPageCustomImage || payload.loginPageCustomImage.trim() === '')
					) {
						return yield* new RestAPIError({
							error:
								'Invalid form data, loginPageCustomImage is required when loginPageBackground is set to custom',
						});
					}

					yield* sdk.UPDATE.siteConfig(payload);

					return {
						message: 'Site configuration updated successfully',
					};
				}, Effect.catchTags(sharedDBErrors))
			)

			// Tag Endpoints
			.handle(
				'createTag',
				Effect.fn(
					function* ({ payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const newId = yield* sdk.UTIL.Generators.generateRandomIDNumber(9).pipe(
							Effect.catchAll(
								() =>
									new RestAPIError({
										error: 'Failed to generate unique ID for new tag',
									})
							)
						);

						const newTag = {
							id: newId,
							...payload,
						};

						yield* sdk.POST.databaseEntry.tags(newTag);

						yield* notifier
							.sendEditorNotification('new_tag', newTag.name)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for new tag' })
								)
							);

						const inserted = yield* sdk.GET.tags.byId(newId);

						if (!inserted) {
							return yield* new RestAPIError({ error: 'Failed to retrieve newly created tag' });
						}

						return inserted;
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						GeneratorError: () =>
							new RestAPIError({ error: 'Failed to generate unique ID for new tag' }),
					})
				)
			)
			.handle(
				'deleteTag',
				Effect.fn(
					function* ({ path: { id } }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const getPageList = sdk.GET.pages(true, true);

						const flattenAndCount = <T extends { id: number }>(arrays: T[][]): boolean => {
							return arrays.flat().filter((data) => data.id === id).length > 0;
						};

						const checkForChildrenPagesTags = () =>
							getPageList.pipe(
								Effect.map((data) => data.map(({ tags }) => tags)),
								Effect.map(flattenAndCount)
							);

						const existingTag = yield* sdk.GET.tags.byId(id);

						if (!existingTag) {
							return yield* new RestAPIError({ error: 'Tag not found' });
						}

						const hasChildrenPages = yield* checkForChildrenPagesTags();

						if (hasChildrenPages) {
							return yield* new RestAPIError({ error: 'Cannot delete tag assigned to pages' });
						}

						yield* sdk.DELETE.tags(id);

						yield* notifier
							.sendEditorNotification('delete_tag', existingTag.name)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for tag deletion' })
								)
							);

						return { success: true };
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						...sharedPageCollectionErrors,
					})
				)
			)
			.handle(
				'updateTag',
				Effect.fn(
					function* ({ path: { id }, payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const updateTag = sdk.dbService.withCodec({
							encoder: Schema.partial(StudioCMSPageDataTags.Select),
							decoder: StudioCMSPageDataTags.Select,
							callbackFn: (db, data) =>
								db((client) =>
									client.transaction().execute(async (trx) => {
										await trx
											.updateTable('StudioCMSPageDataTags')
											.set(data)
											.where('id', '=', id)
											.executeTakeFirstOrThrow();

										return await trx
											.selectFrom('StudioCMSPageDataTags')
											.selectAll()
											.where('id', '=', id)
											.executeTakeFirstOrThrow();
									})
								),
						});

						if (payload.id && payload.id !== id) {
							return yield* new RestAPIError({
								error: "ID in payload does not match ID in path, ID's must match to update.",
							});
						}

						const data = yield* updateTag(payload);
						yield* notifier
							.sendEditorNotification('update_tag', data.name)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for tag update' })
								)
							);

						return data;
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
			.handle(
				'getTags',
				Effect.fn(function* ({ urlParams: { name } }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					if (user.rank !== 'owner' && user.rank !== 'admin' && user.rank !== 'editor') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					let tags = yield* sdk.GET.tags.getAll();

					if (name) {
						tags = tags.filter((tag) => tag.name.includes(name));
					}

					return tags;
				}, Effect.catchTags(sharedDBErrors))
			)
			.handle(
				'getTag',
				Effect.fn(function* ({ path: { id } }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					if (user.rank !== 'owner' && user.rank !== 'admin' && user.rank !== 'editor') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					const tag = yield* sdk.GET.tags.byId(id);

					if (!tag) {
						return yield* new RestAPIError({ error: 'Tag not found' });
					}

					return tag;
				}, Effect.catchTags(sharedDBErrors))
			)

			// User Endpoints
			.handle(
				'createUser',
				Effect.fn(
					function* ({ payload: { username, password, email, displayname, rank: newUserRank } }) {
						const [sdk, user, userUtils, passwordUtils, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							User,
							Password,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						if (!username || !email || !displayname || !newUserRank) {
							return yield* new RestAPIError({
								error: 'Missing required fields: username, email, displayname',
							});
						}

						if (newUserRank === 'owner' && rank !== 'owner') {
							return yield* new RestAPIError({
								error: 'Unauthorized to create user with owner rank',
							});
						}

						if (!password) {
							password = yield* sdk.UTIL.Generators.generateRandomPassword(12);
						}

						if (rank === 'admin' && newUserRank === 'owner') {
							return yield* new RestAPIError({
								error: 'Unauthorized to create user with owner rank',
							});
						}

						const checkEmail = isValidEmail(email);

						if (!checkEmail.success) {
							return yield* new RestAPIError({
								error: `Invalid email format: ${checkEmail.error.message}`,
							});
						}

						const [
							verifyUsernameResponse,
							verifyPasswordResponse,
							{ usernameSearch, emailSearch },
						] = yield* Effect.all([
							userUtils.verifyUsernameInput(username),
							passwordUtils.verifyPasswordStrength(password),
							sdk.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data),
						]);

						if (verifyUsernameResponse !== true) {
							return yield* new RestAPIError({ error: verifyUsernameResponse });
						}

						if (verifyPasswordResponse !== true) {
							return yield* new RestAPIError({ error: verifyPasswordResponse });
						}

						if (usernameSearch.length > 0) {
							return yield* new RestAPIError({ error: 'Username already exists' });
						}
						if (emailSearch.length > 0) {
							return yield* new RestAPIError({ error: 'Email already exists' });
						}

						// Create a new user
						const newUser = yield* userUtils.createLocalUser(
							displayname,
							username,
							checkEmail.data,
							password
						);
						yield* sdk.UPDATE.permissions({
							user: newUser.id,
							rank: newUserRank,
						});
						yield* notifier
							.sendAdminNotification('new_user', newUser.username)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for new user' })
								)
							);

						return APISafeUserFields.make({
							username,
							email: checkEmail.data,
							name: displayname,
							createdAt: newUser.createdAt,
							updatedAt: newUser.updatedAt,
							avatar: newUser.avatar,
							url: newUser.url,
							id: newUser.id,
						});
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
			.handle(
				'deleteUser',
				Effect.fn(
					function* ({ path: { id } }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						if (user.userId === id) {
							return yield* new RestAPIError({ error: 'Users cannot delete themselves' });
						}

						const existingUser = yield* sdk.GET.users.byId(id);

						if (!existingUser) {
							return yield* new RestAPIError({ error: 'User not found' });
						}

						const { permissionsData } = existingUser;

						const existingUserRank = permissionsData?.rank ?? 'unknown';
						const existingUserRankIndex = permissionLevels.indexOf(existingUserRank);
						const loggedInUserRankIndex = permissionLevels.indexOf(user.rank);

						if (loggedInUserRankIndex <= existingUserRankIndex) {
							return yield* new RestAPIError({
								error: 'Unauthorized to delete user with equal or higher rank',
							});
						}

						const response = yield* sdk.DELETE.user(id);

						if (!response) {
							return yield* new RestAPIError({ error: 'Failed to delete user' });
						}

						if (response.status === 'error') {
							return yield* new RestAPIError({
								error: response.message || 'Failed to delete user',
							});
						}

						yield* notifier
							.sendAdminNotification('user_deleted', existingUser.username)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for user deletion' })
								)
							);

						return {
							message: response.message || 'User deleted successfully',
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
			.handle(
				'updateUser',
				Effect.fn(
					function* ({ path: { id }, payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const existingUser = yield* sdk.GET.users.byId(id);

						if (!existingUser) {
							return yield* new RestAPIError({ error: 'User not found' });
						}

						const { permissionsData } = existingUser;

						const existingUserRank = permissionsData?.rank ?? 'unknown';
						const existingUserRankIndex = permissionLevels.indexOf(existingUserRank);
						const loggedInUserRankIndex = permissionLevels.indexOf(user.rank);

						if (loggedInUserRankIndex < existingUserRankIndex) {
							return yield* new RestAPIError({
								error: 'Unauthorized to update user with higher rank',
							});
						}

						if (payload.rank) {
							const payloadRankIndex = permissionLevels.indexOf(payload.rank);

							if (loggedInUserRankIndex <= payloadRankIndex) {
								return yield* new RestAPIError({
									error: 'Unauthorized to set user rank higher than your own',
								});
							}
						}

						const updatedRank = yield* sdk.UPDATE.permissions({
							user: id,
							rank: payload.rank,
						});

						if (!updatedRank) {
							return yield* new RestAPIError({ error: 'Failed to update user rank' });
						}

						const updatedUser = yield* sdk.GET.users.byId(id);

						if (!updatedUser) {
							return yield* new RestAPIError({ error: 'Failed to retrieve updated user data' });
						}

						yield* Effect.all([
							notifier.sendUserNotification('account_updated', updatedUser.id),
							notifier.sendAdminNotification('user_updated', updatedUser.username),
						]).pipe(
							Effect.catchAll(
								() => new RestAPIError({ error: 'Failed to send notification for user update' })
							)
						);

						return APISafeUserFields.make(updatedUser);
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
			.handle(
				'getUsers',
				Effect.fn(
					function* ({ urlParams: { name, rank, username } }) {
						const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

						if (user.rank !== 'owner' && user.rank !== 'admin') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const allUsers = yield* sdk.GET.users.all();

						let data = allUsers.map(
							({
								avatar,
								createdAt,
								email,
								id,
								name,
								permissionsData,
								updatedAt,
								url,
								username,
							}) => ({
								avatar,
								createdAt,
								email,
								id,
								name,
								rank: permissionsData?.rank ?? 'unknown',
								updatedAt,
								url,
								username,
							})
						);

						if (rank !== 'owner') {
							data = data.filter((user) => user.rank !== 'owner');
						}

						if (name) {
							data = data.filter((user) => user.name.toLowerCase().includes(name.toLowerCase()));
						}
						if (rank) {
							data = data.filter((user) => user.rank === rank);
						}
						if (username) {
							data = data.filter((user) =>
								user.username.toLowerCase().includes(username.toLowerCase())
							);
						}

						return data;
					},
					Effect.catchTags({
						...sharedDBErrors,
						NotFoundError: () => new RestAPIError({ error: 'No users found' }),
						QueryError: () => new RestAPIError({ error: 'Failed to query user data' }),
						QueryParseError: () => new RestAPIError({ error: 'Failed to parse user data' }),
					})
				)
			)
			.handle(
				'getUser',
				Effect.fn(
					function* ({ path: { id } }) {
						const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const existingUser = yield* sdk.GET.users.byId(id);

						if (!existingUser) {
							return yield* new RestAPIError({ error: 'User not found' });
						}

						const { avatar, createdAt, email, name, permissionsData, updatedAt, url, username } =
							existingUser;

						const existingUserRank = (permissionsData?.rank ??
							'visitor') as AvailablePermissionRanks;

						const data = {
							avatar,
							createdAt,
							email,
							id,
							name,
							rank: existingUserRank,
							updatedAt,
							url,
							username,
						};

						const existingUserRankIndex = permissionLevels.indexOf(existingUserRank);
						const loggedInUserRankIndex = permissionLevels.indexOf(user.rank);

						if (loggedInUserRankIndex < existingUserRankIndex) {
							return yield* new RestAPIError({
								error: 'Unauthorized to view user with higher rank',
							});
						}

						return data;
					},
					Effect.catchTags({
						...sharedDBErrors,
						QueryError: () => new RestAPIError({ error: 'Failed to query user data' }),
						QueryParseError: () => new RestAPIError({ error: 'Failed to parse user data' }),
						NotFoundError: () => new RestAPIError({ error: 'User not found' }),
					})
				)
			)
).pipe(Layer.provide(RestAPIAuthorizationLive));
