import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect, Schema } from 'effect';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

export class FolderBase extends Schema.Class<FolderBase>('FolderBase')({
	folderName: Schema.String,
	parentFolder: Schema.Union(Schema.String, Schema.Null),
}) {}

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:folders:GET')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

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
		}).pipe(SDKCore.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to fetch folders', error);
	});

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:folders:POST')(function* () {
			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());
			const { folderName, parentFolder } = yield* Schema.decodeUnknown(FolderBase)(jsonData);

			if (!folderName) {
				return apiResponseLogger(400, 'Invalid form data, folderName is required');
			}

			const sdk = yield* SDKCore;
			const newFolder = yield* sdk.POST.databaseEntry.folder({
				name: folderName,
				parent: parentFolder || null,
				id: crypto.randomUUID(),
			});
			yield* sdk.UPDATE.folderList;
			yield* sdk.UPDATE.folderTree;
			yield* Notifications.sendEditorNotification('new_folder', folderName);
			return apiResponseLogger(200, `Folder created successfully with id: ${newFolder.id}`);
		}).pipe(SDKCore.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to create folder', error);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, POST',
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
