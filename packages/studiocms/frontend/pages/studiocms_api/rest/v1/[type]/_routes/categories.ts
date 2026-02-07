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
import { StudioCMSPageDataCategories } from '@withstudiocms/sdk/tables';
import { buildPartialSchema } from '../../../../../../utils/build-partial-schema.js';
import type { EndpointRoute } from './../../../../../../utils/rest-router.js';
import { verifyAuthTokenFromHeader } from '../../../utils/auth-token.js';

const PartialCategories = buildPartialSchema(StudioCMSPageDataCategories.Select);

export const categoriesRouter: EndpointRoute = {
	__idType: 'number',
	__index: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studiocms:rest:v1:categories:GET')(function* () {
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
					const folderParentFilter = searchParams.get('parent');

					let categories = yield* sdk.GET.categories.getAll();

					if (folderNameFilter) {
						categories = categories.filter((category) => category.name.includes(folderNameFilter));
					}

					if (folderParentFilter) {
						categories = categories.filter(
							(category) => category.parent === Number.parseInt(folderParentFilter, 10)
						);
					}

					return createJsonResponse(categories);
				}),
			POST: (ctx) =>
				genLogger('studiocms:rest:v1:categories:POST')(function* () {
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

					return yield* parseAPIContextJson(
						ctx,
						StudioCMSPageDataCategories.Insert.omit('id')
					).pipe(
						Effect.flatMap(
							Effect.fn(function* (data) {
								const id = yield* sdk.UTIL.Generators.generateRandomIDNumber(9);
								return { id, ...data };
							})
						),
						Effect.flatMap((data) => sdk.POST.databaseEntry.categories(data).pipe(Effect.as(data))),
						Effect.tap((data) => notifier.sendEditorNotification('new_category', data.name)),
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
					genLogger(`studiocms:rest:v1:categories:${id}:GET`)(function* () {
						const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const category = yield* sdk.GET.categories.byId(id);
						if (!category) {
							return apiResponseLogger(404, 'Category not found');
						}
						return createJsonResponse(category);
					}),
				PATCH: (ctx) =>
					genLogger(`studiocms:rest:v1:categories:${id}:PATCH`)(function* () {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							verifyAuthTokenFromHeader(ctx),
							Notifications,
						]);

						const updateCategory = sdk.dbService.withCodec({
							encoder: PartialCategories,
							decoder: StudioCMSPageDataCategories.Select,
							callbackFn: (db, data) =>
								db((client) =>
									client.transaction().execute(async (trx) => {
										await trx
											.updateTable('StudioCMSPageDataCategories')
											.set(data)
											.where('id', '=', id)
											.executeTakeFirstOrThrow();

										return await trx
											.selectFrom('StudioCMSPageDataCategories')
											.selectAll()
											.where('id', '=', id)
											.executeTakeFirstOrThrow();
									})
								),
						});

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const jsonData = yield* parseAPIContextJson(ctx, PartialCategories);

						if (jsonData.id) {
							return apiResponseLogger(400, 'Cannot update ID field');
						}

						const parentId = jsonData.parent;
						if (parentId && parentId === id) {
							return apiResponseLogger(400, 'Category cannot be its own parent');
						}

						return yield* updateCategory(jsonData).pipe(
							Effect.tap((data) => notifier.sendEditorNotification('update_category', data.name)),
							Effect.map(createJsonResponse)
						);
					}).pipe(Notifications.Provide),
				DELETE: (ctx) =>
					genLogger(`studiocms:rest:v1:categories:${id}:DELETE`)(function* () {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							verifyAuthTokenFromHeader(ctx),
							Notifications,
						]);

						const checkForChildrenCategories = sdk.dbService.withCodec({
							encoder: Schema.Number,
							decoder: Schema.Array(StudioCMSPageDataCategories.Select),
							callbackFn: (client, categoryId) =>
								client((db) =>
									db
										.selectFrom('StudioCMSPageDataCategories')
										.where('parent', '=', categoryId)
										.selectAll()
										.execute()
								),
						});

						const getPageList = sdk.GET.pages(true, true);

						const flattenAndCount = <T extends { id: number }>(arrays: T[][]): boolean => {
							return arrays.flat().filter((data) => data.id === id).length > 0;
						};

						const checkForChildrenPagesCategories = () =>
							getPageList.pipe(
								Effect.map((data) => data.map(({ categories }) => categories)),
								Effect.map(flattenAndCount)
							);

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const existingCategory = yield* sdk.GET.categories.byId(id);
						if (!existingCategory) {
							return apiResponseLogger(404, 'Category not found');
						}

						const hasChildrenCategories = yield* checkForChildrenCategories(id).pipe(
							Effect.map((categories) => categories.length > 0)
						);

						if (hasChildrenCategories) {
							return apiResponseLogger(400, 'Cannot delete category with child categories');
						}

						const hasChildrenPages = yield* checkForChildrenPagesCategories();

						if (hasChildrenPages) {
							return apiResponseLogger(400, 'Cannot delete category assigned to pages');
						}

						// Proceed to delete the category
						yield* sdk.DELETE.categories(id).pipe(
							Effect.tap(() =>
								notifier.sendEditorNotification('delete_category', existingCategory.name)
							)
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
