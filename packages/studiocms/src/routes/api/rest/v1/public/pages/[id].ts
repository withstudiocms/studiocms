import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	genLogger,
	OptionsResponse,
} from '../../../../../../effect.js';

export const GET: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
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

			return new Response(JSON.stringify(page), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		})
	).catch((err) => {
		return apiResponseLogger(500, 'Failed to fetch page data', err);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
