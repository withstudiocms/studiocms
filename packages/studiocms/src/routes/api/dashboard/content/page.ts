import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import plugins from 'studiocms:plugins';
import { apiEndpoints } from 'studiocms:plugins/endpoints';
import { SDKCore } from 'studiocms:sdk';
import type {
	CombinedInsertContent,
	tsPageContentSelect,
	tsPageDataSelect,
} from 'studiocms:sdk/types';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../../effect.js';
import type { PluginAPIRoute } from '../../../../plugins.js';

type ApiEndpoints = {
	onCreate?: PluginAPIRoute<'onCreate'> | null;
	onEdit?: PluginAPIRoute<'onEdit'> | null;
	onDelete?: PluginAPIRoute<'onDelete'> | null;
};

type PageTypeOutput = {
	identifier: string;
	label: string;
	description?: string | undefined;
	pageContentComponent?: string | undefined;
	apiEndpoint?: string;
	apiEndpoints?: ApiEndpoints | undefined;
};

type UpdatePageData = Partial<tsPageDataSelect>;
type UpdatePageContent = Partial<tsPageContentSelect>;

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

function getPageTypeEndpoints<T extends 'onCreate' | 'onEdit' | 'onDelete'>(pkg: string, type: T) {
	const currentPageType = pageTypeOptions.find((pageType) => pageType.identifier === pkg);

	if (!currentPageType) return undefined;

	return currentPageType.apiEndpoints?.[type];
}

export const { POST, PATCH, DELETE, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/content/page.POST')(function* () {
				const [sdk, notify] = yield* Effect.all([SDKCore, Notifications]);

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isEditor;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const data = yield* readAPIContextJson<UpdatePageData & { augments?: string[] }>(ctx);

				const content = {
					id: crypto.randomUUID(),
					// content is no longer supported during page creation due to current editor setup
					// look into options in the future for how we can do this correctly.
					// Requires being able to swap in editors which currently does not work.
					content: '',
				} as UpdatePageContent;

				if (!data.title) {
					return apiResponseLogger(400, 'Invalid form data, title is required');
				}

				const dataId = crypto.randomUUID();

				// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
				const apiRoute = getPageTypeEndpoints(data.package!, 'onCreate');

				const pageContent: CombinedInsertContent = {
					contentLang: 'default',
					content: content.content || '',
				};

				const newData = yield* sdk.POST.page({
					pageData: {
						id: dataId,
						// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
						title: data.title!,
						slug: data.slug || data.title.toLowerCase().replace(/\s/g, '-'),
						description: data.description || '',
						authorId: userData.user?.id || null,
						updatedAt: new Date(),
						categories: [],
						tags: [],
						augments: data.augments || [],
						...data,
					},
					pageContent: pageContent,
				});

				if (!newData) {
					return apiResponseLogger(500, 'Failed to create page');
				}

				if (apiRoute) {
					yield* Effect.tryPromise(() => apiRoute({ AstroCtx: ctx, pageData: newData }));
				}

				yield* Effect.all([
					sdk.CLEAR.pages(),
					notify.sendEditorNotification('new_page', data.title),
				]);

				return apiResponseLogger(200, 'Page created successfully');
			}).pipe(Notifications.Provide),
		PATCH: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/content/page.PATCH')(function* () {
				const [sdk, notify] = yield* Effect.all([SDKCore, Notifications]);

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isEditor;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const combinedData = yield* readAPIContextJson<
					UpdatePageData & {
						contentId: string;
						content: string;
						pluginFields: Record<string, FormDataEntryValue | null>;
						augments?: string[];
					}
				>(ctx);

				const { contentId, content: incomingContent, pluginFields, ...data } = combinedData;

				const content = {
					id: contentId,
					content: incomingContent,
				};

				if (!data.id) {
					return apiResponseLogger(400, 'Invalid form data, id is required');
				}

				if (!content.id) {
					return apiResponseLogger(400, 'Invalid form data, contentId is required');
				}

				const currentPageData = yield* sdk.GET.page.byId(data.id);

				if (!currentPageData) {
					return apiResponseLogger(404, 'Page not found');
				}

				const { authorId, contributorIds, defaultContent } = currentPageData.data;

				let AuthorId = authorId;

				if (!authorId) {
					AuthorId = userData.user?.id || null;
				}

				const ContributorIds = contributorIds || [];

				// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
				if (!ContributorIds.includes(userData.user!.id)) {
					// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
					ContributorIds.push(userData.user!.id);
				}

				data.authorId = AuthorId;
				data.contributorIds = ContributorIds;
				data.updatedAt = new Date();

				const startMetaData = (yield* sdk.GET.databaseTable.pageData()).find(
					(metaData) => metaData.id === data.id
				);

				// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
				const apiRoute = getPageTypeEndpoints(data.package!, 'onEdit');

				const updatedPage = yield* sdk.UPDATE.page.byId(data.id, {
					pageData: data as tsPageDataSelect,
					pageContent: content as tsPageContentSelect,
				});

				if (!updatedPage) {
					return apiResponseLogger(500, 'Failed to update page');
				}

				const updatedMetaData = (yield* sdk.GET.databaseTable.pageData()).find(
					(metaData) => metaData.id === data.id
				);

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
					sdk.CLEAR.pages(),
					notify.sendEditorNotification('page_updated', data.title || startMetaData?.title || ''),
				]);

				return apiResponseLogger(200, 'Page updated successfully');
			}).pipe(Notifications.Provide),
		DELETE: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/content/page.DELETE')(function* () {
				const [sdk, notify] = yield* Effect.all([SDKCore, Notifications]);

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const { id, slug } = yield* readAPIContextJson<{ id: string; slug?: string }>(ctx);

				const pageToDelete = yield* sdk.GET.page.byId(id);

				if (!pageToDelete) {
					return apiResponseLogger(404, 'Page not found');
				}
				if (pageToDelete.data.slug !== slug) {
					return apiResponseLogger(400, 'Invalid request');
				}

				const apiRoute = getPageTypeEndpoints(pageToDelete.data.package, 'onDelete');

				yield* sdk.DELETE.page(id);

				if (apiRoute) {
					yield* Effect.tryPromise(() => apiRoute({ AstroCtx: ctx, pageData: pageToDelete }));
				}

				yield* Effect.all([
					sdk.CLEAR.pages(),
					notify.sendEditorNotification('page_deleted', pageToDelete.data.title),
				]);

				return apiResponseLogger(200, 'Page deleted successfully');
			}).pipe(Notifications.Provide),
		OPTIONS: () =>
			Effect.try(() => OptionsResponse({ allowedMethods: ['POST', 'PATCH', 'DELETE'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'PATCH', 'DELETE', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
