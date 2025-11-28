import {
	loadConfigFile as _loadConfigFile,
	parseAndMerge as _parseAndMerge,
} from '@withstudiocms/config-utils';
import { getDBClientLive, type StudioCMSDatabaseSchema } from '@withstudiocms/kysely';
import type { DatabaseDialect } from '@withstudiocms/kysely/plugin';
import { configPaths } from '../consts.js';
import { Effect } from '../effect.js';
import { type StudioCMSOptions, StudioCMSOptionsSchema } from '../schemas/index.js';
import { type DbDialectType, getDbDriver, parseDbDialect } from './index.js';

export * from '@withstudiocms/kysely/plugin';

/**
 * Load the StudioCMS configuration from the specified root URL
 */
const loadConfigFile = Effect.fn((root: URL) =>
	Effect.tryPromise(() => _loadConfigFile<StudioCMSOptions>(root, configPaths, 'migrator'))
);

/* Base config with default values */
const defaultConfig = StudioCMSOptionsSchema.parse({});

/**
 * Parse and merge the loaded configuration with the default configuration
 */
const parseAndMerge = Effect.fn((config: StudioCMSOptions) =>
	Effect.try(() => _parseAndMerge(StudioCMSOptionsSchema, defaultConfig, config))
);

/**
 * Effect to load and merge the StudioCMS configuration
 */
const loadConfig = (root: URL) => loadConfigFile(root).pipe(Effect.flatMap(parseAndMerge));

/**
 * Effect to retrieve the database dialect from the configuration
 *
 * @param root - The root URL to load the configuration from
 *   - Root URL can be obtained via the `config.root` property from the `astro:config:setup` integration hook
 */
export const getDBClientDialect = Effect.fn((root: URL) =>
	loadConfig(root).pipe(Effect.map((config) => config.db.dialect as DbDialectType))
);

/**
 * Get a Kysely DB Plugin Client for the specified dialect
 */
export const getDbPluginClient = <Schema>(driverDialect: DbDialectType) =>
	parseDbDialect(driverDialect).pipe(
		Effect.flatMap(getDbDriver),
		Effect.flatMap(getDBClientLive<StudioCMSDatabaseSchema & Schema>)
	);

/**
 * Get the appropriate DatabaseDialect for the Table Manager based on the configuration
 */
export const getTableManagerDialect = Effect.fn((root: URL) =>
	getDBClientDialect(root).pipe(
		Effect.map((dialect) => (dialect === 'libsql' ? 'sqlite' : dialect) as DatabaseDialect)
	)
);
