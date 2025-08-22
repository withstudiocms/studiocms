import { eq } from 'astro:db';
import { CMSNotificationSettingsId, NotificationSettingsDefaults } from '../../../consts.js';
import { Effect, genLogger } from '../../../effect.js';
import { AstroDB } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { tsNotificationSettings } from '../tables.js';
import type { tsNotificationSettingsInsert } from '../types/index.js';

/**
 * Service class for managing notification settings in the StudioCMS SDK.
 *
 * @remarks
 * This class provides methods to retrieve and update site-wide notification settings
 * from the database. If settings do not exist, default values are inserted.
 * All database operations are wrapped with error handling for `LibSQLDatabaseError`.
 *
 * @example
 * ```typescript
 * const settings = await SDKCore_NotificationSettings.site.get();
 * await SDKCore_NotificationSettings.site.update({ ...newSettings });
 * ```
 *
 * @service
 * @module studiocms/sdk/SDKCore/modules/notificationSettings
 *
 * @dependencies
 * - AstroDB.Default
 *
 * @effect
 * - genLogger for logging effect operations
 *
 * @throws SDKCoreError when a database error occurs
 */
export class SDKCore_NotificationSettings extends Effect.Service<SDKCore_NotificationSettings>()(
	'studiocms/sdk/SDKCore/modules/notificationSettings',
	{
		dependencies: [AstroDB.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/notificationSettings/effect')(function* () {
			const dbService = yield* AstroDB;

			const notificationSettings = {
				site: {
					/**
					 * Retrieves the site-wide notification settings.
					 * @returns An Effect that resolves to the current notification settings.
					 * @throws SDKCoreError when a database error occurs.
					 */
					get: () =>
						Effect.gen(function* () {
							const data = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsNotificationSettings)
									.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
									.get()
							);

							if (!data) {
								return yield* dbService.execute((db) =>
									db
										.insert(tsNotificationSettings)
										.values(NotificationSettingsDefaults)
										.returning()
										.get()
								);
							}

							return data;
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`notificationSettings.site.get Error: ${cause}`
											),
										})
									),
							})
						),

					/**
					 * Updates the site-wide notification settings.
					 * @param settings - The new notification settings to be updated.
					 * @returns An Effect that resolves to the updated settings.
					 * @throws SDKCoreError when a database error occurs.
					 */
					update: dbService.makeQuery((ex, settings: tsNotificationSettingsInsert) =>
						ex((db) =>
							db
								.update(tsNotificationSettings)
								.set(settings)
								.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
								.returning()
								.get()
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`notificationSettings.site.update Error: ${cause}`
											),
										})
									),
							})
						)
					),
				},
			};

			return notificationSettings;
		}),
	}
) {}
