import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { StudioCMSPageDataCategories, StudioCMSPageDataTags } from '@withstudiocms/sdk/tables';
import { Effect, Schema } from 'effect';
import {
	categoriesToTaxonomyNodes,
	tagsToTaxonomyNodes,
} from '#frontend/components/shared/taxonomy/shared.ts';
import { sharedDBErrors, sharedNotifierErrors } from './_shared';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Taxonomy Handlers for the Dashboard API
 */
export const TaxonomyHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'taxonomy',
	(handlers) =>
		handlers
			.handle(
				'taxonomy',
				Effect.fn(
					function* ({ payload }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({
								error: 'Dashboard API is disabled',
							});
						}

						const [sdk, userData, notifier] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
						]);

						if (!userData.isLoggedIn || !userData.userPermissionLevel.isEditor) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						if (!payload.mode || !payload.type) {
							return yield* new DashboardAPIError({ error: 'Invalid request payload' });
						}

						const newId = yield* sdk.UTIL.Generators.generateRandomIDNumber(9);

						switch (payload.type) {
							case 'categories': {
								const { mode, type: _, ...categoryData } = payload;
								const decoder = Schema.encode(StudioCMSPageDataCategories.Select);

								switch (mode) {
									case 'create': {
										const newCategory = yield* decoder({
											...categoryData,
											id: categoryData.id && categoryData.id > 0 ? categoryData.id : newId,
										}).pipe(Effect.flatMap(sdk.POST.databaseEntry.categories));

										if (!newCategory) {
											return yield* new DashboardAPIError({ error: 'Failed to create category' });
										}

										yield* notifier
											.sendEditorNotification('new_category', categoryData.name)
											.pipe(
												Effect.catchAll(
													() => new DashboardAPIError({ error: 'Failed to send notification' })
												)
											);

										return {
											message: 'Category created successfully',
										};
									}
									case 'edit': {
										if (categoryData.id === categoryData.parent) {
											return yield* new DashboardAPIError({
												error: 'Category cannot be its own parent',
											});
										}

										const updatedCategory = yield* decoder(categoryData).pipe(
											Effect.flatMap(sdk.UPDATE.categories)
										);

										if (!updatedCategory) {
											return yield* new DashboardAPIError({ error: 'Failed to update category' });
										}

										yield* notifier
											.sendEditorNotification('update_category', categoryData.name)
											.pipe(
												Effect.catchAll(
													() => new DashboardAPIError({ error: 'Failed to send notification' })
												)
											);

										return {
											message: 'Category updated successfully',
										};
									}
									default:
										return yield* new DashboardAPIError({ error: 'Invalid mode' });
								}
							}
							case 'tags': {
								const { mode, type: _, ...tagData } = payload;
								const decoder = Schema.encode(StudioCMSPageDataTags.Select);

								switch (mode) {
									case 'create': {
										const newTag = yield* decoder({
											...tagData,
											id: tagData.id && tagData.id > 0 ? tagData.id : newId,
										}).pipe(Effect.flatMap(sdk.POST.databaseEntry.tags));

										if (!newTag) {
											return yield* new DashboardAPIError({ error: 'Failed to create tag' });
										}

										yield* notifier
											.sendEditorNotification('new_tag', tagData.name)
											.pipe(
												Effect.catchAll(
													() => new DashboardAPIError({ error: 'Failed to send notification' })
												)
											);

										return {
											message: 'Tag created successfully',
										};
									}
									case 'edit': {
										const updatedTag = yield* decoder(tagData).pipe(
											Effect.flatMap(sdk.UPDATE.tags)
										);

										if (!updatedTag) {
											return yield* new DashboardAPIError({ error: 'Failed to update tag' });
										}

										yield* notifier
											.sendEditorNotification('update_tag', tagData.name)
											.pipe(
												Effect.catchAll(
													() => new DashboardAPIError({ error: 'Failed to send notification' })
												)
											);

										return {
											message: 'Tag updated successfully',
										};
									}
									default:
										return yield* new DashboardAPIError({ error: 'Invalid mode' });
								}
							}
							default:
								return yield* new DashboardAPIError({ error: 'Invalid taxonomy type' });
						}
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						GeneratorError: () => new DashboardAPIError({ error: 'Failed to generate new ID' }),
						ParseError: () => new DashboardAPIError({ error: 'Failed to parse category data' }),
					})
				)
			)
			.handle(
				'taxonomyDelete',
				Effect.fn(
					function* ({ payload: { id, type } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({
								error: 'Dashboard API is disabled',
							});
						}

						const [sdk, userData, notify] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
						]);

						if (!userData.isLoggedIn || !userData.userPermissionLevel.isAdmin) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						switch (type) {
							case 'categories': {
								const allCategories = yield* sdk.GET.categories.getAll();

								const isParentCategory = allCategories.some((c) => c.parent === id);

								if (isParentCategory) {
									return yield* new DashboardAPIError({
										error: 'Cannot delete category that has child categories',
									});
								}

								const foundCategory = allCategories.find((c) => c.id === id);

								if (!foundCategory) {
									return yield* new DashboardAPIError({ error: 'Category not found' });
								}

								const deletionSuccess = yield* sdk.DELETE.categories(id);

								if (!deletionSuccess) {
									return yield* new DashboardAPIError({ error: 'Failed to delete category' });
								}

								yield* notify
									.sendEditorNotification('delete_category', foundCategory.name)
									.pipe(
										Effect.catchAll(
											() => new DashboardAPIError({ error: 'Failed to send notification' })
										)
									);

								return {
									message: 'Category deleted successfully',
								};
							}
							case 'tags': {
								const foundTag = yield* sdk.GET.tags.byId(id);

								if (!foundTag) {
									return yield* new DashboardAPIError({ error: 'Tag not found' });
								}

								const deletionSuccess = yield* sdk.DELETE.tags(id);

								if (!deletionSuccess) {
									return yield* new DashboardAPIError({ error: 'Failed to delete tag' });
								}

								yield* notify
									.sendEditorNotification('delete_tag', foundTag.name)
									.pipe(
										Effect.catchAll(
											() => new DashboardAPIError({ error: 'Failed to send notification' })
										)
									);

								return {
									message: 'Tag deleted successfully',
								};
							}
							default:
								return yield* new DashboardAPIError({ error: 'Invalid taxonomy type' });
						}
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
			.handle('taxonomySearch', () =>
				!dashboardAPIEnabled
					? Effect.fail(new DashboardAPIError({ error: 'Dashboard API is disabled' }))
					: SDKCore.pipe(
							Effect.flatMap((sdk) =>
								Effect.all([
									sdk.GET.categories.getAll().pipe(Effect.map(categoriesToTaxonomyNodes)),
									sdk.GET.tags.getAll().pipe(Effect.map(tagsToTaxonomyNodes)),
								])
							),
							Effect.flatMap(([categories, tags]) => Effect.succeed([...categories, ...tags])),
							Effect.catchTags(sharedDBErrors)
						)
			)
);
