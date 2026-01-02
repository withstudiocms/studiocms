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
import { StudioCMSPageDataCategories, StudioCMSPageDataTags } from '@withstudiocms/kysely';
import type { ParseResult } from 'effect';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';
import { buildPartialSchema } from '../../utils/build-partial-schema.js';
import { extractParams } from '../../utils/param-extractor.js';

const paramSchemaBase = Schema.Struct({
	taxonomy: Schema.Literal('categories', 'tags'),
	id: Schema.NumberFromString,
});

const firstLetterUppercase = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

const getTaxonomyLabel = ({ actual }: ParseResult.ParseIssue) => {
	if (Schema.is(paramSchemaBase)(actual)) {
		return `Taxonomy: ${firstLetterUppercase(actual.taxonomy)}`;
	}
};

const paramSchema = paramSchemaBase.annotations({
	identifier: 'TaxonomyParams',
	parseIssueTitle: getTaxonomyLabel,
});

const PartialCategories = buildPartialSchema(StudioCMSPageDataCategories.Select);
const PartialTags = buildPartialSchema(StudioCMSPageDataTags.Select);

export const { GET, PATCH, DELETE, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: extractParams(paramSchema)(({ taxonomy, id }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:${id}:GET`)(function* () {
				const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				switch (taxonomy) {
					case 'categories': {
						const category = yield* sdk.GET.categories.byId(id);
						if (!category) {
							return apiResponseLogger(404, 'Category not found');
						}
						return createJsonResponse(category);
					}
					case 'tags': {
						const tag = yield* sdk.GET.tags.byId(id);
						if (!tag) {
							return apiResponseLogger(404, 'Tag not found');
						}
						return createJsonResponse(tag);
					}
					default:
						return createJsonResponse({ error: 'Unknown taxonomy type' }, { status: 400 });
				}
			})
		),
		PATCH: extractParams(paramSchema)(({ taxonomy, id }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:${id}:PATCH`)(function* () {
				const [sdk, user, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					Notifications,
				]);

				const updateCategory = sdk.dbService.withCodec({
					encoder: PartialCategories,
					decoder: StudioCMSPageDataCategories.Select,
					callbackFn: (client, data) =>
						client((db) =>
							db
								.updateTable('StudioCMSPageDataCategories')
								.set(data)
								.where('id', '=', id)
								.returningAll()
								.executeTakeFirstOrThrow()
						),
				});

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

				switch (taxonomy) {
					case 'categories': {
						const jsonData = yield* parseAPIContextJson(ctx, PartialCategories);

						if (jsonData.id) {
							return apiResponseLogger(400, 'Cannot update ID field');
						}

						return yield* updateCategory(jsonData).pipe(
							Effect.tap((data) => notifier.sendEditorNotification('update_category', data.name)),
							Effect.map(createJsonResponse)
						);
					}
					case 'tags': {
						const jsonData = yield* parseAPIContextJson(ctx, PartialTags);

						if (jsonData.id) {
							return apiResponseLogger(400, 'Cannot update ID field');
						}

						return yield* updateTag(jsonData).pipe(
							Effect.tap((data) => notifier.sendEditorNotification('update_tag', data.name)),
							Effect.map(createJsonResponse)
						);
					}
					default:
						return createJsonResponse({ error: 'Unknown taxonomy type' }, { status: 400 });
				}
			}).pipe(Notifications.Provide)
		),
		DELETE: extractParams(paramSchema)(({ taxonomy, id }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:${id}:DELETE`)(function* () {
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

				const getPageList = sdk.GET.pages(true, false, true);

				const flattenAndCount = <T extends { id: number }>(arrays: T[][]): boolean => {
					return arrays.flat().filter((data) => data.id === id).length > 0;
				};

				const checkForChildrenPagesCategories = () =>
					getPageList.pipe(
						Effect.map((data) => data.map(({ categories }) => categories)),
						Effect.map(flattenAndCount)
					);

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

				switch (taxonomy) {
					case 'categories': {
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
					}
					case 'tags': {
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
					}
					default:
						return createJsonResponse({ error: 'Unknown taxonomy type' }, { status: 400 });
				}
			}).pipe(Notifications.Provide)
		),
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
