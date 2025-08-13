import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import { AllResponse, defineAPIRoute, genLogger, OptionsResponse } from '../../../effect.js';

const commonHeaders = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
};

const createErrorResponse = (message: string, status = 500) =>
	new Response(JSON.stringify({ success: false, error: message }), {
		status,
		headers: {
			...commonHeaders,
			Date: new Date().toUTCString(),
		},
	});

export const GET: APIRoute = async (c) =>
	defineAPIRoute(c)(() =>
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
		})
	).catch((error) => {
		return createErrorResponse(`Error fetching pages: ${error.message}`);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
