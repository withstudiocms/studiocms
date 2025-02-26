import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (): Promise<Response> => {
	const pages = await studioCMS_SDK_Cache.GET.pages();

	// last updated date
	const lastUpdated = new Date().toISOString();

	return new Response(JSON.stringify({ lastUpdated, pages }, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
			Date: lastUpdated,
		},
	});
};

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
