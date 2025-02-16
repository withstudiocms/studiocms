import studioCMS_SDK from 'studiocms:sdk';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../utils/simpleResponse.js';
import { verifyAuthToken } from '../utils/auth-token.js';

interface FolderBase {
	folderName: string;
	parentFolder: string | null;
}

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

export const PATCH: APIRoute = async (context: APIContext) => {
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
		return simpleResponse(400, 'Invalid folder ID');
	}

	const jsonData: FolderBase = await context.request.json();

	const { folderName, parentFolder } = jsonData;

	if (!folderName) {
		return simpleResponse(400, 'Invalid form data, folderName is required');
	}

	try {
		await studioCMS_SDK_Cache.UPDATE.folder({
			id,
			name: folderName,
			parent: parentFolder || null,
		});

		return simpleResponse(200, 'Folder updated successfully');
	} catch (error) {
		return simpleResponse(500, 'Failed to update folder');
	}
};

export const DELETE: APIRoute = async (context: APIContext) => {
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
		return simpleResponse(400, 'Invalid folder ID');
	}

	try {
		await studioCMS_SDK.DELETE.folder(id);

		await studioCMS_SDK_Cache.UPDATE.folderList();
		await studioCMS_SDK_Cache.UPDATE.folderTree();

		return simpleResponse(200, 'Folder deleted successfully');
	} catch (error) {
		return simpleResponse(500, 'Failed to delete folder');
	}
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
