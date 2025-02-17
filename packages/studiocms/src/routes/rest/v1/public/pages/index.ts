import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

export const GET: APIRoute = async (context: APIContext) => {
	const pages = await studioCMS_SDK_Cache.GET.pages();

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

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
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
