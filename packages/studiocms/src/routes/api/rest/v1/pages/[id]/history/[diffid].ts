import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../../../../../effect.js';
import { verifyAuthTokenFromHeader } from '../../../../utils/auth-token.js';

export const { GET, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studioCMS:rest:v1:pages:[id]:history:[diffid]:GET')(function* () {
				const sdk = yield* SDKCore;

				const user = yield* verifyAuthTokenFromHeader(ctx);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const { id, diffid } = ctx.params;

				if (!id) {
					return apiResponseLogger(400, 'Invalid page ID');
				}

				if (!diffid) {
					return apiResponseLogger(400, 'Invalid diff ID');
				}

				const diff = yield* sdk.diffTracking.get.single(diffid);

				if (!diff) {
					return apiResponseLogger(404, 'Diff not found');
				}

				return createJsonResponse(diff);
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
