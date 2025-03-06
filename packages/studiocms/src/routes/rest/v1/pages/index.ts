import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { tsPageContentSelect, tsPageDataSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { verifyAuthToken } from '../../utils/auth-token.js';

type UpdatePageData = Partial<tsPageDataSelect>;
type UpdatePageContent = Partial<tsPageContentSelect>;

interface CreatePageJson {
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
		return apiResponseLogger(401, 'Unauthorized');
	}

	const pages = await studioCMS_SDK_Cache.GET.pages(true);

	const searchParams = context.url.searchParams;

	const titleFilter = searchParams.get('title');
	const slugFilter = searchParams.get('slug');
	const authorFilter = searchParams.get('author');
	const draftFilter = searchParams.get('draft') === 'true';
	const publishedFilter = searchParams.get('published') === 'true';
	const parentFolderFilter = searchParams.get('parentFolder');

	let filteredPages = pages;

	if (titleFilter) {
		filteredPages = filteredPages.filter((page) => page.data.title.includes(titleFilter));
	}

	if (slugFilter) {
		filteredPages = filteredPages.filter((page) => page.data.slug.includes(slugFilter));
	}

	if (authorFilter) {
		filteredPages = filteredPages.filter((page) => page.data.authorId === authorFilter);
	}

	if (draftFilter) {
		filteredPages = filteredPages.filter((page) => page.data.draft === draftFilter);
	}

	if (publishedFilter) {
		filteredPages = filteredPages.filter((page) => !page.data.draft);
	}

	if (parentFolderFilter) {
		filteredPages = filteredPages.filter((page) => page.data.parentFolder === parentFolderFilter);
	}

	return new Response(JSON.stringify(filteredPages), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const POST: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank, userId } = user;

	if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const jsonData: CreatePageJson = await context.request.json();

	const { data, content } = jsonData;

	if (!data) {
		return apiResponseLogger(400, 'Invalid form data, data is required');
	}

	if (!content) {
		return apiResponseLogger(400, 'Invalid form data, content is required');
	}

	if (!data.title) {
		return apiResponseLogger(400, 'Invalid form data, title is required');
	}

	const dataId = crypto.randomUUID();
	const contentId = crypto.randomUUID();

	try {
		await studioCMS_SDK.POST.databaseEntry.pages(
			{
				id: dataId,
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				title: data.title!,
				slug: data.slug || data.title.toLowerCase().replace(/\s/g, '-'),
				description: data.description || '',
				authorId: userId || null,
				...data,
			},
			{ id: contentId, ...content }
		);

		return apiResponseLogger(200, `Page created successfully with id: ${dataId}`);
	} catch (error) {
		return apiResponseLogger(500, 'Internal Server Error');
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, POST',
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
