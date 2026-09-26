import { Config, Effect, Redacted } from 'effect';
import type { MySqlConfig } from '../type.js';

/**
 * Effect to retrieve MySQL database configuration from environment variables.
 */
const mysqlConfig = Effect.gen(function* () {
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
});

export default mysqlConfig;
