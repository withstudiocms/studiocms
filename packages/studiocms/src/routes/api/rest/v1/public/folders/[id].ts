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
			genLogger('studioCMS:rest:v1:public:folders:[id]:GET')(function* () {
				const sdk = yield* SDKCore;
				const { id } = ctx.params;

				if (!id) {
					return apiResponseLogger(400, 'Invalid folder ID');
				}

				const folder = yield* sdk.GET.folder(id);

				if (!folder) {
					return apiResponseLogger(404, 'Folder not found');
				}

				return createJsonResponse(folder);
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
