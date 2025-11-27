import { NotificationSettingsDefaults } from '../../../consts.js';
import { Effect, genLogger } from '../../../effect.js';
import { AstroDB } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { SDKCore_CONFIG, type StudioCMSNotificationSettings } from './config.js';

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
		dependencies: [AstroDB.Default, SDKCore_CONFIG.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/notificationSettings/effect')(function* () {
			const { notificationConfig } = yield* SDKCore_CONFIG;

			const notificationSettings = {
				site: {
					/**
					 * Retrieves the site-wide notification settings.
					 * @returns An Effect that resolves to the current notification settings.
					 * @throws SDKCoreError when a database error occurs.
					 */
					get: () =>
						Effect.gen(function* () {
							const data = yield* notificationConfig.get();

							if (!data) return yield* notificationConfig.init(NotificationSettingsDefaults);

							return data;
						}).pipe(
							Effect.catchTags({
								LibSQLClientError: (cause) =>
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
					update: (settings: Omit<StudioCMSNotificationSettings, '_config_version'>) =>
						notificationConfig.update(settings),
				},
			};

			return notificationSettings;
		}),
	}
) {}
