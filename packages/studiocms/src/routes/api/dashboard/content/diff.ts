import { apiResponseLogger } from 'studiocms:logger';
import { sendEditorNotification } from 'studiocms:notifier';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

export const POST: APIRoute = async (context: APIContext) => {
	// Get user data
	const userData = context.locals.userSessionData;

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = context.locals.userPermissionLevel.isEditor;
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	const jsonData: { id: string; type: 'data' | 'content' | 'both' } = await context.request.json();

	const { id, type } = jsonData;

	if (!id || !type) {
		return apiResponseLogger(400, 'Invalid ID or Type');
	}

	try {
		const data = await studioCMS_SDK_Cache.diffTracking.revertToDiff(id, type);

		studioCMS_SDK_Cache.CLEAR.pages();

		await sendEditorNotification('page_updated', data.pageMetaData.end.title || '');

		return apiResponseLogger(200, 'Page Reverted successfully');
	} catch (error) {
		return apiResponseLogger(500, 'failed to revert page', error);
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST',
			'Access-Control-Allow-Origin': '*',
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
