import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '@withstudiocms/effect';
import type { EndpointRoute } from '../../../../../../../utils/rest-router.js';

export const pagesRouter: EndpointRoute = {
	__idType: 'string',
	__index: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studioCMS:rest:v1:public:pages:GET')(function* () {
					const sdk = yield* SDKCore;

					const pages = yield* sdk.GET.pages();

					const searchParams = ctx.url.searchParams;

					const titleFilter = searchParams.get('title');
					const slugFilter = searchParams.get('slug');
					const authorFilter = searchParams.get('author');
					const parentFolderFilter = searchParams.get('parentFolder');

					let filteredPages = pages;

					if (titleFilter) {
						filteredPages = filteredPages.filter((page) => page.title.includes(titleFilter));
					}

					if (slugFilter) {
						filteredPages = filteredPages.filter((page) => page.slug.includes(slugFilter));
					}

					if (authorFilter) {
						filteredPages = filteredPages.filter((page) => page.authorId === authorFilter);
					}

					if (parentFolderFilter) {
						filteredPages = filteredPages.filter(
							(page) => page.parentFolder === parentFolderFilter
						);
					}

					return createJsonResponse(filteredPages);
				}),
			OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
			ALL: () => Effect.try(() => AllResponse()),
		},
		{
			cors: { methods: ['GET', 'OPTIONS'] },
			onError: (error) => {
				console.error('API Error:', error);
				return createJsonResponse(
					{ error: 'Internal Server Error' },
					{ status: 500, statusText: 'Internal Server Error' }
				);
			},
		}
	),
	id: (id: string) =>
		createEffectAPIRoutes(
			{
				GET: () =>
					genLogger('studioCMS:rest:v1:public:pages:[id]:GET')(function* () {
						const sdk = yield* SDKCore;

						if (!id) {
							return apiResponseLogger(400, 'Invalid page ID');
						}

						const page = yield* sdk.GET.page.byId(id);

						if (!page) {
							return apiResponseLogger(404, 'Page not found');
						}

						if (page.draft) {
							return apiResponseLogger(404, 'Page not found');
						}

						return createJsonResponse(page);
					}),
				OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
				ALL: () => Effect.try(() => AllResponse()),
			},
			{
				cors: { methods: ['GET', 'OPTIONS'] },
				onError: (error) => {
					console.error('API Error:', error);
					return createJsonResponse(
						{ error: 'Internal Server Error' },
						{ status: 500, statusText: 'Internal Server Error' }
					);
				},
			}
		),
};
