import { Deepmerge, Effect, Schema } from '@withstudiocms/effect';
import type { DatabaseError } from '@withstudiocms/kysely/core/errors';
import { StudioCMSDynamicConfigSettings } from '@withstudiocms/kysely/tables';
import { CacheService } from '../../cache.js';
import { DBClientLive } from '../../context.js';
import {
	MailerConfigId,
	MailerConfigVersion,
	NotificationSettingsId,
	NotificationSettingsVersion,
	SiteConfigId,
	SiteConfigVersion,
	TemplateConfigId,
	TemplateConfigVersion,
} from './consts.js';
import defaultTemplates from './templates/mailer.js';
import type {
	ConfigFinal,
	DynamicConfigEntry,
	StudioCMSMailerConfig,
	StudioCMSNotificationSettings,
	StudioCMSSiteConfig,
	StudioCMSTemplateConfig,
} from './types.js';

/**
 * StudioCMS Configuration Modules
 */
export const SDKConfigModule = Effect.gen(function* () {
	const [{ db, withCodec }, { merge }, cache] = yield* Effect.all([
		DBClientLive,
		Deepmerge,
		CacheService,
	]);

	/**
	 * Generates a cache key for the given configuration ID.
	 *
	 * @param id - The configuration ID.
	 * @returns The generated cache key.
	 */
	const cacheKey = (id: string) => `dynamic-config:${id}`;

	/**
	 * Inserts a new dynamic configuration setting into the database.
	 *
	 * @param data - The dynamic configuration setting data to insert.
	 * @returns An effect that yields the inserted dynamic configuration entry or a database error.
	 */
	const _insert = withCodec({
		decoder: StudioCMSDynamicConfigSettings.Select,
		encoder: StudioCMSDynamicConfigSettings.Insert,
		query: (data) =>
			db
				.insertInto('StudioCMSDynamicConfigSettings')
				.values(data)
				.returning(['id', 'data'])
				.executeTakeFirstOrThrow(),
	});

	/**
	 * Selects a dynamic configuration setting from the database by its ID.
	 *
	 * @param id - The ID of the dynamic configuration setting to select.
	 * @returns An effect that yields the selected dynamic configuration entry or undefined if not found, or a database error.
	 */
	const _select = withCodec({
		decoder: Schema.UndefinedOr(StudioCMSDynamicConfigSettings.Select),
		encoder: Schema.String,
		query: (id) =>
			db
				.selectFrom('StudioCMSDynamicConfigSettings')
				.selectAll()
				.where('id', '=', id)
				.executeTakeFirstOrThrow(),
	});

	/**
	 * Updates an existing dynamic configuration setting in the database.
	 *
	 * @param param0 - An object containing the ID of the configuration setting to update and the new data.
	 * @returns An effect that yields the updated dynamic configuration entry or a database error.
	 */
	const _update = withCodec({
		decoder: StudioCMSDynamicConfigSettings.Select,
		encoder: StudioCMSDynamicConfigSettings.Update,
		query: ({ id, data }) =>
			db
				.updateTable('StudioCMSDynamicConfigSettings')
				.set({ data })
				.where('id', '=', id)
				.returning(['id', 'data'])
				.executeTakeFirstOrThrow(),
	});

	/**
	 * Creates a new dynamic configuration entry in the database and updates the cache.
	 *
	 * @param id - The ID of the configuration entry to create.
	 * @param data - The configuration data to store.
	 * @returns An effect that yields the created dynamic configuration entry or a database error.
	 */
	const create = Effect.fn(function* <DataType>(id: string, data: DataType) {
		return yield* _insert({ id, data: JSON.stringify(data) }).pipe(
			Effect.tap(() => cache.set<DataType>(cacheKey(id), data, { tags: ['dynamic-config'] }))
		) as Effect.Effect<DynamicConfigEntry<DataType>, DatabaseError>;
	});

	/**
	 * Retrieves a dynamic configuration entry from the cache or database.
	 *
	 * @param id - The ID of the configuration entry to retrieve.
	 * @returns An effect that yields the dynamic configuration entry or undefined if not found, or a database error.
	 */
	const get = Effect.fn(function* <DataType>(id: string) {
		// Try to get from cache first
		const cached = yield* cache.get<DataType>(cacheKey(id));

		// If not in cache, fetch from DB and populate cache
		if (!cached) {
			// Fetch from DB
			const uncached = yield* _select(id);

			// If not found in DB, return undefined
			if (!uncached) {
				return undefined;
			}

			// Parse and cache
			const parsedData = uncached.data as DataType;

			// Update cache
			yield* cache.set<DataType>(cacheKey(id), parsedData, { tags: ['dynamic-config'] });

			// Return result
			return {
				id: uncached.id,
				data: parsedData,
			} as DynamicConfigEntry<DataType>;
		}

		// Return cached value
		return {
			id,
			data: cached,
		} as DynamicConfigEntry<DataType>;
	});

	/**
	 * Updates an existing dynamic configuration entry in the database and updates the cache.
	 *
	 * @param id - The ID of the configuration entry to update.
	 * @param data - The new configuration data to store.
	 * @returns An effect that yields the updated dynamic configuration entry or a database error.
	 */
	const update = Effect.fn(function* <DataType>(id: string, data: DataType) {
		return yield* _update({ id, data: JSON.stringify(data) }).pipe(
			Effect.tap(() => cache.set<DataType>(cacheKey(id), data, { tags: ['dynamic-config'] }))
		) as Effect.Effect<DynamicConfigEntry<DataType>, DatabaseError>;
	});

	/**
	 * StudioCMS Site Configuration Module
	 */
	const siteConfig = {
		/**
		 * Retrieves the site configuration.
		 *
		 * @returns An effect that yields the site configuration entry or undefined if not found, or a database error.
		 */
		get: () => get<StudioCMSSiteConfig>(SiteConfigId),

		/**
		 * Updates the site configuration.
		 *
		 * @param data - The new site configuration data to store.
		 * @returns An effect that yields the updated site configuration entry or a database error.
		 */
		update: (data: ConfigFinal<StudioCMSSiteConfig>) =>
			update<StudioCMSSiteConfig>(SiteConfigId, { ...data, _config_version: SiteConfigVersion }),

		/**
		 * Initializes the site configuration.
		 *
		 * @param data - The site configuration data to store.
		 * @returns An effect that yields the created site configuration entry or a database error.
		 */
		init: (data: ConfigFinal<StudioCMSSiteConfig>) =>
			create<StudioCMSSiteConfig>(SiteConfigId, { ...data, _config_version: SiteConfigVersion }),
	};

	/**
	 * StudioCMS Mailer Configuration Module
	 */
	const mailerConfig = {
		/**
		 * Retrieves the mailer configuration.
		 *
		 * @returns An effect that yields the mailer configuration entry or undefined if not found, or a database error.
		 */
		get: () => get<StudioCMSMailerConfig>(MailerConfigId),

		/**
		 * Updates the mailer configuration.
		 *
		 * @param data - The new mailer configuration data to store.
		 * @returns An effect that yields the updated mailer configuration entry or a database error.
		 */
		update: (data: ConfigFinal<StudioCMSMailerConfig>) =>
			update<StudioCMSMailerConfig>(MailerConfigId, {
				...data,
				_config_version: MailerConfigVersion,
			}),

		/**
		 * Initializes the mailer configuration.
		 *
		 * @param data - The mailer configuration data to store.
		 * @returns An effect that yields the created mailer configuration entry or a database error.
		 */
		init: (data: ConfigFinal<StudioCMSMailerConfig>) =>
			create<StudioCMSMailerConfig>(MailerConfigId, {
				...data,
				_config_version: MailerConfigVersion,
			}),
	};

	/**
	 * StudioCMS Notification Settings Configuration Module
	 */
	const notificationConfig = {
		/**
		 * Retrieves the notification settings configuration.
		 *
		 * @returns An effect that yields the notification settings configuration entry or undefined if not found, or a database error.
		 */
		get: () => get<StudioCMSNotificationSettings>(NotificationSettingsId),

		/**
		 * Updates the notification settings configuration.
		 *
		 * @param data - The new notification settings configuration data to store.
		 * @returns An effect that yields the updated notification settings configuration entry or a database error.
		 */
		update: (data: ConfigFinal<StudioCMSNotificationSettings>) =>
			update<StudioCMSNotificationSettings>(NotificationSettingsId, {
				...data,
				_config_version: NotificationSettingsVersion,
			}),

		/**
		 * Initializes the notification settings configuration.
		 *
		 * @param data - The notification settings configuration data to store.
		 * @returns An effect that yields the created notification settings configuration entry or a database error.
		 */
		init: (data: ConfigFinal<StudioCMSNotificationSettings>) =>
			create<StudioCMSNotificationSettings>(NotificationSettingsId, {
				...data,
				_config_version: NotificationSettingsVersion,
			}),
	};

	/**
	 * StudioCMS Template Configuration Module
	 */
	const templateConfig = {
		/**
		 * Retrieves the template configuration.
		 *
		 * @returns An effect that yields the template configuration entry or undefined if not found, or a database error.
		 */
		get: () => get<StudioCMSTemplateConfig>(TemplateConfigId),

		/**
		 * Updates the template configuration by merging with existing data.
		 *
		 * @param data - The new template configuration data to merge and store.
		 * @returns An effect that yields the updated template configuration entry or a database error.
		 */
		update: (data: ConfigFinal<StudioCMSTemplateConfig>) =>
			Effect.gen(function* () {
				const currentData = yield* get<StudioCMSTemplateConfig>(TemplateConfigId);
				if (!currentData) {
					// If no current data, create new with defaults merged in (this should not happen often)
					const updatedData = yield* merge((m) => m(defaultTemplates, data));
					return yield* create<StudioCMSTemplateConfig>(TemplateConfigId, {
						...updatedData,
						_config_version: TemplateConfigVersion,
					});
				}
				const updatedData = yield* merge((m) => m(currentData.data, data));
				return yield* update<StudioCMSTemplateConfig>(TemplateConfigId, {
					...updatedData,
					_config_version: TemplateConfigVersion,
				});
			}),

		/**
		 * Initializes the template configuration.
		 *
		 * @param data - The template configuration data to store.
		 * @returns An effect that yields the created template configuration entry or a database error.
		 */
		init: (data: ConfigFinal<StudioCMSTemplateConfig>) =>
			create<StudioCMSTemplateConfig>(TemplateConfigId, {
				...data,
				_config_version: TemplateConfigVersion,
			}),
	};

	return {
		siteConfig,
		mailerConfig,
		notificationConfig,
		templateConfig,
	} as const;
});
