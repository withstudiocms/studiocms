import { root } from 'astro:config/server';
import { db } from 'studiocms:config';
import { runEffect } from '@withstudiocms/effect';
import { Config, Effect, Redacted } from 'effect';
import { createConnectionFromConfig } from './connection.js';
import type BaseDriver from './drivers/base.js';
import type { JsonConnectionConfig, MySqlConfig, PostgresConfig, TursoConfig } from './type.js';

export * from '../db-shared-types.js';
export { default as BaseDriver } from './drivers/base.js';
export * from './type.js';

/**
 * Retrieves the database dialect configuration based on environment variables.
 *
 * @returns {Promise<JsonConnectionConfig>} The database dialect configuration.
 */
async function getDialectConfig(): Promise<JsonConnectionConfig> {
	switch (db.dialect) {
		case 'libsql': {
			return await runEffect(
				Effect.gen(function* () {
					const url = yield* Config.redacted('CMS_LIBSQL_URL');
					const authToken = yield* Config.redacted('CMS_LIBSQL_AUTH_TOKEN');

					const config: TursoConfig = {
						driver: 'turso',
						connection: {
							url: Redacted.value(url),
							token: Redacted.value(authToken),
						},
					};

					return config;
				})
			);
		}
		case 'mysql': {
			return runEffect(
				Effect.gen(function* () {
					const database = yield* Config.string('CMS_MYSQL_DATABASE');
					const host = yield* Config.string('CMS_MYSQL_HOST');
					const port = yield* Config.number('CMS_MYSQL_PORT');
					const user = yield* Config.redacted('CMS_MYSQL_USER');
					const password = yield* Config.redacted('CMS_MYSQL_PASSWORD');

					const config: MySqlConfig = {
						driver: 'mysql',
						connection: {
							database,
							host,
							port,
							user: Redacted.value(user),
							password: Redacted.value(password),
						},
					};

					return config;
				})
			);
		}
		case 'postgres': {
			return runEffect(
				Effect.gen(function* () {
					const database = yield* Config.string('CMS_PG_DATABASE');
					const host = yield* Config.string('CMS_PG_HOST');
					const port = yield* Config.number('CMS_PG_PORT');
					const user = yield* Config.redacted('CMS_PG_USER');
					const password = yield* Config.redacted('CMS_PG_PASSWORD');

					const config: PostgresConfig = {
						driver: 'postgres',
						connection: {
							database,
							host,
							port,
							user: Redacted.value(user),
							password: Redacted.value(password),
						},
					};

					return config;
				})
			);
		}
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
