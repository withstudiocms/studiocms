import { Config, Effect, Redacted } from 'effect';
import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';

/**
 * An Effect that constructs and returns a configured PostgresDialect instance.
 *
 * This generator reads database connection configuration from the environment
 * (via the Config helpers) and creates a new pg Pool which is passed to the
 * PostgresDialect constructor.
 *
 * Configuration keys read:
 * - `STUDIOCMS_PG_DATABASE`: database name (string)
 * - `STUDIOCMS_PG_HOST`: database host (string)
 * - `STUDIOCMS_PG_PORT`: database port (number)
 * - `STUDIOCMS_PG_USER`: database user (redacted string)
 * - `STUDIOCMS_PG_PASSWORD`: database password (redacted string)
 *
 * Notes:
 * - The user and password values are handled as redacted secrets and are
 *   unwrapped using Redacted.value before being supplied to the Pool.
 * - The underlying pg Pool is created with a maximum of 10 connections by
 *   default.
 * - If required configuration values are missing or invalid, the Effect will
 *   fail according to the Config helper semantics.
 *
 * @returns Effect<never, Error, PostgresDialect> An effect that, when executed,
 *          yields a PostgresDialect configured with a pg Pool.
 */
export const postgresDriver = Effect.gen(function* () {
	const database = yield* Config.string('STUDIOCMS_PG_DATABASE');
	const host = yield* Config.string('STUDIOCMS_PG_HOST');
	const port = yield* Config.number('STUDIOCMS_PG_PORT');
	const user = yield* Config.redacted('STUDIOCMS_PG_USER');
	const password = yield* Config.redacted('STUDIOCMS_PG_PASSWORD');

	return new PostgresDialect({
		pool: new Pool({
			database,
			host,
			port,
			user: Redacted.value(user),
			password: Redacted.value(password),
			max: 10,
		}),
	});
});
