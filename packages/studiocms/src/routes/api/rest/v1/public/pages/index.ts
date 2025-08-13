import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	genLogger,
	OptionsResponse,
} from '../../../../../../effect.js';

export const GET: APIRoute = async (C) =>
	defineAPIRoute(C)((ctx) =>
		genLogger('studioCMS:rest:v1:public:pages:GET')(function* () {
			const sdk = yield* SDKCore;

			const pages = yield* sdk.GET.pages();

			const searchParams = ctx.url.searchParams;

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
		})
	).catch((err) => {
		return apiResponseLogger(500, 'Failed to fetch pages data', err);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
