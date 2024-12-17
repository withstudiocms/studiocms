import studioCMS_SDK from 'studiocms:sdk';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (): Promise<Response> => {
	const pages = await studioCMS_SDK.GET.database.pages();

	return new Response(JSON.stringify({ lastUpdated: new Date().toISOString(), pages }, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};
