import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../../../lib/endpointResponses.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:pages:[id]:GET')(function* () {
			const sdk = yield* SDKCore;

			const { id } = context.params;

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

			return new Response(JSON.stringify(page), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}).pipe(SDKCore.Provide)
	).catch((err) => {
		return apiResponseLogger(500, 'Failed to fetch page data', err);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
