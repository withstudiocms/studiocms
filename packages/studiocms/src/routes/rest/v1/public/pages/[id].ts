import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../../utils/simpleResponse.js';

export const GET: APIRoute = async (context: APIContext) => {
	const { id } = context.params;

	if (!id) {
		return simpleResponse(400, 'Invalid page ID');
	}

	const page = await studioCMS_SDK_Cache.GET.page.byId(id);

	if (!page) {
		return simpleResponse(404, 'Page not found');
	}

	if (page.data.draft) {
		return simpleResponse(403, 'Unauthorized');
	}

	return new Response(JSON.stringify(page), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, PATCH, DELETE',
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
