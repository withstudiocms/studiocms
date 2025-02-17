import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

export const GET: APIRoute = async (context: APIContext) => {
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
