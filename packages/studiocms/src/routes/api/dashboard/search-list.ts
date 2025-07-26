import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

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
		})
	).catch((error) => {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'content-type': 'application/json' },
		});
	});

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
