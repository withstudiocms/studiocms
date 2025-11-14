import { Effect } from '@withstudiocms/effect';
import { SDKDefaults } from '../../context.js';
import type { StudioCMSNotificationSettings } from '../../types.js';
import { SDKConfigModule } from '../config/index.js';

/**
 * SDKNotificationSettingsModule
 *
 * Effect-based module that exposes site-scoped notification settings operations.
 *
 * This module depends on SDKConfigModule and SDKDefaults to read the current
 * notification configuration and to obtain default settings when none exist.
 *
 * The yielded object has the shape:
 * {
 *   site: {
 *     get: Effect<...>,    // retrieves the site notification settings, initializing with defaults if absent
 *     update: Effect<...>  // updates the site notification settings (accepts settings without `_config_version`)
 *   }
 * }
 *
 * Behavior:
 * - get: Reads the current `notificationConfig`. If a configuration is present, it is returned.
 *   If not present, the configuration is initialized using `NotificationSettingsDefaults` and the
 *   initialized value is returned.
 *
 * - update: Persists new site notification settings. The provided `settings` argument should omit
 *   the internal `_config_version` field (i.e. `Omit<StudioCMSNotificationSettings, '_config_version'>`).
 *
 * Remarks:
 * - The module is created inside an Effect.gen generator and therefore must be run within the
 *   surrounding Effect runtime to obtain the returned operations.
 * - All operations are effectful and should be composed/run via the project's Effect primitives.
 *
 * Example:
 * ```ts
 * const module = yield* Effect.runPromise(SDKNotificationSettingsModule);
 * const current = yield* Effect.runPromise(module.site.get());
 * yield* Effect.runPromise(module.site.update({ ...new_settings }));
 * ```
 *
 * @returns An Effect that yields an object with a `site` namespace containing `get` and `update` operations for site notification settings.
 */
export const SDKNotificationSettingsModule = Effect.gen(function* () {
	const [{ notificationConfig }, { NotificationSettingsDefaults }] = yield* Effect.all([
		SDKConfigModule,
		SDKDefaults,
	]);

	/**
	 * Retrieves the notification configuration, initializing it with default settings if not present.
	 */
	const _getNotificationConfig = Effect.fn(() =>
		notificationConfig
			.get()
			.pipe(
				Effect.flatMap((data) =>
					data ? Effect.succeed(data) : notificationConfig.init(NotificationSettingsDefaults)
				)
			)
	);

	/**
	 * Updates the notification configuration with the provided settings.
	 */
	const _updateNotificationConfig = Effect.fn(
		(settings: Omit<StudioCMSNotificationSettings, '_config_version'>) =>
			notificationConfig.update(settings)
	);

	return {
		/**
		 * Site-specific notification settings.
		 */
		site: {
			/**
			 * Retrieves the site-wide notification settings.
			 */
			get: _getNotificationConfig,

			/**
			 * Updates the site-wide notification settings.
			 */
			update: _updateNotificationConfig,
		},
	};
});

export default SDKNotificationSettingsModule;
