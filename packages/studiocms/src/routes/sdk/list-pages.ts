import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../lib/effects/index.js';

const commonHeaders = {
	'Content-Type': 'application/json',
	'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
};

const createErrorResponse = (message: string, status = 500) =>
	new Response(JSON.stringify({ success: false, error: message }), {
		status,
		headers: {
			...commonHeaders,
			Date: new Date().toUTCString(),
		},
	});

export const GET: APIRoute = async (): Promise<Response> =>
	await convertToVanilla(
		genLogger('routes/sdk/list-pages/GET')(function* () {
			const sdk = yield* SDKCore;
			const pages = yield* sdk.GET.pages();

			const lastUpdated = new Date().toISOString();

			return new Response(JSON.stringify({ lastUpdated, pages }, null, 2), {
				headers: {
					...commonHeaders,
					Date: lastUpdated,
				},
			});
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		return createErrorResponse(`Error fetching pages: ${error.message}`);
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
