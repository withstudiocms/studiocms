import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../../../../lib/endpointResponses.js';
import { verifyAuthTokenFromHeader } from '../../../../utils/auth-token.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:pages:[id]:history:[diffid]:GET')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id, diffid } = context.params;

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

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
