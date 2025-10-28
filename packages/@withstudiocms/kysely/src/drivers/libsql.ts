import { LibsqlDialect } from '@libsql/kysely-libsql';
import { Config, Effect, Redacted } from 'effect';

/**
 * Effect that builds and returns a LibsqlDialect configured from environment-backed configuration.
 *
 * This generator reads the following configuration keys:
 * - `STUDIOCMS_LIBSQL_URL` (required, redacted) — connection URL for the libsql instance.
 * - `STUDIOCMS_LIBSQL_AUTH_TOKEN` (required, redacted) — authentication token for the libsql instance.
 * - `STUDIOCMS_LIBSQL_SYNC_INTERVAL` (optional) — synchronization interval in milliseconds. If not set, no interval is configured.
 * - `STUDIOCMS_LIBSQL_SYNC_URL` (optional, redacted) — optional sync URL. If not set, no sync URL is configured.
 *
 * Secrets (URL, auth token, sync URL) are obtained via the redacted config helpers and passed to the dialect via Redacted.value to preserve redaction semantics.
 *
 * The returned Effect yields a fully constructed LibsqlDialect instance:
 * - url: string (from STUDIOCMS_LIBSQL_URL)
 * - authToken: string (from STUDIOCMS_LIBSQL_AUTH_TOKEN)
 * - syncInterval?: number (from STUDIOCMS_LIBSQL_SYNC_INTERVAL, or undefined)
 * - syncUrl?: string (from STUDIOCMS_LIBSQL_SYNC_URL, or undefined)
 *
 * @remarks
 * - The effect will fail at runtime if required configuration keys (URL or auth token) are missing or invalid.
 * - Optional sync configuration is only applied when provided.
 *
 * @returns An Effect that, when executed, produces a configured LibsqlDialect instance.
 *
 * @example
 * // inside an Effect context:
 * // const dialect = yield* libsqlDriver();
 */
export const libsqlDriver = Effect.gen(function* () {
	const rawUrl = yield* Config.redacted('CMS_LIBSQL_URL');
	const authToken = yield* Config.withDefault(Config.redacted('CMS_LIBSQL_AUTH_TOKEN'), undefined);
	const syncInterval = yield* Config.withDefault(
		Config.number('CMS_LIBSQL_SYNC_INTERVAL'),
		undefined
	);
	const syncUrl = yield* Config.withDefault(Config.redacted('CMS_LIBSQL_SYNC_URL'), undefined);

	return new LibsqlDialect({
		url: Redacted.value(rawUrl),
		authToken: authToken ? Redacted.value(authToken) : undefined,
		syncInterval: syncInterval,
		syncUrl: syncUrl ? Redacted.value(syncUrl) : undefined,
	});
});
