import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';

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
						'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
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
					'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
					Date: new Date().toUTCString(),
				},
			}
		);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
	});
};
