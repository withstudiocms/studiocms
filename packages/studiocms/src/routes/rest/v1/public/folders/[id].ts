import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../../utils/simpleResponse.js';

export const GET: APIRoute = async (context: APIContext) => {
	const { id } = context.params;

	if (!id) {
		return simpleResponse(400, 'Invalid folder ID');
	}

	const folder = await studioCMS_SDK_Cache.GET.folder(id);

	if (!folder) {
		return simpleResponse(404, 'Folder not found');
	}

	return new Response(JSON.stringify(folder), {
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
