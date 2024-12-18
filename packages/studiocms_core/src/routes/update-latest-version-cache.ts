import { logger } from '@it-astro:logger:studiocms-dashboard';
import { StudioCMSRoutes } from 'studiocms:lib';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	await studioCMS_SDK_Cache.UPDATE.latestVersion();

	logger.info('Manually updated latest version cache');

	const originLink = context.request.headers.get('Referer');

	if (originLink) {
		return context.redirect(originLink);
	}

	return context.redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
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
