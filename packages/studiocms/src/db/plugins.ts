import fs from 'node:fs';
import { loadConfigFile as _loadConfigFile } from '@withstudiocms/config-utils';
import { getDBClientLive } from '@withstudiocms/kysely/client';
import type { StudioCMSDatabaseSchema } from '@withstudiocms/sdk/tables';
import { configPaths } from '../consts.js';
import { Effect, Schema } from '../effect.js';
import { StudioCMSOptionsSchema } from '../schemas/index.js';
import { type DbDialectType, getDbDriver, parseDbDialect } from './index.js';

export * from '@withstudiocms/kysely/plugin';

/**
 * Load the StudioCMS configuration from the specified root URL
 */
const loadConfigFile = Effect.fn((root: URL) =>
	Effect.tryPromise(() =>
		_loadConfigFile({ configPaths, root, fs })
	)
);

/**
 * Parse the loaded configuration with the default configuration
 */

// biome-ignore lint/suspicious/noExplicitAny: dynamic config object
const  parse = Effect.fn((config: Record<string, any> | undefined) =>
	Schema.decode(StudioCMSOptionsSchema)(config ?? {})
);

/**
 * Effect to load and parse the StudioCMS configuration
 */
const loadConfig = (root: URL) => loadConfigFile(root).pipe(Effect.flatMap(parse));

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
