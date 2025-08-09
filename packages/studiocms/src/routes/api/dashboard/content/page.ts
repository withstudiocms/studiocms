import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import plugins from 'studiocms:plugins';
import { apiEndpoints } from 'studiocms:plugins/endpoints';
import { SDKCore } from 'studiocms:sdk';
import type { tsPageContentSelect, tsPageDataSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses';
import type { CombinedInsertContent } from '../../../../sdk/types/index.js';
import { tryCatch } from '../../../../utils/tryCatch.js';

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

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/content/page.POST')(function* () {
			const sdk = yield* SDKCore;
			const notify = yield* Notifications;

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isEditor;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const formData = yield* Effect.tryPromise(() => context.request.formData());

			const data: UpdatePageData = {
				title: formData.get('page-title')?.toString(),
				slug: formData.get('page-slug')?.toString(),
				description: formData.get('page-description')?.toString(),
				package: formData.get('page-type')?.toString(),
				showOnNav: formData.get('show-in-nav')?.toString() === 'true',
				heroImage: formData.get('page-hero-image')?.toString(),
				parentFolder: getParentFolderValue(formData.get('parent-folder')?.toString()),
				showAuthor: formData.get('show-author')?.toString() === 'true',
				showContributors: formData.get('show-contributors')?.toString() === 'true',
				draft: formData.get('draft')?.toString() === 'true',
				categories: [],
				tags: [],
			};

			const content = {
				id: crypto.randomUUID(),
				// content is no longer supported during page creation due to current editor setup
				// look into options in the future for how we can do this correctly.
				// Requires being able to swap in editors which currently does not work.
				content: '',
			} as UpdatePageContent;

			if (!data.title) {
				return apiResponseLogger(400, 'Invalid form data, data is required');
			}

			if (!content) {
				return apiResponseLogger(400, 'Invalid form data, content is required');
			}

			const dataId = crypto.randomUUID();

			if (!data.title) {
				return apiResponseLogger(400, 'Invalid form data, title is required');
			}

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
					...data,
				},
				pageContent: pageContent,
			});

			if (apiRoute) {
				yield* Effect.tryPromise(() => tryCatch(apiRoute(context)));
			}

			yield* sdk.CLEAR.pages();

			yield* notify.sendEditorNotification('new_page', data.title);

			return apiResponseLogger(200, 'Page created successfully');
		}).pipe(Notifications.Provide)
	);

export const PATCH: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/content/page.PATCH')(function* () {
			const sdk = yield* SDKCore;
			const notify = yield* Notifications;

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isEditor;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const formData = yield* Effect.tryPromise(() => context.request.formData());

			const data: Partial<tsPageDataSelect> = {
				title: formData.get('page-title')?.toString(),
				slug: formData.get('page-slug')?.toString(),
				description: formData.get('page-description')?.toString(),
				package: formData.get('page-type')?.toString(),
				showOnNav: formData.get('show-in-nav') === 'true',
				heroImage: formData.get('page-hero-image')?.toString(),
				parentFolder: getParentFolderValue(formData.get('parent-folder')?.toString()),
				showAuthor: formData.get('show-author') === 'true',
				showContributors: formData.get('show-contributors')?.toString() === 'true',
				categories: [],
				tags: [],
				id: formData.get('page-id')?.toString(),
				draft: formData.get('draft')?.toString() === 'true',
			};

			const content = {
				id: formData.get('page-content-id')?.toString(),
				content: formData.get('page-content')?.toString(),
			};

			if (!data) {
				return apiResponseLogger(400, 'Invalid form data, data is required');
			}

			if (!content) {
				return apiResponseLogger(400, 'Invalid form data, content is required');
			}

			if (!data.id) {
				return apiResponseLogger(400, 'Invalid form data, id is required');
			}

			if (!content.id) {
				return apiResponseLogger(400, 'Invalid form data, id is required');
			}

			const currentPageData = yield* sdk.GET.page.byId(data.id);

			if (!currentPageData.data) {
				return apiResponseLogger(404, 'Page not found');
			}

			const { authorId, contributorIds } = currentPageData.data;

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

			const {
				data: { defaultContent },
			} = yield* sdk.GET.page.byId(data.id);

			// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
			const apiRoute = getPageTypeEndpoints(data.package!, 'onEdit');

			yield* sdk.UPDATE.page.byId(data.id, {
				pageData: data as tsPageDataSelect,
				pageContent: content as tsPageContentSelect,
			});

			const updatedMetaData = (yield* sdk.GET.databaseTable.pageData()).find(
				(metaData) => metaData.id === data.id
			);

			const { enableDiffs, diffPerPage = 10 } = context.locals.siteConfig.data;

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
				yield* Effect.tryPromise(() => tryCatch(apiRoute(context)));
			}

			yield* notify.sendEditorNotification(
				'page_updated',
				data.title || startMetaData?.title || ''
			);

			return apiResponseLogger(200, 'Page updated successfully');
		}).pipe(Notifications.Provide)
	);

export const DELETE: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/content/page.DELETE')(function* () {
			const sdk = yield* SDKCore;
			const notify = yield* Notifications;

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isAdmin;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());

			const { id, slug } = jsonData;

			if (!id) {
				return apiResponseLogger(400, 'Invalid request');
			}

			if (!slug) {
				return apiResponseLogger(400, 'Invalid request');
			}

			const pageToDelete = yield* sdk.GET.page.byId(id);

			const apiRoute = getPageTypeEndpoints(pageToDelete.data.package, 'onDelete');

			yield* sdk.DELETE.page(id);

			if (apiRoute) {
				yield* Effect.tryPromise(() => tryCatch(apiRoute(context)));
			}

			yield* notify.sendEditorNotification('page_deleted', pageToDelete.data.title);

			return apiResponseLogger(200, 'Page deleted successfully');
		}).pipe(Notifications.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST', 'PATCH', 'DELETE']);

export const ALL: APIRoute = async () => AllResponse();
