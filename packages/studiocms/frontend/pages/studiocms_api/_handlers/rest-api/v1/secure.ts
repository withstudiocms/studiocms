import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSRestApiV1Spec } from '@withstudiocms/api-spec';
import { CurrentRestAPIUser, RestAPIError } from '@withstudiocms/api-spec/rest-api';
import { StudioCMSPageDataCategories } from '@withstudiocms/sdk/tables';
import { Effect, Layer, Schema } from 'effect';
import { RestAPIAuthorizationLive } from '../../../_middleware/restApi.js';
import { sharedDBErrors, sharedNotifierErrors, sharedPageCollectionErrors } from './_shared.js';

/**
 * REST API v1 Secure Handler
 *
 * This handler is responsible for managing all secure endpoints of the REST API v1. It includes endpoints for creating, updating, deleting, and retrieving categories, folders, pages, settings, tags, and users. Each endpoint is currently implemented as a placeholder that returns an empty Effect, but can be expanded in the future to include actual logic for interacting with the database and performing the necessary operations.
 */
export const RestApiSecureHandler = HttpApiBuilder.group(
	StudioCMSRestApiV1Spec,
	'restV1',
	(handlers) =>
		handlers
			// Category Endpoints
			.handle(
				'createCategory',
				Effect.fn(
					function* ({ payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const newId = yield* sdk.UTIL.Generators.generateRandomIDNumber(9);
						const newCategory = { id: newId, ...payload };

						yield* sdk.POST.databaseEntry.categories(newCategory);
						yield* notifier
							.sendEditorNotification('new_category', newCategory.name)
							.pipe(
								Effect.catchAll(
									() => new RestAPIError({ error: 'Failed to send notification for new category' })
								)
							);

						return yield* sdk.GET.categories
							.byId(newId)
							.pipe(
								Effect.flatMap((category) =>
									category
										? Effect.succeed(category)
										: Effect.fail(
												new RestAPIError({ error: 'Failed to retrieve newly created category' })
											)
								)
							);
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						GeneratorError: () =>
							new RestAPIError({ error: 'Failed to generate new ID for category' }),
					})
				)
			)
			.handle(
				'deleteCategory',
				Effect.fn(
					function* ({ path: { id } }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
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

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						const existingCategory = yield* sdk.GET.categories.byId(id);

						if (!existingCategory) {
							return yield* new RestAPIError({ error: 'Category not found' });
						}

						const hasChildrenCategories = yield* checkForChildrenCategories(id).pipe(
							Effect.map((categories) => categories.length > 0)
						);

						if (hasChildrenCategories) {
							return yield* new RestAPIError({
								error: 'Cannot delete category with child categories',
							});
						}

						const hasChildrenPages = yield* checkForChildrenPagesCategories();

						if (hasChildrenPages) {
							return yield* new RestAPIError({ error: 'Cannot delete category assigned to pages' });
						}

						yield* sdk.DELETE.categories(id);
						yield* notifier
							.sendEditorNotification('delete_category', existingCategory.name)
							.pipe(
								Effect.catchAll(
									() =>
										new RestAPIError({ error: 'Failed to send notification for category deletion' })
								)
							);

						return { success: true };
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						...sharedPageCollectionErrors,
					})
				)
			)
			.handle(
				'updateCategory',
				Effect.fn(
					function* ({ path: { id }, payload }) {
						const [sdk, user, notifier] = yield* Effect.all([
							SDKCore,
							CurrentRestAPIUser,
							Notifications,
						]);

						const updateCategory = sdk.dbService.withCodec({
							encoder: Schema.partial(StudioCMSPageDataCategories.Select),
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

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return yield* new RestAPIError({ error: 'Unauthorized' });
						}

						if (payload.id && payload.id !== id) {
							return yield* new RestAPIError({
								error: "ID in payload does not match ID in path, ID's must match to update.",
							});
						}

						const parentId = payload.parent;
						if (parentId && parentId === id) {
							return yield* new RestAPIError({
								error: 'Category cannot be its own parent',
							});
						}

						const updatedCategory = yield* updateCategory(payload);

						yield* notifier
							.sendEditorNotification('update_category', updatedCategory.name)
							.pipe(
								Effect.catchAll(
									() =>
										new RestAPIError({ error: 'Failed to send notification for category update' })
								)
							);

						return updatedCategory;
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
			.handle(
				'getCategories',
				Effect.fn(function* ({ urlParams: { name, parent } }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					let categories = yield* sdk.GET.categories.getAll();

					if (name) {
						categories = categories.filter((category) => category.name.includes(name));
					}
					if (parent) {
						categories = categories.filter((category) => category.parent === parent);
					}

					return categories;
				}, Effect.catchTags(sharedDBErrors))
			)
			.handle(
				'getCategory',
				Effect.fn(function* ({ path: { id } }) {
					const [sdk, user] = yield* Effect.all([SDKCore, CurrentRestAPIUser]);

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
						return yield* new RestAPIError({ error: 'Unauthorized' });
					}

					return yield* sdk.GET.categories
						.byId(id)
						.pipe(
							Effect.flatMap((category) =>
								category
									? Effect.succeed(category)
									: Effect.fail(new RestAPIError({ error: 'Category not found' }))
							)
						);
				}, Effect.catchTags(sharedDBErrors))
			)

			// Folder Endpoints
			.handle('createFolder', () => Effect.void)
			.handle('deleteFolder', () => Effect.void)
			.handle('updateFolder', () => Effect.void)
			.handle('getFolders', () => Effect.void)
			.handle('getFolder', () => Effect.void)

			// Page Endpoints
			.handle('createPage', () => Effect.void)
			.handle('deletePage', () => Effect.void)
			.handle('updatePage', () => Effect.void)
			.handle('getPages', () => Effect.void)
			.handle('getPage', () => Effect.void)
			.handle('getPageHistory', () => Effect.void)
			.handle('getPageHistoryEntry', () => Effect.void)

			// Settings Endpoints
			.handle('getSettings', () => Effect.void)
			.handle('updateSettings', () => Effect.void)

			// Tag Endpoints
			.handle('createTag', () => Effect.void)
			.handle('deleteTag', () => Effect.void)
			.handle('updateTag', () => Effect.void)
			.handle('getTags', () => Effect.void)
			.handle('getTag', () => Effect.void)

			// User Endpoints
			.handle('createUser', () => Effect.void)
			.handle('deleteUser', () => Effect.void)
			.handle('updateUser', () => Effect.void)
			.handle('getUsers', () => Effect.void)
			.handle('getUser', () => Effect.void)
).pipe(Layer.provide(RestAPIAuthorizationLive));
