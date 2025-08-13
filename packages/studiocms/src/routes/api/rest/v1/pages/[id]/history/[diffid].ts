import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	genLogger,
	OptionsResponse,
} from '../../../../../../../effect.js';
import { verifyAuthTokenFromHeader } from '../../../../utils/auth-token.js';

export const GET: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
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

			return new Response(JSON.stringify(diff), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		})
	).catch((error) => {
		return apiResponseLogger(500, 'Internal Server Error', error);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
