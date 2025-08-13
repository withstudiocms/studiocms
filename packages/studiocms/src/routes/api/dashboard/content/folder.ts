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
} from '../../../../effect.js';

interface FolderBase {
	folderName: string;
	parentFolder: string | null;
}

interface FolderEdit extends FolderBase {
	id: string;
}

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/content/folder.POST')(function* () {
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

			// Get user data
			const userData = ctx.locals.StudioCMS.security?.userSessionData;

			// Check if user is logged in
			if (!userData?.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData: FolderBase = yield* Effect.tryPromise(() => ctx.request.json());

			const { folderName, parentFolder } = jsonData;

			if (!folderName) {
				return apiResponseLogger(400, 'Invalid form data, folderName is required');
			}
			yield* sdk.POST.folder({
				id: crypto.randomUUID(),
				name: folderName,
				parent: parentFolder || null,
			});

			yield* sdk.UPDATE.folderList;
			yield* sdk.UPDATE.folderTree;

			yield* notify.sendEditorNotification('new_folder', folderName);

			return apiResponseLogger(200, 'Folder created successfully');
		}).pipe(Notifications.Provide)
	);

export const PATCH: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/content/folder.PATCH')(function* () {
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

			// Get user data
			const userData = ctx.locals.StudioCMS.security?.userSessionData;

			// Check if user is logged in
			if (!userData?.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isEditor;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData: FolderEdit = yield* Effect.tryPromise(() => ctx.request.json());

			const { id, folderName, parentFolder } = jsonData;

			if (!id) {
				return apiResponseLogger(400, 'Invalid form data, id is required');
			}

			if (!folderName) {
				return apiResponseLogger(400, 'Invalid form data, folderName is required');
			}

			yield* sdk.UPDATE.folder({
				id,
				name: folderName,
				parent: parentFolder || null,
			});

			yield* notify.sendEditorNotification('folder_updated', folderName);

			return apiResponseLogger(200, 'Folder updated successfully');
		}).pipe(Notifications.Provide)
	);

export const DELETE: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/content/folder.DELETE')(function* () {
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

			// Get user data
			const userData = ctx.locals.StudioCMS.security?.userSessionData;

			// Check if user is logged in
			if (!userData?.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData: FolderEdit = yield* Effect.tryPromise(() => ctx.request.json());

			const { id } = jsonData;

			if (!id) {
				return apiResponseLogger(400, 'Invalid form data, id is required');
			}

			const { name: folderName } = (yield* sdk.GET.folder(id)) || {};

			if (!folderName) {
				return apiResponseLogger(404, 'Folder not found');
			}

			yield* sdk.DELETE.folder(id);

			yield* notify.sendEditorNotification('folder_deleted', folderName);

			return apiResponseLogger(200, 'Folder deleted successfully');
		}).pipe(Notifications.Provide)
	);

export const OPTIONS: APIRoute = async () =>
	OptionsResponse({ allowedMethods: ['POST', 'PATCH', 'DELETE'] });

export const ALL: APIRoute = async () => AllResponse();
