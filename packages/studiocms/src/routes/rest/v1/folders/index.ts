import studioCMS_SDK from 'studiocms:sdk';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../utils/simpleResponse.js';
import { verifyAuthToken } from '../../utils/auth-token.js';

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

	const folders = await studioCMS_SDK_Cache.GET.folderList();

	const searchParams = context.url.searchParams;

	const folderNameFilter = searchParams.get('name');
	const folderParentFilter = searchParams.get('parent');

	let filteredFolders = folders.data;

	if (folderNameFilter) {
		filteredFolders = filteredFolders.filter((folder) => folder.name.includes(folderNameFilter));
	}

	if (folderParentFilter) {
		filteredFolders = filteredFolders.filter((folder) => folder.parent === folderParentFilter);
	}

	const finalFolders = {
		data: filteredFolders,
		lastCacheUpdate: folders.lastCacheUpdate,
	};

	return new Response(JSON.stringify(finalFolders), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const POST: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
		return simpleResponse(401, 'Unauthorized');
	}

	const jsonData: FolderBase = await context.request.json();

	const { folderName, parentFolder } = jsonData;

	if (!folderName) {
		return simpleResponse(400, 'Invalid form data, folderName is required');
	}

	try {
		const newFolder = (
			await studioCMS_SDK.POST.databaseEntry.folder({
				name: folderName,
				parent: parentFolder || null,
				id: crypto.randomUUID(),
			})
		)[0];

		await studioCMS_SDK_Cache.UPDATE.folderList();
		await studioCMS_SDK_Cache.UPDATE.folderTree();

		return simpleResponse(200, `Folder created successfully with id: ${newFolder.id}`);
	} catch (error) {
		return simpleResponse(500, 'Failed to create folder');
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, POST',
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
