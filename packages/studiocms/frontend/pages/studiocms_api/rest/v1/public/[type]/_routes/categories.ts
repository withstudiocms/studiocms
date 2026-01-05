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

export const categoriesRouter: EndpointRoute = {
	__idType: 'number',
	__index: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studiocms:rest:v1:public:categories:GET')(function* () {
					const sdk = yield* SDKCore;

					const searchParams = ctx.url.searchParams;
					const folderNameFilter = searchParams.get('name');
					const folderParentFilter = searchParams.get('parent');

					let categories = yield* sdk.GET.categories.getAll();

					if (folderNameFilter) {
						categories = categories.filter((category) => category.name.includes(folderNameFilter));
					}

					if (folderParentFilter) {
						categories = categories.filter(
							(category) => category.parent === Number.parseInt(folderParentFilter, 10)
						);
					}

					return createJsonResponse(categories);
				}),
			OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
			ALL: () => Effect.try(() => AllResponse()),
		},
		{
			cors: { methods: ['GET', 'OPTIONS'] },
			onError: (error) => {
				console.error('API Error:', error);
				return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
			},
		}
	),
	id: (id: number) =>
		createEffectAPIRoutes(
			{
				GET: () =>
					genLogger(`studiocms:rest:v1:public:categories:${id}:GET`)(function* () {
						const sdk = yield* SDKCore;
						const category = yield* sdk.GET.categories.byId(id);

						if (!category) {
							return createJsonResponse({ error: 'Category not found' }, { status: 404 });
						}

						return createJsonResponse(category);
					}),
				OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
				ALL: () => Effect.try(() => AllResponse()),
			},
			{
				cors: { methods: ['GET', 'OPTIONS'] },
				onError: (error) => {
					console.error('API Error:', error);
					return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
				},
			}
		),
};
