import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../../../lib/effects/index.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:pages:GET')(function* () {
			const sdk = yield* SDKCore;

			const pages = yield* sdk.GET.pages();

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
				filteredPages = filteredPages.filter(
					(page) => page.data.parentFolder === parentFolderFilter
				);
			}

			return new Response(JSON.stringify(filteredPages), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}).pipe(SDKCore.Provide)
	).catch((err) => {
		return apiResponseLogger(500, 'Failed to fetch pages data', err);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
			'Access-Control-Allow-Origin': '*',
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
			'Access-Control-Allow-Origin': '*',
		},
	});
};
