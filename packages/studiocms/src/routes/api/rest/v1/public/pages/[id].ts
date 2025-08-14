import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../../../../effect.js';

export const { GET, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studioCMS:rest:v1:public:pages:[id]:GET')(function* () {
				const sdk = yield* SDKCore;

				const { id } = ctx.params;

				if (!id) {
					return apiResponseLogger(400, 'Invalid page ID');
				}

				const page = yield* sdk.GET.page.byId(id);

				if (!page) {
					return apiResponseLogger(404, 'Page not found');
				}

				if (page.data.draft) {
					return apiResponseLogger(403, 'Unauthorized');
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
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
