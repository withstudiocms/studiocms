import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '@withstudiocms/effect';
import type { EndpointRoute } from '../../../../../../../utils/rest-router.js';

export const foldersRouter: EndpointRoute = {
	__idType: 'string',
	__index: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studioCMS:rest:v1:public:folders:GET')(function* () {
					const sdk = yield* SDKCore;

					const folders = yield* sdk.GET.folderList();

					const searchParams = ctx.url.searchParams;

					const folderNameFilter = searchParams.get('name');
					const folderParentFilter = searchParams.get('parent');

					let filteredFolders = folders;

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

					return createJsonResponse(filteredFolders);
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
	),
	id: (id: string) =>
		createEffectAPIRoutes(
			{
				GET: () =>
					genLogger('studioCMS:rest:v1:public:folders:[id]:GET')(function* () {
						const sdk = yield* SDKCore;

						if (!id) {
							return apiResponseLogger(400, 'Invalid folder ID');
						}

						const folder = yield* sdk.GET.folder(id);

						if (!folder) {
							return apiResponseLogger(404, 'Folder not found');
						}

						return createJsonResponse(folder);
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
		),
};
