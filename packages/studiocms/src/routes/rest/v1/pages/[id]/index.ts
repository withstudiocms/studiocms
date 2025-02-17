import studioCMS_SDK from 'studiocms:sdk';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { tsPageContentSelect, tsPageDataSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../../utils/simpleResponse.js';
import { verifyAuthToken } from '../../../utils/auth-token.js';

type UpdatePageData = Partial<tsPageDataSelect>;
type UpdatePageContent = Partial<tsPageContentSelect>;

interface UpdatePageJson {
	pageId: string;
	data?: UpdatePageData;
	content?: UpdatePageContent;
}

export const GET: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
		return simpleResponse(401, 'Unauthorized');
	}

	const { id } = context.params;

	if (!id) {
		return simpleResponse(400, 'Invalid page ID');
	}

	const page = await studioCMS_SDK_Cache.GET.page.byId(id);

	if (!page) {
		return simpleResponse(404, 'Page not found');
	}

	return new Response(JSON.stringify(page), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const PATCH: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank, userId } = user;

	if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
		return simpleResponse(401, 'Unauthorized');
	}

	const { id } = context.params;

	if (!id) {
		return simpleResponse(400, 'Invalid page ID');
	}

	const jsonData: UpdatePageJson = await context.request.json();

	const { data, content } = jsonData;

	if (!data) {
		return simpleResponse(400, 'Invalid form data, data is required');
	}

	if (!content) {
		return simpleResponse(400, 'Invalid form data, content is required');
	}

	if (!data.id) {
		return simpleResponse(400, 'Invalid form data, id is required');
	}

	if (!content.id) {
		return simpleResponse(400, 'Invalid form data, id is required');
	}

	const currentPageData = await studioCMS_SDK_Cache.GET.page.byId(id);

	if (!currentPageData) {
		return simpleResponse(404, 'Page not found');
	}

	const { authorId, contributorIds } = currentPageData.data;

	let AuthorId = authorId;

	if (!authorId) {
		AuthorId = userId || null;
	}

	const ContributorIds = contributorIds || [];

	if (!ContributorIds.includes(userId)) {
		ContributorIds.push(userId);
	}

	data.authorId = AuthorId;
	data.contributorIds = JSON.stringify(ContributorIds);
	data.updatedAt = new Date();

	const startMetaData = (await studioCMS_SDK.GET.databaseTable.pageData()).find(
		(metaData) => metaData.id === data.id
	);

	const {
		data: { defaultContent },
	} = await studioCMS_SDK_Cache.GET.page.byId(data.id);

	try {
		await studioCMS_SDK_Cache.UPDATE.page.byId(data.id, {
			pageData: data as tsPageDataSelect,
			pageContent: content as tsPageContentSelect,
		});

		const updatedMetaData = (await studioCMS_SDK.GET.databaseTable.pageData()).find(
			(metaData) => metaData.id === data.id
		);

		const { enableDiffs, diffPerPage } = (await studioCMS_SDK_Cache.GET.siteConfig()).data;

		if (enableDiffs) {
			await studioCMS_SDK.diffTracking.insert(
				userId,
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

		studioCMS_SDK_Cache.CLEAR.page.byId(id);

		return simpleResponse(200, 'Page updated successfully');
	} catch (error) {
		console.error(error);
		return simpleResponse(500, 'Failed to update page');
	}
};

export const DELETE: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin') {
		return simpleResponse(401, 'Unauthorized');
	}

	const { id } = context.params;

	if (!id) {
		return simpleResponse(400, 'Invalid page ID');
	}

	const jsonData = await context.request.json();

	const { slug } = jsonData;

	if (!slug) {
		return simpleResponse(400, 'Invalid request');
	}

	const isHomePage = await studioCMS_SDK_Cache.GET.page.bySlug('index');

	if (isHomePage.data && isHomePage.data.id === id) {
		return simpleResponse(400, 'Cannot delete home page');
	}

	try {
		await studioCMS_SDK.DELETE.page(id);
		studioCMS_SDK_Cache.CLEAR.page.byId(id);

		return simpleResponse(200, 'Page deleted successfully');
	} catch (error) {
		return simpleResponse(500, 'Failed to delete page');
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, PATCH, DELETE',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
