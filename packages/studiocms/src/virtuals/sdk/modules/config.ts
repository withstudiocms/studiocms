import { eq } from 'astro:db';
import {
	CMSMailerConfigId,
	CMSSiteConfigId,
	Next_MailerConfigId,
	Next_SiteConfigId,
} from '../../../consts.js';
import { Deepmerge, Effect } from '../../../effect.js';
import { AstroDB } from '../effect/db.js';
import { tsDynamicConfigSettings, tsMailerConfig, tsSiteConfig } from '../tables.js';

export type RawDynamicConfigEntry = typeof tsDynamicConfigSettings.$inferSelect;

export type DynamicConfigEntry<T> = {
	id: string;
	data: T;
};

type LegacySiteConfig = typeof tsSiteConfig;
type LegacyMailerConfig = typeof tsMailerConfig;

type LegacyTables = LegacySiteConfig | LegacyMailerConfig;

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

export const castType = <T>({ data, id }: RawDynamicConfigEntry): DynamicConfigEntry<T> => ({
	id,
	data: data as T,
});

const migrateLegacySiteConfig = ({
	id,
	gridItems,
	...legacyConfig
}: typeof tsSiteConfig.$inferSelect): StudioCMSSiteConfig => ({
	...legacyConfig,
	gridItems: (gridItems ?? []) as string[],
	_config_version: '1.0.0',
});

const migrateLegacyMailerConfig = ({
	id,
	...legacyConfig
}: typeof tsMailerConfig.$inferSelect): StudioCMSMailerConfig => ({
	...legacyConfig,
	_config_version: '1.0.0',
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
					: LegacyMailerConfig['$inferSelect'],
				Config extends Table extends LegacySiteConfig ? StudioCMSSiteConfig : StudioCMSMailerConfig,
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

			const siteConfig = {
				get: Effect.fn(function* () {
					const entry = yield* get<StudioCMSSiteConfig>(Next_SiteConfigId);
					if (!entry || entry.data._config_version !== '1.0.0') {
						return yield* runMigration({
							table: tsSiteConfig,
							legacyId: CMSSiteConfigId,
							migrate: migrateLegacySiteConfig,
							newId: Next_SiteConfigId,
						});
					}
					return entry;
				}),
				update: Effect.fn(function* (data: Omit<StudioCMSSiteConfig, ' _config_version'>) {
					const entry = yield* get<StudioCMSSiteConfig>(Next_SiteConfigId);
					if (!entry) return undefined;
					const updatedEntry = yield* merge((m) => m(entry.data, data));
					return yield* update<StudioCMSSiteConfig>(Next_SiteConfigId, updatedEntry);
				}),
			};

			const mailerConfig = {
				get: Effect.fn(function* () {
					const entry = yield* get<StudioCMSMailerConfig>(Next_MailerConfigId);
					if (!entry || entry.data._config_version !== '1.0.0') {
						return yield* runMigration({
							table: tsMailerConfig,
							legacyId: CMSMailerConfigId,
							migrate: migrateLegacyMailerConfig,
							newId: Next_MailerConfigId,
						});
					}
					return entry;
				}),
				update: Effect.fn(function* (data: Omit<StudioCMSMailerConfig, ' _config_version'>) {
					const entry = yield* get<StudioCMSMailerConfig>(Next_MailerConfigId);
					if (!entry) return undefined;
					const updatedEntry = yield* merge((m) => m(entry.data, data));
					return yield* update<StudioCMSMailerConfig>(Next_MailerConfigId, updatedEntry);
				}),
			};

			return { siteConfig, mailerConfig } as const;
		}),
	}
) {}
