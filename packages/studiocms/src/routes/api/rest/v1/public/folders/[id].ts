import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	genLogger,
	OptionsResponse,
} from '../../../../../../effect.js';

export const GET: APIRoute = async (context: APIContext) =>
	defineAPIRoute(context)((ctx) =>
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

			return new Response(JSON.stringify(folder), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		})
	).catch((err) => {
		return apiResponseLogger(500, 'Failed to fetch folder data', err);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
