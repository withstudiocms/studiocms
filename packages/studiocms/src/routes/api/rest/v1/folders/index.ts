import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
	Schema,
} from '../../../../../effect.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

export class FolderBase extends Schema.Class<FolderBase>('FolderBase')({
	folderName: Schema.String,
	parentFolder: Schema.Union(Schema.String, Schema.Null),
}) {}

export const GET: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studioCMS:rest:v1:folders:GET')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(ctx);

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
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to fetch folders', error);
	});

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studioCMS:rest:v1:folders:POST')(function* () {
			const notifier = yield* Notifications;
			const user = yield* verifyAuthTokenFromHeader(ctx);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const jsonData = yield* Effect.tryPromise(() => ctx.request.json());
			const { folderName, parentFolder } = yield* Schema.decodeUnknown(FolderBase)(jsonData);

			const sdk = yield* SDKCore;
			const newFolder = yield* sdk.POST.databaseEntry.folder({
				name: folderName,
				parent: parentFolder || null,
				id: crypto.randomUUID(),
			});
			yield* sdk.UPDATE.folderList;
			yield* sdk.UPDATE.folderTree;
			yield* notifier.sendEditorNotification('new_folder', folderName);
			return apiResponseLogger(200, `Folder created successfully with id: ${newFolder.id}`);
		}).pipe(Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to create folder', error);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET', 'POST'] });

export const ALL: APIRoute = async () => AllResponse();
