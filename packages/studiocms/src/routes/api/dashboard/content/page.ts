import { apiResponseLogger } from 'studiocms:logger';
import { Notifications, sendEditorNotification } from 'studiocms:notifier';
import plugins from 'studiocms:plugins';
import { apiEndpoints } from 'studiocms:plugins/endpoints';
import { SDKCore } from 'studiocms:sdk';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { tsPageContentSelect, tsPageDataSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses';

const pageTypeOptions = plugins.flatMap(({ pageTypes }) => {
	const pageTypeOutput: {
		identifier: string;
		label: string;
		description?: string | undefined;
		pageContentComponent?: string | undefined;
		apiEndpoint?: string;
		apiEndpoints?:
			| {
					onCreate?: APIRoute | null;
					onEdit?: APIRoute | null;
					onDelete?: APIRoute | null;
			  }
			| undefined;
	}[] = [];

	if (!pageTypes) {
		return pageTypeOutput;
	}

	for (const pageType of pageTypes) {
		pageTypeOutput.push({
			...pageType,
			apiEndpoints: {
				...apiEndpoints.find((endpoint) => endpoint.identifier === pageType.identifier),
			},
		});
	}

	return pageTypeOutput;
});

function getPageTypeEndpoints(pkg: string, type: 'onCreate' | 'onEdit' | 'onDelete') {
	const currentPageType = pageTypeOptions.find((pageType) => pageType.identifier === pkg);

	if (!currentPageType) {
		return undefined;
	}

	return currentPageType.apiEndpoints?.[type];
}

type UpdatePageData = Partial<tsPageDataSelect>;
type UpdatePageContent = Partial<tsPageContentSelect>;

function getParentFolderValue(value?: string) {
	if (value === 'null') return null;
	return value;
}

export const POST: APIRoute = async (context: APIContext) => {
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

	const formData = await context.request.formData();

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
		content: formData.get('page-content')?.toString() ?? '',
	} as UpdatePageContent;

	if (!data) {
		return apiResponseLogger(400, 'Invalid form data, data is required');
	}

	if (!content) {
		return apiResponseLogger(400, 'Invalid form data, content is required');
	}

	const dataId = crypto.randomUUID();
	const contentId = crypto.randomUUID();

	if (!data.title) {
		return apiResponseLogger(400, 'Invalid form data, title is required');
	}

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const apiRoute = getPageTypeEndpoints(data.package!, 'onCreate');

	try {
		await studioCMS_SDK_Cache.POST.page({
			// @ts-expect-error
			pageData: {
				id: dataId,
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				title: data.title!,
				slug: data.slug || data.title.toLowerCase().replace(/\s/g, '-'),
				description: data.description || '',
				authorId: userData.user?.id || null,
				updatedAt: new Date(),
				...data,
			},
			// @ts-expect-error
			pageContent: { id: contentId, ...content },
		});

		if (apiRoute) {
			await apiRoute(context);
		}

		studioCMS_SDK_Cache.CLEAR.pages();

		await sendEditorNotification('new_page', data.title);

		return apiResponseLogger(200, 'Page created successfully');
	} catch (error) {
		return apiResponseLogger(500, 'Failed to create page');
	}
};

export const PATCH: APIRoute = async (context: APIContext) => {
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

	const formData = await context.request.formData();

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

	const currentPageData = await studioCMS_SDK_Cache.GET.page.byId(data.id);

	if (!currentPageData.data) {
		return apiResponseLogger(404, 'Page not found');
	}

	const { authorId, contributorIds } = currentPageData.data;

	let AuthorId = authorId;

	if (!authorId) {
		AuthorId = userData.user?.id || null;
	}

	const ContributorIds = contributorIds || [];

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	if (!ContributorIds.includes(userData.user!.id)) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		ContributorIds.push(userData.user!.id);
	}

	data.authorId = AuthorId;
	data.contributorIds = ContributorIds;
	data.updatedAt = new Date();

	const startMetaData = (await studioCMS_SDK_Cache.GET.databaseTable.pageData()).find(
		(metaData) => metaData.id === data.id
	);

	const {
		data: { defaultContent },
	} = await studioCMS_SDK_Cache.GET.page.byId(data.id);

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const apiRoute = getPageTypeEndpoints(data.package!, 'onEdit');

	try {
		await studioCMS_SDK_Cache.UPDATE.page.byId(data.id, {
			pageData: data as tsPageDataSelect,
			pageContent: content as tsPageContentSelect,
		});

		const updatedMetaData = (await studioCMS_SDK_Cache.GET.databaseTable.pageData()).find(
			(metaData) => metaData.id === data.id
		);

		const { enableDiffs, diffPerPage } = context.locals.siteConfig.data;

		if (enableDiffs) {
			await studioCMS_SDK_Cache.diffTracking.insert(
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				userData.user!.id,
				data.id,
				{
					content: {
						start: defaultContent?.content || '',
						end: content.content || '',
					},
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					metaData: { start: startMetaData!, end: updatedMetaData! },
				},
				diffPerPage
			);
		}

		if (apiRoute) {
			await apiRoute(context);
		}

		await sendEditorNotification('page_updated', data.title || startMetaData?.title || '');

		return apiResponseLogger(200, 'Page updated successfully');
	} catch (error) {
		return apiResponseLogger(500, 'Failed to update page');
	}
};

export const DELETE: APIRoute = async (context: APIContext) => {
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

	const jsonData = await context.request.json();

	const { id, slug } = jsonData;

	if (!id) {
		return apiResponseLogger(400, 'Invalid request');
	}

	if (!slug) {
		return apiResponseLogger(400, 'Invalid request');
	}

	const isHomePage = await studioCMS_SDK_Cache.GET.page.bySlug('index');

	if (isHomePage.data && isHomePage.data.id === id) {
		return apiResponseLogger(400, 'Cannot delete home page');
	}

	const pageToDelete = await studioCMS_SDK_Cache.GET.page.byId(id);

	const apiRoute = getPageTypeEndpoints(pageToDelete.data.package, 'onCreate');

	try {
		await studioCMS_SDK_Cache.DELETE.page(id);

		if (apiRoute) {
			await apiRoute(context);
		}

		await sendEditorNotification('page_deleted', pageToDelete.data.title);

		return apiResponseLogger(200, 'Page deleted successfully');
	} catch (error) {
		return apiResponseLogger(500, 'Failed to delete page');
	}
};

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST', 'PATCH', 'DELETE']);

export const ALL: APIRoute = async () => AllResponse();
