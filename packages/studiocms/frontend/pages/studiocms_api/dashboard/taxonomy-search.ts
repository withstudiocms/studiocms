import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '@withstudiocms/effect';
import {
	categoriesToTaxonomyNodes,
	tagsToTaxonomyNodes,
} from '#frontend/components/shared/taxonomy/shared.js';

export const { GET, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: () =>
			genLogger('studiocms/routes/api/dashboard/search-list.GET')(function* () {
				const sdk = yield* SDKCore;

				return yield* Effect.all([sdk.GET.categories.getAll(), sdk.GET.tags.getAll()]).pipe(
					Effect.map(([categories, tags]) => ({
						categories: categoriesToTaxonomyNodes(categories),
						tags: tagsToTaxonomyNodes(tags),
					})),
					Effect.map(({ categories, tags }) => {
						return [...categories, ...tags];
					}),
					Effect.map(createJsonResponse)
				);
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
				{
					status: 500,
				}
			);
		},
	}
);
