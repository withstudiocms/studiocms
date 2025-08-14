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
	readAPIContextJson,
} from '../../../../effect.js';

interface FolderBase {
	folderName: string;
	parentFolder: string | null;
}

interface FolderEdit extends FolderBase {
	id: string;
}

export const { POST, PATCH, DELETE, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/content/folder.POST')(function* () {
				const [notify, sdk] = yield* Effect.all([Notifications, SDKCore]);

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

				const { folderName, parentFolder } = yield* readAPIContextJson<FolderBase>(ctx);

				if (!folderName) {
					return apiResponseLogger(400, 'Invalid form data, folderName is required');
				}

				yield* Effect.all([
					sdk.POST.folder({
						id: crypto.randomUUID(),
						name: folderName,
						parent: parentFolder || null,
					}),
					sdk.UPDATE.folderList,
					sdk.UPDATE.folderTree,
					notify.sendEditorNotification('new_folder', folderName),
				]);

				return apiResponseLogger(200, 'Folder created successfully');
			}).pipe(Notifications.Provide),
		PATCH: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/content/folder.PATCH')(function* () {
				const [notify, sdk] = yield* Effect.all([Notifications, SDKCore]);

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

				const { id, folderName, parentFolder } = yield* readAPIContextJson<FolderEdit>(ctx);

				if (!id) {
					return apiResponseLogger(400, 'Invalid form data, id is required');
				}

				if (!folderName) {
					return apiResponseLogger(400, 'Invalid form data, folderName is required');
				}

				yield* Effect.all([
					sdk.UPDATE.folder({
						id,
						name: folderName,
						parent: parentFolder || null,
					}),
					sdk.UPDATE.folderList,
					sdk.UPDATE.folderTree,
					notify.sendEditorNotification('folder_updated', folderName),
				]);

				return apiResponseLogger(200, 'Folder updated successfully');
			}).pipe(Notifications.Provide),
		DELETE: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/content/folder.DELETE')(function* () {
				const [notify, sdk] = yield* Effect.all([Notifications, SDKCore]);

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

				const { id } = yield* readAPIContextJson<{ id: string }>(ctx);

				if (!id) {
					return apiResponseLogger(400, 'Invalid form data, id is required');
				}

				const { name: folderName } = (yield* sdk.GET.folder(id)) || {};

				if (!folderName) {
					return apiResponseLogger(404, 'Folder not found');
				}

				yield* Effect.all([
					sdk.DELETE.folder(id),
					sdk.UPDATE.folderList,
					sdk.UPDATE.folderTree,
					notify.sendEditorNotification('folder_deleted', folderName),
				]);

				return apiResponseLogger(200, 'Folder deleted successfully');
			}).pipe(Notifications.Provide),
		OPTIONS: () =>
			Effect.try(() => OptionsResponse({ allowedMethods: ['POST', 'PATCH', 'DELETE'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'PATCH', 'DELETE'] },
		onError: (error) => {
			console.error('Error in folder API:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
