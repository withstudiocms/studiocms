import { eq } from 'astro:db';
import { CMSNotificationSettingsId, NotificationSettingsDefaults } from '../../consts.js';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { tsNotificationSettings } from '../tables.js';
import type { tsNotificationSettingsInsert } from '../types/index.js';
import { _ClearUnknownError, _clearLibSQLError } from '../utils.js';

export class SDKCore_NotificationSettings extends Effect.Service<SDKCore_NotificationSettings>()(
	'studiocms/sdk/SDKCore/modules/notificationSettings',
	{
		dependencies: [AstroDB.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/notificationSettings/effect')(function* () {
			const dbService = yield* AstroDB;

			const notificationSettings = {
				site: {
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
