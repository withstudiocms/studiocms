import {
	loadConfigFile as _loadConfigFile,
	parseAndMerge as _parseAndMerge,
} from '@withstudiocms/config-utils';
import { getDBClientLive } from '@withstudiocms/kysely';
import type { StudioCMSDatabaseSchema } from '@withstudiocms/sdk/tables';
import { configPaths } from '../consts.js';
import { Effect } from '../effect.js';
import { type StudioCMSOptions, StudioCMSOptionsSchema } from '../schemas/index.js';
import { type DbDialectType, getDbDriver, parseDbDialect } from './index.js';

export * from '@withstudiocms/kysely/plugin';

/**
 * Load the StudioCMS configuration from the specified root URL
 */
const loadConfigFile = Effect.fn((root: URL) =>
	Effect.tryPromise(() =>
		_loadConfigFile<StudioCMSOptions>(root, configPaths, 'studiocms-db-plugin')
	)
);

/**
 * Parse and merge the loaded configuration with the default configuration
 */
const parseAndMerge = Effect.fn((config: StudioCMSOptions | undefined) =>
	Effect.try(() => _parseAndMerge(StudioCMSOptionsSchema, config))
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
