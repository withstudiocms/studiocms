import studioCMS_SDK from 'studiocms:sdk';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (): Promise<Response> => {
	const pages = await studioCMS_SDK.GET.database.pages();

	return new Response(JSON.stringify(pages), {
		headers: {
			'Content-Type': 'application/json',
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
