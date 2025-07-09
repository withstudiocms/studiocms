import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../../../lib/endpointResponses.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:folders:GET')(function* () {
			const sdk = yield* SDKCore;

			const folders = yield* sdk.GET.folderList();

			const searchParams = context.url.searchParams;

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
		}).pipe(SDKCore.Provide)
	).catch((err) => {
		return apiResponseLogger(500, 'Failed to fetch folder data', err);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
