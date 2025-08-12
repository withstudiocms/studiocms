import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	genLogger,
	OptionsResponse,
} from '../../../../../../effect.js';

export const GET: APIRoute = async (context: APIContext) =>
	defineAPIRoute(context)((ctx) =>
		genLogger('studioCMS:rest:v1:public:folders:GET')(function* () {
			const sdk = yield* SDKCore;

			const folders = yield* sdk.GET.folderList();

			const searchParams = ctx.url.searchParams;

			const folderNameFilter = searchParams.get('name');
			const folderParentFilter = searchParams.get('parent');

			let filteredFolders = folders.data;

			if (folderNameFilter) {
				filteredFolders = filteredFolders.filter((folder) =>
					folder.name.includes(folderNameFilter)
				);
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
		})
	).catch((err) => {
		return apiResponseLogger(500, 'Failed to fetch folder data', err);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
