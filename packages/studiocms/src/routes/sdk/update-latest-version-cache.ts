import logger, { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (): Promise<Response> => {
	logger.info('Updating latest version cache');
	const latestVersion = await studioCMS_SDK_Cache.UPDATE.latestVersion().catch((err) => {
		return apiResponseLogger(500, 'Failed to update latest version cache ', err);
	});
	logger.info('Latest version cache updated');
	return new Response(JSON.stringify({ success: true, latestVersion }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
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
