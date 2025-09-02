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
import { AstroDB } from '../effect/db.js';
import {
	tsDynamicConfigSettings,
	tsMailerConfig,
	tsNotificationSettings,
	tsSiteConfig,
} from '../tables.js';

export type RawDynamicConfigEntry = typeof tsDynamicConfigSettings.$inferSelect;

export type DynamicConfigEntry<T> = {
	id: string;
	data: T;
};

export type LegacySiteConfig = typeof tsSiteConfig;
export type LegacyMailerConfig = typeof tsMailerConfig;
export type LegacyNotificationSettings = typeof tsNotificationSettings;

export type LegacyTables = LegacySiteConfig | LegacyMailerConfig | LegacyNotificationSettings;

export interface StudioCMSDynamicConfigBase {
	_config_version: string;
}

export interface StudioCMSSiteConfig extends StudioCMSDynamicConfigBase {
	description: string;
	title: string;
	defaultOgImage?: string | null | undefined;
	siteIcon?: string | null | undefined;
	loginPageBackground?: string | undefined;
	loginPageCustomImage?: string | null | undefined;
	enableDiffs?: boolean | undefined;
	diffPerPage?: number | undefined;
	gridItems?: string[];
	enableMailer?: boolean | undefined;
	hideDefaultIndex?: boolean | undefined;
}

export interface StudioCMSMailerConfig extends StudioCMSDynamicConfigBase {
	host: string;
	port: number;
	secure: boolean;
	proxy?: string | null | undefined;
	auth_user?: string | null | undefined;
	auth_pass?: string | null | undefined;
	tls_rejectUnauthorized?: boolean | null | undefined;
	tls_servername?: string | null | undefined;
	default_sender: string;
}

export interface StudioCMSNotificationSettings extends StudioCMSDynamicConfigBase {
	emailVerification?: boolean | undefined;
	requireAdminVerification?: boolean | undefined;
	requireEditorVerification?: boolean | undefined;
	oAuthBypassVerification?: boolean | undefined;
}

export const castType = <T>({ data, id }: RawDynamicConfigEntry): DynamicConfigEntry<T> => ({
	id,
	data: data as T,
});

export const CURRENT_CONFIG_VERSION = '1.0.0';

export const migrateLegacySiteConfig = ({
	id,
	gridItems,
	...legacyConfig
}: typeof tsSiteConfig.$inferSelect): StudioCMSSiteConfig => ({
	...legacyConfig,
	gridItems: (gridItems ?? []) as string[],
	_config_version: CURRENT_CONFIG_VERSION,
});

export const migrateLegacyMailerConfig = ({
	id,
	...legacyConfig
}: typeof tsMailerConfig.$inferSelect): StudioCMSMailerConfig => ({
	...legacyConfig,
	_config_version: CURRENT_CONFIG_VERSION,
});

export const migrateLegacyNotificationSettings = ({
	id,
	...legacyConfig
}: typeof tsNotificationSettings.$inferSelect): StudioCMSNotificationSettings => ({
	...legacyConfig,
	_config_version: CURRENT_CONFIG_VERSION,
});

export class SDKCore_CONFIG extends Effect.Service<SDKCore_CONFIG>()(
	'studiocms/sdk/modules/SDKCore_CONFIG',
	{
		effect: Effect.gen(function* () {
			const dbService = yield* AstroDB;
			const { merge } = yield* Deepmerge;

			const _insert = dbService.makeQuery((ex, entry: RawDynamicConfigEntry) =>
				ex((db) => db.insert(tsDynamicConfigSettings).values(entry).returning().get())
			);

			const _select = dbService.makeQuery((ex, id: string) =>
				ex((db) =>
					db.select().from(tsDynamicConfigSettings).where(eq(tsDynamicConfigSettings.id, id)).get()
				)
			);

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

			const create = Effect.fn(function* <DataType>(id: string, data: DataType) {
				const entry = castType<DataType>({ id, data });
				yield* _insert(entry);
				return entry;
			});

			const get = Effect.fn(function* <DataType>(id: string) {
				const entry = yield* _select(id);

				if (!entry) return undefined;

				return castType<DataType>(entry);
			});

			const update = Effect.fn(function* <DataType>(id: string, data: DataType) {
				const entry = castType<DataType>({ id, data });
				yield* _update(entry);
				return entry;
			});

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
				if (!entry || entry.data._config_version !== CURRENT_CONFIG_VERSION) {
					return yield* runMigration(migrationOpts);
				}
				return entry;
			});

			const dynamicUpdate = Effect.fn(function* <DataType extends StudioCMSDynamicConfigBase>(
				id: string,
				data: DataType
			) {
				const entry = yield* get<DataType>(id);
				if (!entry) return undefined;
				const updatedEntry = (yield* merge((m) => m(entry.data, data))) as DataType;
				return yield* update<DataType>(id, updatedEntry);
			});

			const siteConfig = {
				get: () =>
					dynamicGet<StudioCMSSiteConfig>(Next_SiteConfigId, {
						table: tsSiteConfig,
						legacyId: CMSSiteConfigId,
						migrate: migrateLegacySiteConfig,
						newId: Next_SiteConfigId,
					}),
				update: (data: Omit<StudioCMSSiteConfig, ' _config_version'>) =>
					dynamicUpdate<StudioCMSSiteConfig>(Next_SiteConfigId, data),
			};

			const mailerConfig = {
				get: () =>
					dynamicGet<StudioCMSMailerConfig>(Next_MailerConfigId, {
						table: tsMailerConfig,
						legacyId: CMSMailerConfigId,
						migrate: migrateLegacyMailerConfig,
						newId: Next_MailerConfigId,
					}),
				update: (data: Omit<StudioCMSMailerConfig, ' _config_version'>) =>
					dynamicUpdate<StudioCMSMailerConfig>(Next_MailerConfigId, data),
			};

			const notificationConfig = {
				get: () =>
					dynamicGet<StudioCMSNotificationSettings>(Next_NotificationSettingsId, {
						table: tsNotificationSettings,
						legacyId: CMSNotificationSettingsId,
						migrate: migrateLegacyNotificationSettings,
						newId: Next_NotificationSettingsId,
					}),
				update: (data: Omit<StudioCMSNotificationSettings, ' _config_version'>) =>
					dynamicUpdate<StudioCMSNotificationSettings>(Next_NotificationSettingsId, data),
			};

			return { siteConfig, mailerConfig, notificationConfig } as const;
		}),
	}
) {}
