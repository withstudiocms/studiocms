import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../../../lib/effects/index.js';
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
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Internal Server Error', error);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
