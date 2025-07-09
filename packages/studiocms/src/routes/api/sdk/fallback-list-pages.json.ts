import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const GET: APIRoute = async (): Promise<Response> =>
	await convertToVanilla(
		genLogger('routes/sdk/fallback-list-pages.json/GET')(function* () {
			const sdk = yield* SDKCore;
			const pages = yield* sdk.GET.pages();
			const lastUpdated = new Date().toISOString();

			return new Response(
				JSON.stringify({ lastUpdated, pages: pages.map((pageItem) => pageItem.data) }, null, 2),
				{
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Cache-Control': 'public, max-age=604800, immutable',
						Date: new Date(lastUpdated).toUTCString(),
					},
				}
			);
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		return new Response(
			JSON.stringify({ success: false, error: `Error fetching pages: ${error.message}` }),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					Date: new Date().toUTCString(),
				},
			}
		);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
