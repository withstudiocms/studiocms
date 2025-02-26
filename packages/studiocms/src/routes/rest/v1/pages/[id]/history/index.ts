import studioCMS_SDK from 'studiocms:sdk';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../../../utils/simpleResponse.js';
import { verifyAuthToken } from '../../../../utils/auth-token.js';

export const GET: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
		return simpleResponse(401, 'Unauthorized');
	}

	const { id } = context.params;

	if (!id) {
		return simpleResponse(400, 'Invalid page ID');
	}

	const page = await studioCMS_SDK_Cache.GET.page.byId(id);

	if (!page) {
		return simpleResponse(404, 'Page not found');
	}

	const searchParams = context.url.searchParams;

	const limit = searchParams.get('limit');

	let diffs: {
		id: string;
		userId: string;
		pageId: string;
		timestamp: Date | null;
		pageMetaData: unknown;
		pageContentStart: string;
		diff: string | null;
	}[] = [];

	if (limit) {
		diffs = await studioCMS_SDK.diffTracking.get.byPageId.latest(id, Number.parseInt(limit));
	} else {
		diffs = await studioCMS_SDK.diffTracking.get.byPageId.all(id);
	}

	return new Response(JSON.stringify(diffs), {
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
