import { studioCMS_SDK_Cache } from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

type SearchItem = {
	id: string;
	name: string;
	slug?: string;
	type: 'folder' | 'page';
	isDraft?: boolean;
};

type SearchList = SearchItem[];

export const GET: APIRoute = async (ctx: APIContext) => {
	const { data: folderList } = await studioCMS_SDK_Cache.GET.folderList();
	const pageList = await studioCMS_SDK_Cache.GET.pages();

	const searchList: SearchList = [];

	for (const folder of folderList) {
		searchList.push({
			id: folder.id,
			name: folder.name,
			type: 'folder',
		});
	}

	for (const page of pageList) {
		searchList.push({
			id: page.data.id,
			name: page.data.title,
			slug: page.data.slug,
			isDraft: page.data.draft ?? false,
			type: 'page',
		});
	}

	return new Response(JSON.stringify(searchList), {
		headers: {
			'content-type': 'application/json',
		},
	});
};
