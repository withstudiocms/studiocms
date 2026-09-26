import { Config, Effect, Redacted } from 'effect';
import type { TursoConfig } from '../type.js';

/**
 * Effect to retrieve Turso (LibSQL) database configuration from environment variables.
 */
const tursoConfig = Effect.gen(function* () {
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
});

export default tursoConfig;
