import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect, Schema } from 'effect';
import { convertToVanilla } from '../../../../../lib/effects/convertToVanilla.js';
import { genLogger } from '../../../../../lib/effects/logger.js';
import { AllResponse, OptionsResponse } from '../../../../../lib/endpointResponses.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

export class FolderBase extends Schema.Class<FolderBase>('FolderBase')({
	folderName: Schema.String,
	parentFolder: Schema.Union(Schema.String, Schema.Null),
}) {}

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:folders:[id]:GET')(function* () {
			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = context.params;

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
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to fetch folder', error);
	});

export const PATCH: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:folders:[id]:PATCH')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = context.params;

			if (!id) {
				return apiResponseLogger(400, 'Invalid folder ID');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());
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

			yield* Notifications.sendEditorNotification('folder_updated', folderName);
			return apiResponseLogger(200, 'Folder updated successfully');
		}).pipe(SDKCore.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to update folder', error);
	});

export const DELETE: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:folders:[id]:DELETE')(function* () {
			const sdk = yield* SDKCore;
			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = context.params;

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

			yield* Notifications.sendEditorNotification('folder_deleted', folder.name);

			return apiResponseLogger(200, 'Folder deleted successfully');
		}).pipe(SDKCore.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to delete folder', error);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET', 'PATCH', 'DELETE']);

export const ALL: APIRoute = async () => AllResponse();
