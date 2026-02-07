import { root } from 'astro:config/server';
import { db } from 'studiocms:config';
import { createConnectionFromConfig } from 'virtual:studiocms/db-studio/connection';
import { runEffect } from '@withstudiocms/effect';
import type { ConfigError, Effect } from 'effect';
import type BaseDriver from './drivers/base.js';
import tursoConfig from './env/libsql.js';
import mysqlConfig from './env/mysql.js';
import postgresConfig from './env/postgres.js';
import type { JsonConnectionConfig } from './type.js';

export * from '../db-shared-types.js';
export { default as BaseDriver } from './drivers/base.js';
export * from './type.js';

/**
 * Retrieves the database dialect configuration based on environment variables.
 *
 * @returns {Promise<JsonConnectionConfig>} The database dialect configuration.
 */
async function getDialectConfig(): Promise<JsonConnectionConfig> {
	let configEffect: Effect.Effect<JsonConnectionConfig, ConfigError.ConfigError, never>;

	switch (db.dialect) {
		case 'libsql': {
			configEffect = tursoConfig;
			break;
		}
		case 'mysql': {
			configEffect = mysqlConfig;
			break;
		}
		case 'postgres': {
			configEffect = postgresConfig;
			break;
		}
		default: {
			throw new Error(`Unsupported database dialect: ${db.dialect}`);
		}
	}

	try {
		const config = await runEffect(configEffect);
		return config;
	} catch (error) {
		throw new Error(`Failed to retrieve database configuration: ${(error as Error).message}`);
	}
}

/**
 * Initializes and returns the appropriate database driver based on the configuration.
 *
 * @returns {Promise<BaseDriver>} The initialized database driver.
 * @throws {Error} If the driver cannot be created from the configuration.
 */
export async function getDriver(): Promise<BaseDriver> {
	const config = await getDialectConfig();

	const driver = createConnectionFromConfig(root.href, config);

	if (!driver || driver === undefined) {
		throw new Error('Could not create driver from configuration');
	}

	return driver;
}
