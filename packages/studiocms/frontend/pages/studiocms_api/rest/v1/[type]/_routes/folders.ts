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
} from '@withstudiocms/effect';
import { StudioCMSPageData, StudioCMSPageFolderStructure } from '@withstudiocms/kysely';
import type { EndpointRoute } from './../../../../../../utils/rest-router.js';
import { verifyAuthTokenFromHeader } from '../../../utils/auth-token.js';

export class FolderBase extends Schema.Class<FolderBase>('FolderBase')({
	folderName: Schema.String,
	parentFolder: Schema.Union(Schema.String, Schema.Null),
}) {}

export const foldersRouter: EndpointRoute = {
	__idType: 'string',
	__index: createEffectAPIRoutes(
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
	),
	id: (id: string) =>
		createEffectAPIRoutes(
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

						const { folderName, parentFolder } = yield* parseAPIContextJson(ctx, FolderBase);

						if (!folderName) {
							return apiResponseLogger(400, 'Invalid form data, folderName is required');
						}

						// Ensure parent folder is not the same as the folder being edited
						if (parentFolder === id) {
							return apiResponseLogger(400, 'A folder cannot be its own parent');
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

						/**
						 * Check for child folders before deletion
						 */
						const checkForChildrenFolders = sdk.dbService.withCodec({
							encoder: Schema.String,
							decoder: Schema.Array(StudioCMSPageFolderStructure),
							callbackFn: (client, id) =>
								client((db) =>
									db
										.selectFrom('StudioCMSPageFolderStructure')
										.where('parent', '=', id)
										.selectAll()
										.execute()
								),
						});

						/**
						 * Check for child pages before deletion
						 */
						const checkForChildrenPages = sdk.dbService.withCodec({
							encoder: Schema.String,
							decoder: Schema.Array(StudioCMSPageData),
							callbackFn: (client, id) =>
								client((db) =>
									db
										.selectFrom('StudioCMSPageData')
										.where('parentFolder', '=', id)
										.selectAll()
										.execute()
								),
						});

						/**
						 * Check for any children (folders or pages) before deletion
						 */
						const checkForChildren = Effect.fn((id: string) =>
							Effect.all({
								folders: checkForChildrenFolders(id),
								pages: checkForChildrenPages(id),
							}).pipe(
								Effect.map(({ folders, pages }) => {
									return { hasChildren: folders.length > 0 || pages.length > 0 };
								})
							)
						);

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const folder = yield* sdk.GET.folder(id);

						if (!folder) {
							return apiResponseLogger(404, 'Folder not found');
						}

						const { hasChildren } = yield* checkForChildren(id);

						if (hasChildren) {
							return apiResponseLogger(
								400,
								'Folder cannot be deleted because it contains subfolders or pages'
							);
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
		),
};
