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

export const { GET, PATCH, DELETE, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studioCMS:rest:v1:folders:[id]:GET')(function* () {
				const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

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

				return createJsonResponse(folder);
			}),
		PATCH: (ctx) =>
			genLogger('studioCMS:rest:v1:folders:[id]:PATCH')(function* () {
				const [sdk, user, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					Notifications,
				]);

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

				const { folderName, parentFolder } = yield* parseAPIContextJson(ctx, FolderBase);

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

				yield* Effect.all([
					sdk.UPDATE.folderList,
					sdk.UPDATE.folderTree,
					notifier.sendEditorNotification('folder_updated', folderName),
				]);
				return apiResponseLogger(200, 'Folder updated successfully');
			}).pipe(Notifications.Provide),
		DELETE: (ctx) =>
			genLogger('studioCMS:rest:v1:folders:[id]:DELETE')(function* () {
				const [sdk, notifier, user] = yield* Effect.all([
					SDKCore,
					Notifications,
					verifyAuthTokenFromHeader(ctx),
				]);

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

				yield* Effect.all([
					sdk.DELETE.folder(id),
					sdk.UPDATE.folderList,
					sdk.UPDATE.folderTree,
					notifier.sendEditorNotification('folder_deleted', folder.name),
				]);

				return apiResponseLogger(200, 'Folder deleted successfully');
			}).pipe(Notifications.Provide),
		OPTIONS: () =>
			Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'PATCH', 'DELETE'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
