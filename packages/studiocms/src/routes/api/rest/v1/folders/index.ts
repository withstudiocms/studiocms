import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	parseAPIContextJson,
	Schema,
} from '../../../../../effect.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

export class FolderBase extends Schema.Class<FolderBase>('FolderBase')({
	folderName: Schema.String,
	parentFolder: Schema.Union(Schema.String, Schema.Null),
}) {}

export const { GET, POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studioCMS:rest:v1:folders:GET')(function* () {
				const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

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
		POST: (ctx) =>
			genLogger('studioCMS:rest:v1:folders:POST')(function* () {
				const [notifier, user, sdk] = yield* Effect.all([
					Notifications,
					verifyAuthTokenFromHeader(ctx),
					SDKCore,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const { folderName, parentFolder } = yield* parseAPIContextJson(ctx, FolderBase);

				const newFolder = yield* sdk.POST.databaseEntry.folder({
					name: folderName,
					parent: parentFolder || null,
					id: crypto.randomUUID(),
				});

				yield* Effect.all([
					sdk.UPDATE.folderList,
					sdk.UPDATE.folderTree,
					notifier.sendEditorNotification('new_folder', folderName),
				]);
				return apiResponseLogger(200, `Folder created successfully with id: ${newFolder.id}`);
			}).pipe(Notifications.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
