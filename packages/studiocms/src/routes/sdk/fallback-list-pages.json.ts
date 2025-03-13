import studioCMS_SDK from 'studiocms:sdk/cache';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (): Promise<Response> => {
	const pages = await studioCMS_SDK.GET.pages();

	const lastUpdated = new Date().toUTCString();

	return new Response(
		JSON.stringify({ lastUpdated, pages: pages.map((pageItem) => pageItem.data) }, null, 2),
		{
			headers: {
				'Content-Type': 'application/json',
				'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
				'Cache-Control': 'public, max-age=604800, immutable',
				Date: lastUpdated,
			},
		}
	);
};
