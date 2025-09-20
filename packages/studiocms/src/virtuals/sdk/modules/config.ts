import { eq } from 'astro:db';
import {
	CMSMailerConfigId,
	CMSNotificationSettingsId,
	CMSSiteConfigId,
	Next_MailerConfigId,
	Next_NotificationSettingsId,
	Next_SiteConfigId,
} from '../../../consts.js';
import { Deepmerge, Effect } from '../../../effect.js';
import { CURRENT_CONFIG_VERSION } from '../consts.js';
import { AstroDB, type LibSQLClientError } from '../effect/db.js';
import {
	tsDynamicConfigSettings,
	tsMailerConfig,
	tsNotificationSettings,
	tsSiteConfig,
} from '../tables.js';
import type {
	ConfigFinal,
	DynamicConfigEntry,
	LegacyMailerConfig,
	LegacyNotificationSettings,
	LegacySiteConfig,
	LegacyTables,
	RawDynamicConfigEntry,
	RawDynamicConfigInsert,
	StudioCMSDynamicConfigBase,
	StudioCMSMailerConfig,
	StudioCMSNotificationSettings,
	StudioCMSSiteConfig,
} from './config-types.js';

export type {
	ConfigFinal,
	DynamicConfigEntry,
	LegacyMailerConfig,
	LegacyNotificationSettings,
	LegacySiteConfig,
	LegacyTables,
	RawDynamicConfigEntry,
	RawDynamicConfigInsert,
	StudioCMSDynamicConfigBase,
	StudioCMSMailerConfig,
	StudioCMSNotificationSettings,
	StudioCMSSiteConfig,
} from './config-types.js';
/**
 * Casts the `data` property of a `RawDynamicConfigEntry` to the specified generic type `T`
 * and returns a new `DynamicConfigEntry<T>` object.
 *
 * @typeParam T - The type to cast the `data` property to.
 * @param param0 - An object containing the `data` to cast and its associated `id`.
 * @param param0.data - The raw data to be cast to type `T`.
 * @param param0.id - The identifier for the config entry.
 * @returns A `DynamicConfigEntry<T>` object with the `data` property cast to type `T`.
 */
export const castType = <T>({ data, id }: RawDynamicConfigEntry): DynamicConfigEntry<T> => ({
	id,
	data: data as T,
});

/**
 * Migrates a legacy site configuration object to the latest `StudioCMSSiteConfig` format.
 *
 * @param params - The legacy site configuration object, destructured to extract `id`, `gridItems`, and the rest of the config.
 * @param params.id - The unique identifier of the site (legacy, not used in the new config).
 * @param params.gridItems - The grid items from the legacy config, which will be cast to a string array.
 * @param params.legacyConfig - The remaining properties of the legacy config.
 * @returns The migrated site configuration object with the latest config version and normalized `gridItems`.
 */
export const migrateLegacySiteConfig = ({
	id,
	gridItems,
	...legacyConfig
}: typeof tsSiteConfig.$inferSelect): StudioCMSSiteConfig => ({
	...legacyConfig,
	gridItems: (gridItems ?? []) as string[],
	_config_version: CURRENT_CONFIG_VERSION,
});

/**
 * Migrates a legacy mailer configuration object to the current configuration version.
 *
 * @param param0 - The legacy mailer configuration object, destructured to extract the `id` and the rest of the configuration.
 * @returns The updated mailer configuration object with the current configuration version applied.
 */
export const migrateLegacyMailerConfig = ({
	id,
	...legacyConfig
}: typeof tsMailerConfig.$inferSelect): StudioCMSMailerConfig => ({
	...legacyConfig,
	_config_version: CURRENT_CONFIG_VERSION,
});

/**
 * Migrates legacy notification settings to the current configuration version.
 *
 * @param param0 - An object containing the legacy notification settings, including an `id` and other configuration properties.
 * @returns The migrated notification settings object with the updated `_config_version`.
 */
export const migrateLegacyNotificationSettings = ({
	id,
	...legacyConfig
}: typeof tsNotificationSettings.$inferSelect): StudioCMSNotificationSettings => ({
	...legacyConfig,
	_config_version: CURRENT_CONFIG_VERSION,
});

/**
 * Provides configuration management services for StudioCMS using an effect-based service pattern.
 *
 * This service handles CRUD operations for dynamic configuration entries, supports migration from legacy tables,
 * and exposes specialized interfaces for site, mailer, and notification configuration management.
 *
 * @remarks
 * - Uses dependency injection for database and deep merge utilities.
 * - Supports versioned dynamic configs and automatic migration from legacy schemas.
 * - Exposes effect-based methods for creating, retrieving, updating, and migrating configuration entries.
 *
 * @example
 * ```typescript
 * const configService = Effect.service(SDKCore_CONFIG);
 * const siteConfig = yield* configService.siteConfig.get();
 * yield* configService.siteConfig.update({ ...siteConfig, someField: 'newValue' });
 * ```
 *
 * @service
 * @module studiocms/sdk/modules/SDKCore_CONFIG
 */
export class SDKCore_CONFIG extends Effect.Service<SDKCore_CONFIG>()(
	'studiocms/sdk/modules/SDKCore_CONFIG',
	{
		dependencies: [AstroDB.Default, Deepmerge.Default],
		effect: Effect.gen(function* () {
			const [dbService, { merge }] = yield* Effect.all([AstroDB, Deepmerge]);

			/**
			 * Inserts a new dynamic configuration entry into the database.
			 *
			 * @param entry - The raw dynamic configuration entry to insert.
			 * @returns A promise that resolves to the inserted entry.
			 *
			 * @remarks
			 * This function uses the `dbService.makeQuery` utility to perform the insertion
			 * and returns the newly inserted record from the `tsDynamicConfigSettings` table.
			 */
			const _insert = dbService.makeQuery((ex, entry: RawDynamicConfigInsert) =>
				ex((db) => db.insert(tsDynamicConfigSettings).values(entry).returning().get())
			);

			/**
			 * Creates a query function to select a dynamic configuration setting by its ID.
			 *
			 * @param ex - The database executor function.
			 * @param id - The unique identifier of the dynamic configuration setting.
			 * @returns A promise that resolves to the configuration setting matching the provided ID.
			 */
			const _select = dbService.makeQuery((ex, id: string) =>
				ex((db) =>
					db.select().from(tsDynamicConfigSettings).where(eq(tsDynamicConfigSettings.id, id)).get()
				)
			);

			/**
			 * Updates a dynamic configuration entry in the database.
			 *
			 * @param entry - The `RawDynamicConfigEntry` object containing the updated configuration data.
			 * @returns A promise that resolves to the updated entry from the database.
			 *
			 * @remarks
			 * This function uses the `dbService.makeQuery` utility to perform an update operation
			 * on the `tsDynamicConfigSettings` table, setting the fields based on the provided `entry`
			 * where the `id` matches. The updated entry is returned after the operation.
			 */
			const _update = dbService.makeQuery((ex, entry: RawDynamicConfigEntry) =>
				ex((db) =>
					db
						.update(tsDynamicConfigSettings)
						.set(entry)
						.where(eq(tsDynamicConfigSettings.id, entry.id))
						.returning()
						.get()
				)
			);

			/**
			 * Creates a new entry with the specified `id` and associated `data`.
			 *
			 * @template DataType - The type of the data to associate with the entry.
			 * @param id - The unique identifier for the entry.
			 * @param data - The data to be stored in the entry.
			 * @returns An Effect that, when executed, inserts the entry and yields the result.
			 */
			const create = Effect.fn(function* <DataType>(id: string, data: DataType) {
				const entry = castType<DataType>({ id, data });
				return yield* _insert(entry) as Effect.Effect<
					DynamicConfigEntry<DataType>,
					LibSQLClientError
				>;
			});

			/**
			 * Retrieves an entry by its ID and casts it to the specified data type.
			 *
			 * @template DataType - The expected type of the returned entry.
			 * @param id - The unique identifier of the entry to retrieve.
			 * @returns The entry cast to the specified type, or `undefined` if not found.
			 */
			const get = Effect.fn(function* <DataType>(id: string) {
				const entry = yield* _select(id);
				if (!entry) return undefined;
				return castType<DataType>(entry);
			});

			/**
			 * Updates an entry with the specified `id` and `data`.
			 *
			 * @template DataType - The type of the data to update.
			 * @param id - The unique identifier of the entry to update.
			 * @param data - The new data to associate with the entry.
			 * @returns An Effect yielding the result of the update operation.
			 */
			const update = Effect.fn(function* <DataType>(id: string, data: DataType) {
				const entry = castType<DataType>({ id, data });
				return yield* _update(entry) as Effect.Effect<
					DynamicConfigEntry<DataType>,
					LibSQLClientError
				>;
			});

			/**
			 * Runs a migration for a legacy configuration table entry to a new configuration format.
			 *
			 * This function retrieves a legacy configuration entry from the specified table using the provided legacy ID,
			 * applies a migration function to transform it into the new configuration format, and then creates a new entry
			 * with the specified new ID.
			 *
			 * @typeParam Table - The legacy table type to migrate from.
			 * @typeParam LegacyConfig - The inferred select type of the legacy table.
			 * @typeParam Config - The new configuration type to migrate to.
			 * @param opts - The migration options.
			 * @param opts.table - The legacy table to migrate from.
			 * @param opts.legacyId - The ID of the legacy configuration entry.
			 * @param opts.migrate - The migration function that transforms the legacy configuration to the new format.
			 * @param opts.newId - The ID for the new configuration entry.
			 * @returns The result of the creation operation, or `undefined` if the legacy configuration was not found.
			 */
			const runMigration = Effect.fn(function* <
				Table extends LegacyTables,
				LegacyConfig extends Table extends LegacySiteConfig
					? LegacySiteConfig['$inferSelect']
					: Table extends LegacyMailerConfig
						? LegacyMailerConfig['$inferSelect']
						: Table extends LegacyNotificationSettings
							? LegacyNotificationSettings['$inferSelect']
							: never,
				Config extends Table extends LegacySiteConfig
					? StudioCMSSiteConfig
					: Table extends LegacyMailerConfig
						? StudioCMSMailerConfig
						: Table extends LegacyNotificationSettings
							? StudioCMSNotificationSettings
							: never,
			>(opts: {
				table: Table;
				legacyId: string | number;
				migrate: (legacyConfig: LegacyConfig) => Config;
				newId: string;
			}) {
				const { table, legacyId, migrate, newId } = opts;

				const legacyConfig = (yield* dbService.execute((db) =>
					db.select().from(table).where(eq(table.id, legacyId)).get()
				)) as LegacyConfig | undefined;

				if (!legacyConfig) return;

				const newConfig = migrate(legacyConfig);
				return yield* create(newId, newConfig);
			});

			/**
			 * Retrieves a dynamic configuration entry by its ID. If the entry does not exist
			 * or its configuration version does not match the current version, runs a migration
			 * using the provided migration options and returns the migrated entry.
			 *
			 * @template DataType - The type of the dynamic configuration data.
			 * @param id - The unique identifier of the configuration entry to retrieve.
			 * @param migrationOpts - Options for migrating legacy configuration entries.
			 * @param migrationOpts.table - The legacy table to use for migration.
			 * @param migrationOpts.legacyId - The identifier of the legacy configuration entry.
			 * @param migrationOpts.migrate - A function that transforms the legacy configuration into the new format.
			 * @param migrationOpts.newId - The new identifier to assign to the migrated configuration entry.
			 * @returns The configuration entry of type `DataType`, either retrieved or migrated.
			 */
			const dynamicGet = Effect.fn(function* <DataType extends StudioCMSDynamicConfigBase>(
				id: string,
				migrationOpts: {
					table: LegacyTables;
					legacyId: string | number;
					// biome-ignore lint/suspicious/noExplicitAny: the actual type is too complex
					migrate: (legacyConfig: any) => DataType;
					newId: string;
				}
			) {
				const entry = yield* get<DataType>(id);
				// If missing, migrate from legacy (first-time population)
				if (!entry) {
					return yield* runMigration(migrationOpts) as Effect.Effect<
						DynamicConfigEntry<DataType> | undefined,
						LibSQLClientError
					>;
				}
				// If present but outdated, bump in-place to avoid UNIQUE conflicts and preserve user data
				if (entry.data._config_version !== CURRENT_CONFIG_VERSION) {
					return yield* update<DataType>(id, {
						...entry.data,
						_config_version: CURRENT_CONFIG_VERSION,
					} as DataType);
				}
				return entry;
			});

			/**
			 * Updates a dynamic configuration entry by merging new data into the existing entry.
			 *
			 * @template DataType - The type of the dynamic configuration data.
			 * @param id - The unique identifier of the configuration entry to update.
			 * @param data - The new data to merge into the existing configuration entry.
			 * @returns The updated configuration entry if it exists, otherwise `undefined`.
			 *
			 * @remarks
			 * This function retrieves the existing configuration entry by its ID, merges the provided data into it,
			 * and then updates the entry in the data store. If the entry does not exist, it returns `undefined`.
			 */
			const dynamicUpdate = Effect.fn(function* <DataType extends StudioCMSDynamicConfigBase>(
				id: string,
				data: DataType
			) {
				const entry = yield* get<DataType>(id);
				if (!entry) return undefined;
				const updatedEntry = (yield* merge((m) => m(entry.data, data))) as DataType;
				return yield* update<DataType>(id, updatedEntry) as Effect.Effect<
					DynamicConfigEntry<DataType>,
					LibSQLClientError,
					never
				>;
			});

			/**
			 * Provides methods to interact with the site configuration.
			 */
			const siteConfig = {
				/**
				 * Retrieves the current site configuration.
				 */
				get: () =>
					dynamicGet<StudioCMSSiteConfig>(Next_SiteConfigId, {
						table: tsSiteConfig,
						legacyId: CMSSiteConfigId,
						migrate: migrateLegacySiteConfig,
						newId: Next_SiteConfigId,
					}),

				/**
				 * Updates the site configuration with the provided data.
				 * @param data The new configuration data, excluding the internal version field.
				 * @returns The updated site configuration.
				 */
				update: (data: ConfigFinal<StudioCMSSiteConfig>) =>
					dynamicUpdate<StudioCMSSiteConfig>(Next_SiteConfigId, {
						...data,
						_config_version: CURRENT_CONFIG_VERSION,
					}),

				/**
				 * Initializes the site configuration with the provided data.
				 * @param data The initial configuration data, excluding the internal version field.
				 * @returns The created site configuration.
				 */
				init: (data: ConfigFinal<StudioCMSSiteConfig>) =>
					create<StudioCMSSiteConfig>(Next_SiteConfigId, {
						...data,
						_config_version: CURRENT_CONFIG_VERSION,
					}),
			};

			/**
			 * Provides methods to interact with the StudioCMS mailer configuration.
			 */
			const mailerConfig = {
				/**
				 * Retrieves the current mailer configuration.
				 */
				get: () =>
					dynamicGet<StudioCMSMailerConfig>(Next_MailerConfigId, {
						table: tsMailerConfig,
						legacyId: CMSMailerConfigId,
						migrate: migrateLegacyMailerConfig,
						newId: Next_MailerConfigId,
					}),

				/**
				 * Updates the mailer configuration with the provided data.
				 * @param data The new configuration data, excluding the internal version field.
				 * @returns The updated mailer configuration.
				 */
				update: (data: ConfigFinal<StudioCMSMailerConfig>) =>
					dynamicUpdate<StudioCMSMailerConfig>(Next_MailerConfigId, {
						...data,
						_config_version: CURRENT_CONFIG_VERSION,
					}),

				/**
				 * Initializes the mailer configuration with the provided data.
				 * @param data The initial configuration data, excluding the internal version field.
				 * @returns The created mailer configuration.
				 */
				init: (data: ConfigFinal<StudioCMSMailerConfig>) =>
					create<StudioCMSMailerConfig>(Next_MailerConfigId, {
						...data,
						_config_version: CURRENT_CONFIG_VERSION,
					}),
			};

			/**
			 * Provides methods to interact with the notification settings configuration.
			 */
			const notificationConfig = {
				/**
				 * Retrieves the current notification settings.
				 */
				get: () =>
					dynamicGet<StudioCMSNotificationSettings>(Next_NotificationSettingsId, {
						table: tsNotificationSettings,
						legacyId: CMSNotificationSettingsId,
						migrate: migrateLegacyNotificationSettings,
						newId: Next_NotificationSettingsId,
					}),

				/**
				 * Updates the notification settings with the provided data.
				 * @param data The new notification settings, excluding the `_config_version` property.
				 * @returns A promise resolving to the updated `StudioCMSNotificationSettings`.
				 */
				update: (data: ConfigFinal<StudioCMSNotificationSettings>) =>
					dynamicUpdate<StudioCMSNotificationSettings>(Next_NotificationSettingsId, {
						...data,
						_config_version: CURRENT_CONFIG_VERSION,
					}),

				/**
				 * Initializes the notification settings with the provided data.
				 * @param data The initial configuration data, excluding the internal version field.
				 * @returns The created notification settings.
				 */
				init: (data: ConfigFinal<StudioCMSNotificationSettings>) =>
					create<StudioCMSNotificationSettings>(Next_NotificationSettingsId, {
						...data,
						_config_version: CURRENT_CONFIG_VERSION,
					}),
			};

			return { siteConfig, mailerConfig, notificationConfig } as const;
		}),
	}
) {}
