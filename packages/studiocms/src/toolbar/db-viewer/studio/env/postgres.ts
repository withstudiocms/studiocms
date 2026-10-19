import { Config, Effect, Redacted } from 'effect';
import type { PostgresConfig } from '../type.js';

/**
 * Effect to retrieve Postgres database configuration from environment variables.
 */
const postgresConfig = Effect.gen(function* () {
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
});

export default postgresConfig;
