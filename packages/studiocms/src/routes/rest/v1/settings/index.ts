import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { tsSiteConfigSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { verifyAuthToken } from '../../utils/auth-token.js';

export const GET: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner') {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const siteConfig = await studioCMS_SDK_Cache.GET.siteConfig();

	return new Response(JSON.stringify(siteConfig), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const PATCH: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner') {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const siteConfig: Omit<tsSiteConfigSelect, 'id'> = await context.request.json();

	if (!siteConfig.title) {
		return apiResponseLogger(400, 'Invalid form data, title is required');
	}

	if (!siteConfig.description) {
		return apiResponseLogger(400, 'Invalid form data, description is required');
	}

	if (!siteConfig.loginPageBackground) {
		return apiResponseLogger(400, 'Invalid form data, loginPageBackground is required');
	}

	if (siteConfig.loginPageBackground === 'custom' && !siteConfig.loginPageCustomImage) {
		return apiResponseLogger(400, 'Invalid form data, loginPageCustomImage is required');
	}

	try {
		await studioCMS_SDK_Cache.UPDATE.siteConfig(siteConfig);

		return apiResponseLogger(200, 'Site config updated');
	} catch (error) {
		return apiResponseLogger(500, 'Error updating site config', error);
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, PATCH',
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
