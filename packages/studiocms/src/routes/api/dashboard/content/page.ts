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
import type { APIRoute } from 'astro';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextFormData,
	readAPIContextJson,
} from '../../../../effect.js';

type ApiEndpoints = {
	onCreate?: APIRoute | null;
	onEdit?: APIRoute | null;
	onDelete?: APIRoute | null;
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

function getPageTypeEndpoints(pkg: string, type: 'onCreate' | 'onEdit' | 'onDelete') {
	const currentPageType = pageTypeOptions.find((pageType) => pageType.identifier === pkg);

	if (!currentPageType) return undefined;

	return currentPageType.apiEndpoints?.[type];
}

function getParentFolderValue(value?: string) {
	if (value === 'null') return null;
	return value;
}

function isValidString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== '';
}

function validString(field: FormDataEntryValue | null): string | undefined {
	if (!isValidString(field)) {
		return undefined;
	}
	return field.toString();
}

function validateStringField(field: FormDataEntryValue | null, fieldName: string): string {
	if (!isValidString(field)) {
		throw new Error(`Invalid form data, ${fieldName} is required`);
	}
	return field.toString();
}

function validateSlugField(field: FormDataEntryValue | null, fieldName: string): string {
	const slug = validateStringField(field, fieldName);

	/**
	 * Regex breakdown:
	 *
	 * ^[a-z0-9]+        : starts with one or more lowercase letters or numbers
	 *
	 * (?:-[a-z0-9]+)*  : followed by zero or more groups of a hyphen and one
	 *                    or more lowercase letters or numbers
	 *
	 * $                : end of the string
	 *
	 * This ensures the slug is lowercase and only contains letters, numbers,
	 * and hyphens, without consecutive hyphens or leading/trailing hyphens.
	 */
	const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

	if (!slugRegex.test(slug)) {
		throw new Error(
			`Invalid form data, ${fieldName} must be lowercase and can only contain letters, numbers, and hyphens`
		);
	}

	return slug;
}

function buildPageDataObject(
	formData: FormData,
	pageId?: string
): UpdatePageData | { error: string } {
	try {
        // TODO Fix validation logic. Move over to JSON and Effect validation
		const data: UpdatePageData = {
			title: validateStringField(formData.get('page-title'), 'title'),
			slug: validateSlugField(formData.get('page-slug'), 'slug'),
			description: validateStringField(formData.get('page-description'), 'description'),
			package: validateStringField(formData.get('page-type'), 'page type'),
			showOnNav: validateStringField(formData.get('show-in-nav'), 'show in nav') === 'true',
			heroImage: validString(formData.get('page-hero-image')),
			parentFolder: getParentFolderValue(formData.get('parent-folder')?.toString()),
			showAuthor: validString(formData.get('show-author')) === 'true',
			showContributors: validString(formData.get('show-contributors')) === 'true',
			draft: validString(formData.get('draft')) === 'true',
		};

		if (pageId) {
			data.id = pageId;
		}

		return data;
	} catch (error) {
		if (error instanceof Error) {
			return { error: error.message };
		}
		return { error: 'An unknown error occurred while validating form data' };
	}
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

				const formData = yield* readAPIContextFormData(ctx);

				const data = buildPageDataObject(formData);

				if ('error' in data) {
					return apiResponseLogger(400, data.error);
				}

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

				yield* sdk.POST.page({
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
						...data,
					},
					pageContent: pageContent,
				});

				if (apiRoute) {
					yield* Effect.tryPromise(() => Promise.resolve().then(() => apiRoute(ctx)));
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

				const formData = yield* readAPIContextFormData(ctx);

				const data = buildPageDataObject(formData, validString(formData.get('page-id')));

				if ('error' in data) {
					return apiResponseLogger(400, data.error);
				}

				const content = {
					id: validString(formData.get('page-content-id')),
					content: validString(formData.get('page-content')),
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

				yield* sdk.UPDATE.page.byId(data.id, {
					pageData: data as tsPageDataSelect,
					pageContent: content as tsPageContentSelect,
				});

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
					yield* Effect.tryPromise(() => Promise.resolve().then(() => apiRoute(ctx)));
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

				try {
					validateStringField(id, 'id');
					validateSlugField(slug ?? null, 'slug');
				} catch (err) {
					return apiResponseLogger(400, (err as Error).message);
				}

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
					yield* Effect.tryPromise(() => Promise.resolve().then(() => apiRoute(ctx)));
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
