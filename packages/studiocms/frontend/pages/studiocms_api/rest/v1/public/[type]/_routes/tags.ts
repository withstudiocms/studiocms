import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '@withstudiocms/effect';
import type { EndpointRoute } from '../../../../utils/rest-router.js';

export const tagsRouter: EndpointRoute = {
	__idType: 'number',
	__index: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studiocms:rest:v1:public:tags:GET')(function* () {
					const sdk = yield* SDKCore;

					const searchParams = ctx.url.searchParams;
					const folderNameFilter = searchParams.get('name');

					let tags = yield* sdk.GET.tags.getAll();

					if (folderNameFilter) {
						tags = tags.filter((tag) => tag.name.includes(folderNameFilter));
					}

					return createJsonResponse(tags);
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
					genLogger(`studiocms:rest:v1:public:tags:${id}:GET`)(function* () {
						const sdk = yield* SDKCore;
						const tag = yield* sdk.GET.tags.byId(id);

						if (!tag) {
							return createJsonResponse({ error: 'Tag not found' }, { status: 404 });
						}

						return createJsonResponse(tag);
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
