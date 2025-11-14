import { Config, Effect, Redacted } from 'effect';
import { MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';

/**
 * Effect that creates and returns a configured MysqlDialect.
 *
 * Reads configuration from environment (via Config.*) using the following keys:
 * - `STUDIOCMS_MYSQL_DATABASE` (string)
 * - `STUDIOCMS_MYSQL_HOST` (string)
 * - `STUDIOCMS_MYSQL_PORT` (number)
 * - `STUDIOCMS_MYSQL_USER` (redacted string)
 * - `STUDIOCMS_MYSQL_PASSWORD` (redacted string)
 *
 * The effect constructs a connection pool using createPool and passes it to a new MysqlDialect.
 * The pool is created with the provided database, host, port, and credentials, and uses a
 * connectionLimit of 10. Credentials are unwrapped with Redacted.value before being supplied
 * to the pool.
 *
 * The returned value is an Effect which, when executed, will either fail if any required
 * configuration is missing or invalid, or succeed with a MysqlDialect instance wired to the pool.
 *
 * @remarks
 * - The effect is lazy: resources (the pool) are created only when the effect is executed.
 * - Consumer code is responsible for any lifecycle management of the pool/dialect if required.
 *
 * @returns An Effect that resolves to a configured MysqlDialect ready for use with Kysely.
 */
export const mysqlDriver = Effect.gen(function* () {
	const database = yield* Config.string('CMS_MYSQL_DATABASE');
	const host = yield* Config.string('CMS_MYSQL_HOST');
	const port = yield* Config.number('CMS_MYSQL_PORT');
	const user = yield* Config.redacted('CMS_MYSQL_USER');
	const password = yield* Config.redacted('CMS_MYSQL_PASSWORD');

	return new MysqlDialect({
		pool: createPool({
			database,
			host,
			port,
			user: Redacted.value(user),
			password: Redacted.value(password),
			connectionLimit: 10,
		}),
	});
});
