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
		genLogger('studioCMS:rest:v1:folders:[id]:GET')(function* () {
			const user = yield* verifyAuthTokenFromHeader(ctx);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = ctx.params;

			if (!id) {
				return apiResponseLogger(400, 'Invalid folder ID');
			}

			const sdk = yield* SDKCore;

			const folder = yield* sdk.GET.folder(id);

			if (!folder) {
				return apiResponseLogger(404, 'Folder not found');
			}

			return new Response(JSON.stringify(folder), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		})
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to fetch folder', error);
	});

export const PATCH: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studioCMS:rest:v1:folders:[id]:PATCH')(function* () {
			const sdk = yield* SDKCore;
			const notifier = yield* Notifications;

			const user = yield* verifyAuthTokenFromHeader(ctx);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = ctx.params;

			if (!id) {
				return apiResponseLogger(400, 'Invalid folder ID');
			}

			const jsonData = yield* Effect.tryPromise(() => ctx.request.json());
			const { folderName, parentFolder } = yield* Schema.decodeUnknown(FolderBase)(jsonData);

			if (!folderName) {
				return apiResponseLogger(400, 'Invalid form data, folderName is required');
			}

			const folderData = yield* sdk.UPDATE.folder({
				id,
				name: folderName,
				parent: parentFolder || null,
			});

			if (!folderData) {
				return apiResponseLogger(404, 'Folder not found');
			}

			yield* notifier.sendEditorNotification('folder_updated', folderName);
			return apiResponseLogger(200, 'Folder updated successfully');
		}).pipe(Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to update folder', error);
	});

export const DELETE: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studioCMS:rest:v1:folders:[id]:DELETE')(function* () {
			const sdk = yield* SDKCore;
			const notifier = yield* Notifications;
			const user = yield* verifyAuthTokenFromHeader(ctx);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = ctx.params;

			if (!id) {
				return apiResponseLogger(400, 'Invalid folder ID');
			}

			const folder = yield* sdk.GET.folder(id);

			if (!folder) {
				return apiResponseLogger(404, 'Folder not found');
			}

			yield* sdk.DELETE.folder(id);

			yield* sdk.UPDATE.folderList;
			yield* sdk.UPDATE.folderTree;

			yield* notifier.sendEditorNotification('folder_deleted', folder.name);

			return apiResponseLogger(200, 'Folder deleted successfully');
		}).pipe(Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to delete folder', error);
	});

export const OPTIONS: APIRoute = async () =>
	OptionsResponse({ allowedMethods: ['GET', 'PATCH', 'DELETE'] });

export const ALL: APIRoute = async () => AllResponse();
