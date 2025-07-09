import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';

type SearchItem = {
	id: string;
	name: string;
	slug?: string;
	type: 'folder' | 'page';
	isDraft?: boolean;
};

type SearchList = SearchItem[];

export const GET: APIRoute = async () =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/search-list.GET')(function* () {
			const sdk = yield* SDKCore;

			const { data: folderList } = yield* sdk.GET.folderList();
			const pageList = yield* sdk.GET.pages();

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
		}).pipe(SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
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
			'Access-Control-Allow-Origin': '*',
		},
	});
};
