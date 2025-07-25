import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../../../../lib/endpointResponses.js';
import { verifyAuthTokenFromHeader } from '../../../../utils/auth-token.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:pages:[id]:history:GET')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = context.params;

			if (!id) {
				return apiResponseLogger(400, 'Invalid page ID');
			}

			const page = yield* sdk.GET.page.byId(id);

			if (!page) {
				return apiResponseLogger(404, 'Page not found');
			}

			const searchParams = context.url.searchParams;

			const limit = searchParams.get('limit');

			let diffs: {
				id: string;
				userId: string;
				pageId: string;
				timestamp: Date | null;
				pageMetaData: unknown;
				pageContentStart: string;
				diff: string | null;
			}[] = [];

			if (limit) {
				diffs = yield* sdk.diffTracking.get.byPageId.latest(id, Number.parseInt(limit));
			} else {
				diffs = yield* sdk.diffTracking.get.byPageId.all(id);
			}

			return new Response(JSON.stringify(diffs), {
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
