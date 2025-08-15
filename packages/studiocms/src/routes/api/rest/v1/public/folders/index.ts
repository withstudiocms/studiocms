import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../../../../effect.js';

export const { GET, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
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
					filteredFolders = filteredFolders.filter(
						(folder) => folder.parent === folderParentFilter
					);
				}

				const finalFolders = {
					data: filteredFolders,
					lastCacheUpdate: folders.lastCacheUpdate,
				};

				return createJsonResponse(finalFolders);
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
