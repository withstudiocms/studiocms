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
} from '@withstudiocms/effect';
import { StudioCMSPageDataTags } from '@withstudiocms/sdk/tables';
import { buildPartialSchema } from '../../../../../../utils/build-partial-schema.js';
import type { EndpointRoute } from './../../../../../../utils/rest-router.js';
import { verifyAuthTokenFromHeader } from '../../../utils/auth-token.js';

const PartialTags = buildPartialSchema(StudioCMSPageDataTags.Select);

export const tagsRouter: EndpointRoute = {
	__idType: 'number',
	__index: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studiocms:rest:v1:tags:GET')(function* () {
					const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

					if (user instanceof Response) {
						return user;
					}

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
						return apiResponseLogger(401, 'Unauthorized');
					}

					const searchParams = ctx.url.searchParams;
					const folderNameFilter = searchParams.get('name');

					let tags = yield* sdk.GET.tags.getAll();

					if (folderNameFilter) {
						tags = tags.filter((tag) => tag.name.includes(folderNameFilter));
					}

					return createJsonResponse(tags);
				}),
			POST: (ctx) =>
				genLogger('studiocms:rest:v1:tags:POST')(function* () {
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

					return yield* parseAPIContextJson(ctx, StudioCMSPageDataTags.Insert.omit('id')).pipe(
						Effect.flatMap((data) =>
							Effect.gen(function* () {
								const id = yield* sdk.UTIL.Generators.generateRandomIDNumber(9);
								return { id, ...data };
							})
						),
						Effect.flatMap((data) => sdk.POST.databaseEntry.tags(data).pipe(Effect.as(data))),
						Effect.tap((data) => notifier.sendEditorNotification('new_tag', data.name)),
						Effect.map(createJsonResponse)
					);
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
	id: (id: number) =>
		createEffectAPIRoutes(
			{
				GET: (ctx) =>
					genLogger(`studiocms:rest:v1:tags:${id}:GET`)(function* () {
						const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const tag = yield* sdk.GET.tags.byId(id);
						if (!tag) {
							return apiResponseLogger(404, 'Tag not found');
						}
						return createJsonResponse(tag);
					}),
				PATCH: (ctx) =>
					genLogger(`studiocms:rest:v1:tags:${id}:PATCH`)(function* () {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							verifyAuthTokenFromHeader(ctx),
							Notifications,
						]);

						const updateTag = sdk.dbService.withCodec({
							encoder: PartialTags,
							decoder: StudioCMSPageDataTags.Select,
							callbackFn: (client, data) =>
								client((db) =>
									db
										.updateTable('StudioCMSPageDataTags')
										.set(data)
										.where('id', '=', id)
										.returningAll()
										.executeTakeFirstOrThrow()
								),
						});

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const jsonData = yield* parseAPIContextJson(ctx, PartialTags);

						if (jsonData.id) {
							return apiResponseLogger(400, 'Cannot update ID field');
						}

						return yield* updateTag(jsonData).pipe(
							Effect.tap((data) => notifier.sendEditorNotification('update_tag', data.name)),
							Effect.map(createJsonResponse)
						);
					}).pipe(Notifications.Provide),
				DELETE: (ctx) =>
					genLogger(`studiocms:rest:v1:tags:${id}:DELETE`)(function* () {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							verifyAuthTokenFromHeader(ctx),
							Notifications,
						]);

						const getPageList = sdk.GET.pages(true, true);

						const flattenAndCount = <T extends { id: number }>(arrays: T[][]): boolean => {
							return arrays.flat().filter((data) => data.id === id).length > 0;
						};

						const checkForChildrenPagesTags = () =>
							getPageList.pipe(
								Effect.map((data) => data.map(({ tags }) => tags)),
								Effect.map(flattenAndCount)
							);

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const existingTag = yield* sdk.GET.tags.byId(id);

						if (!existingTag) {
							return apiResponseLogger(404, 'Tag not found');
						}

						const hasChildrenPages = yield* checkForChildrenPagesTags();

						if (hasChildrenPages) {
							return apiResponseLogger(400, 'Cannot delete tag assigned to pages');
						}

						// Proceed to delete the tag
						yield* sdk.DELETE.tags(id).pipe(
							Effect.tap(() => notifier.sendEditorNotification('delete_tag', existingTag.name))
						);

						return createJsonResponse({ success: true });
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
