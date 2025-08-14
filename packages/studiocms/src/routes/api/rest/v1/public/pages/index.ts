import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../../../../effect.js';

export const { ALL, GET, OPTIONS } = createEffectAPIRoutes(
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
					filteredPages = filteredPages.filter((page) => page.data.title.includes(titleFilter));
				}

				if (slugFilter) {
					filteredPages = filteredPages.filter((page) => page.data.slug.includes(slugFilter));
				}

				if (authorFilter) {
					filteredPages = filteredPages.filter((page) => page.data.authorId === authorFilter);
				}

				if (parentFolderFilter) {
					filteredPages = filteredPages.filter(
						(page) => page.data.parentFolder === parentFolderFilter
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
);
