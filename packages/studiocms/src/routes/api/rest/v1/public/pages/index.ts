import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../../../lib/endpointResponses.js';

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

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
