import { developerConfig } from 'studiocms:config';
import { Notifications } from 'studiocms:notifier';
import plugins from 'studiocms:plugins';
import { apiEndpoints } from 'studiocms:plugins/endpoints';
import { SDKCore } from 'studiocms:sdk';
import type {
	CombinedInsertContent,
	tsPageContentSelect,
	tsPageData,
	tsPageDataSelect,
} from 'studiocms:sdk/types';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { AstroAPIContext, CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { StudioCMSPageData, StudioCMSPageFolderStructure } from '@withstudiocms/sdk/tables';
import { Effect, Schema } from 'effect';
import type { PluginAPIRoute } from '#plugins';
import {
	encodeStringArray,
	sharedDBErrors,
	sharedNotifierErrors,
	sharedPageCollectionErrors,
} from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * API Endpoints types for plugins
 */
type ApiEndpoints = {
	onCreate?: PluginAPIRoute<'onCreate'> | null;
	onEdit?: PluginAPIRoute<'onEdit'> | null;
	onDelete?: PluginAPIRoute<'onDelete'> | null;
};

/**
 * Type definition for the page types provided by plugins. This includes the identifier, label, description, and any associated API endpoints for creating, editing, or deleting pages of that type. This type is used to structure the information about different page types that can be managed through the dashboard, allowing for dynamic handling of various content types based on the plugins installed in the system.
 */
type PageTypeOutput = {
	identifier: string;
	label: string;
	description?: string | undefined;
	pageContentComponent?: string | undefined;
	apiEndpoint?: string;
	apiEndpoints?: ApiEndpoints | undefined;
};

/**
 * Type definition for the API response when creating or updating page content. This type includes the necessary fields for the page content, such as the content ID, the associated page ID, the content itself, and the language of the content. This structured type ensures that the API responses for content creation and updates are consistent and can be properly handled by the frontend components that consume this API.
 */
type UpdatePageContent = Partial<tsPageContentSelect>;

/**
 * Type definition for the structure of the page data used in the dashboard API. This type includes all the relevant fields for a page, such as the title, slug, description, author ID, categories, tags, augments, contributor IDs, and timestamps for when the page was updated and published. This comprehensive type definition allows for strong typing and validation of page data when creating or updating pages through the dashboard API.
 */
const pageTypeOptions = plugins.flatMap(({ pageTypes }) => {
	const pageTypeOutput: PageTypeOutput[] = [];

	if (!pageTypes) return pageTypeOutput;

	for (const pageType of pageTypes) {
		pageTypeOutput.push({
			...pageType,
			apiEndpoints: apiEndpoints.find((endpoint) => endpoint.identifier === pageType.identifier),
		});
	}

	return pageTypeOutput;
});

/**
 * Utility function to retrieve the API endpoints for a given page type and action (create, edit, delete). This function takes the package identifier and the type of action as parameters and returns the corresponding API endpoint if it exists. This allows the content handlers to dynamically determine which API routes to call for different page types based on the plugins installed in the system, enabling extensibility and customization of content management through the dashboard API.
 */
function getPageTypeEndpoints<T extends 'onCreate' | 'onEdit' | 'onDelete'>(pkg: string, type: T) {
	const currentPageType = pageTypeOptions.find((pageType) => pageType.identifier === pkg);

	if (!currentPageType) return undefined;

	return currentPageType.apiEndpoints?.[type];
}

/**
 * Content Handlers for the Dashboard API - This group of handlers includes endpoints for managing content in the dashboard, such as creating, updating, and deleting folders and pages. Each handler checks if the Dashboard API is enabled, verifies user permissions, validates input data, and interacts with the SDK to perform the necessary actions. The handlers also include error handling to return appropriate error messages for various failure scenarios, such as unauthorized access, invalid input, or internal server errors. Additionally, notifications are sent for certain actions, such as when a new folder or page is created or updated.
 */
export const ContentHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'content',
	(handlers) =>
		handlers

			// Folder Handlers
			.handle(
				'createFolder',
				Effect.fn(
					function* ({ payload: { folderName, parentFolder } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						// Check if demo mode is enabled
						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData, notifier] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
						]);

						const isAuthorized = userData.userPermissionLevel.isAdmin;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						yield* Effect.all([
							sdk.POST.folder({
								id: crypto.randomUUID(),
								name: folderName,
								parent: parentFolder || null,
							}),
							sdk.UPDATE.folderList,
							sdk.UPDATE.folderTree,
							notifier
								.sendEditorNotification('new_folder', folderName)
								.pipe(
									Effect.catchAll(
										() => new DashboardAPIError({ error: 'Failed to send notification' })
									)
								),
						]);

						return { message: 'Folder created successfully' };
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						FolderTreeError: () => new DashboardAPIError({ error: 'Failed to update folder tree' }),
					})
				)
			)
			.handle(
				'updateFolder',
				Effect.fn(
					function* ({ payload: { id, folderName, parentFolder } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						// Check if demo mode is enabled
						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData, notifier] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
						]);

						const isAuthorized = userData.userPermissionLevel.isEditor;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						if (parentFolder && parentFolder === id) {
							return yield* new DashboardAPIError({ error: 'A folder cannot be its own parent' });
						}

						yield* Effect.all([
							sdk.UPDATE.folder({
								id,
								name: folderName,
								parent: parentFolder || null,
							}),
							sdk.UPDATE.folderList,
							sdk.UPDATE.folderTree,
							notifier
								.sendEditorNotification('folder_updated', folderName)
								.pipe(
									Effect.catchAll(
										() => new DashboardAPIError({ error: 'Failed to send notification' })
									)
								),
						]);

						return { message: 'Folder updated successfully' };
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						FolderTreeError: () => new DashboardAPIError({ error: 'Failed to update folder tree' }),
					})
				)
			)
			.handle(
				'deleteFolder',
				Effect.fn(
					function* ({ payload: { id } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						// Check if demo mode is enabled
						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData, notifier] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
						]);

						/**
						 * Check for child folders before deletion
						 */
						const checkForChildrenFolders = sdk.dbService.withCodec({
							encoder: Schema.String,
							decoder: Schema.Array(StudioCMSPageFolderStructure.Select),
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
							decoder: Schema.Array(StudioCMSPageData.Select),
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

						const isAuthorized = userData.userPermissionLevel.isAdmin;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						const existingFolder = yield* sdk.GET.folder(id);

						if (!existingFolder) {
							return yield* new DashboardAPIError({ error: 'Folder not found' });
						}

						const { hasChildren } = yield* checkForChildren(id);

						if (hasChildren) {
							return yield* new DashboardAPIError({
								error: 'Folder cannot be deleted because it has child folders or pages',
							});
						}

						yield* Effect.all([
							sdk.DELETE.folder(id),
							sdk.UPDATE.folderList,
							sdk.UPDATE.folderTree,
							notifier
								.sendEditorNotification('folder_deleted', existingFolder.name)
								.pipe(
									Effect.catchAll(
										() => new DashboardAPIError({ error: 'Failed to send notification' })
									)
								),
						]);

						return { message: 'Folder deleted successfully' };
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						FolderTreeError: () => new DashboardAPIError({ error: 'Failed to update folder tree' }),
					})
				)
			)

			// Page Handlers
			.handle(
				'createPage',
				Effect.fn(
					function* ({ payload }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						// Check if demo mode is enabled
						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData, notifier, ctx] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
							AstroAPIContext,
						]);

						const isAuthorized = userData.userPermissionLevel.isEditor;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						const content = {
							id: crypto.randomUUID(),
							content: '',
						} as UpdatePageContent;

						if (!payload.title) {
							return yield* new DashboardAPIError({ error: 'Title is required' });
						}

						const dataId = crypto.randomUUID();

						// biome-ignore lint/style/noNonNullAssertion: We know that payload.package will be provided in this context, as it's required for page creation and is validated at the API route level.
						const apiRoute = getPageTypeEndpoints(payload.package!, 'onCreate');

						const pageContent: CombinedInsertContent = {
							contentLang: 'default',
							content: content.content || '',
						};

						const {
							title,
							slug,
							description,
							categories,
							tags,
							augments,
							contributorIds,
							updatedAt: ___updatedAt,
							...rest
						} = payload;

						const safeRest = rest as unknown as Pick<tsPageDataSelect, keyof typeof rest>;

						const newData = yield* sdk.POST.page({
							pageData: {
								...safeRest,
								id: dataId,
								title,
								slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
								description: description || '',
								authorId: userData.user?.id || '',
								updatedAt: new Date().toISOString(),
								publishedAt: new Date().toISOString(),
								categories: yield* encodeStringArray(categories || []),
								tags: yield* encodeStringArray(tags || []),
								augments: yield* encodeStringArray(augments || []),
								contributorIds: yield* encodeStringArray(contributorIds || []),
								contentLang: 'default',
							},
							pageContent,
						});

						if (!newData) {
							return yield* new DashboardAPIError({ error: 'Failed to create page' });
						}

						if (apiRoute) {
							yield* Effect.tryPromise(() => apiRoute({ AstroCtx: ctx, pageData: newData })).pipe(
								Effect.catchAll((error) => {
									console.error('Error executing page type API route:', error);
									return new DashboardAPIError({ error: 'Failed to execute page type API route' });
								})
							);
						}

						yield* Effect.all([
							sdk.CLEAR.pages,
							notifier
								.sendEditorNotification('new_page', newData.title)
								.pipe(
									Effect.catchAll(
										() => new DashboardAPIError({ error: 'Failed to send notification' })
									)
								),
						]);

						return {
							message: 'Page created successfully',
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
					function* ({ payload }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						// Check if demo mode is enabled
						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData, notifier, ctx] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
							AstroAPIContext,
						]);

						const isAuthorized = userData.userPermissionLevel.isEditor;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						const { contentId, content: incomingContent, pluginFields, ...data } = payload;

						if (!data.id) {
							return yield* new DashboardAPIError({ error: 'Page ID is required for update' });
						}

						if (!contentId) {
							return yield* new DashboardAPIError({ error: 'Content ID is required for update' });
						}

						const content = {
							id: contentId,
							contentId: data.id,
							content: incomingContent,
							contentLang: 'default',
						};

						const currentPageData = yield* sdk.GET.page.byId(data.id);

						if (!currentPageData) {
							return yield* new DashboardAPIError({ error: 'Page not found' });
						}

						const { authorId, contributorIds, defaultContent } = currentPageData;

						let AuthorId = authorId;

						if (!authorId) {
							AuthorId = userData.user?.id || '';
						}

						const ContributorIds = contributorIds || [];

						// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
						if (!ContributorIds.includes(userData.user!.id)) {
							// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
							ContributorIds.push(userData.user!.id);
						}

						const newData: tsPageData['Update']['Type'] = {
							...(data as tsPageDataSelect),
							authorId: AuthorId,
							contributorIds: yield* encodeStringArray(ContributorIds),
							updatedAt: new Date().toISOString(),
							publishedAt:
								currentPageData.draft && data.draft === false
									? new Date().toISOString()
									: currentPageData.publishedAt?.toISOString() || new Date().toISOString(),
							categories: yield* encodeStringArray(data.categories || []),
							tags: yield* encodeStringArray(data.tags || []),
							augments: yield* encodeStringArray(data.augments || []),
							contentLang: 'default',
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

						// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
						const apiRoute = getPageTypeEndpoints(data.package!, 'onEdit');

						const updatedPage = yield* sdk.UPDATE.page.byId(data.id, {
							pageData: newData,
							pageContent: content,
						});

						if (!updatedPage) {
							return yield* new DashboardAPIError({ error: 'Failed to update page' });
						}

						const updatedMetaData = yield* getMetaData(data.id);

						const { enableDiffs, diffPerPage = 10 } = ctx.locals.StudioCMS.siteConfig.data;

						if (enableDiffs) {
							yield* sdk.diffTracking.insert(
								// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
								userData.user!.id,
								data.id,
								{
									content: {
										start: defaultContent?.content || '',
										end: content.content || '',
									},
									// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
									metaData: { start: startMetaData!, end: updatedMetaData! },
								},
								diffPerPage
							);
						}

						if (apiRoute) {
							yield* Effect.tryPromise(() =>
								apiRoute({ AstroCtx: ctx, pageData: updatedPage, pluginFields })
							);
						}

						yield* Effect.all([
							sdk.CLEAR.pages,
							notifier
								.sendEditorNotification('page_updated', data.title || startMetaData?.title || '')
								.pipe(
									Effect.catchAll(
										() => new DashboardAPIError({ error: 'Failed to send notification' })
									)
								),
						]);

						return {
							message: 'Page updated successfully',
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						...sharedPageCollectionErrors,
						ParseError: () =>
							new DashboardAPIError({ error: 'Failed to parse data during page update' }),
						DiffError: () =>
							new DashboardAPIError({
								error: 'Failed to track changes for diff during page update',
							}),
						ParsersError: () =>
							new DashboardAPIError({ error: 'Failed to parse data for diff during page update' }),
					})
				)
			)
			.handle(
				'deletePage',
				Effect.fn(
					function* ({ payload: { id, slug } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						// Check if demo mode is enabled
						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData, notifier, ctx] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
							AstroAPIContext,
						]);

						const isAuthorized = userData.userPermissionLevel.isAdmin;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						if (!slug) {
							return yield* new DashboardAPIError({ error: 'Slug is required for page deletion' });
						}

						const pageToDelete = yield* sdk.GET.page.byId(id);

						if (!pageToDelete) {
							return yield* new DashboardAPIError({ error: 'Page not found' });
						}

						if (pageToDelete.slug !== slug) {
							return yield* new DashboardAPIError({ error: 'Slug does not match the page record' });
						}

						const apiRoute = getPageTypeEndpoints(pageToDelete.package, 'onDelete');

						yield* sdk.DELETE.page(id);

						if (apiRoute) {
							yield* Effect.tryPromise(() => apiRoute({ AstroCtx: ctx, pageData: pageToDelete }));
						}

						yield* Effect.all([
							sdk.CLEAR.pages,
							notifier
								.sendEditorNotification('page_deleted', pageToDelete.title)
								.pipe(
									Effect.catchAll(
										() => new DashboardAPIError({ error: 'Failed to send notification' })
									)
								),
						]);

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

			// Diff Handlers
			.handle(
				'revertToDiff',
				Effect.fn(
					function* ({ payload: { id, type } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						// Check if demo mode is enabled
						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData, notifier] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
						]);

						const isAuthorized = userData.userPermissionLevel.isEditor;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						if (!id || !type) {
							return yield* new DashboardAPIError({ error: 'Invalid ID or Type' });
						}

						if (!['data', 'content', 'both'].includes(type)) {
							return yield* new DashboardAPIError({ error: 'Invalid Type' });
						}

						const data = yield* sdk.diffTracking.revertToDiff(id, type);

						yield* Effect.all([
							sdk.CLEAR.pages,
							notifier
								.sendEditorNotification('page_updated', data.pageMetaData.end.title || '')
								.pipe(
									Effect.catchAll(
										() => new DashboardAPIError({ error: 'Failed to send notification' })
									)
								),
						]);

						return { message: 'Page reverted successfully' };
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						DiffTrackingError: () => new DashboardAPIError({ error: 'Failed to revert to diff' }),
						ParsersError: () =>
							new DashboardAPIError({ error: 'Failed to parse data during diff revert' }),
						ParseError: () =>
							new DashboardAPIError({ error: 'Failed to parse data during diff revert' }),
					})
				)
			)
);
