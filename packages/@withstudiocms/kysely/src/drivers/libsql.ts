import { createClient, type Config as LibSQLConfig } from '@libsql/client/node';
import { Config, Effect, Redacted } from 'effect';
import { LibSQLDialect } from 'kysely-turso/libsql';

/**
 * Configuration class for LibSQL database connections with support for redacted sensitive values.
 *
 * This class manages LibSQL connection parameters including authentication tokens, encryption keys,
 * and sync configuration. Sensitive values are stored as `Redacted<string>` types for security.
 *
 * @remarks
 * The class provides a `clientConfig` getter that extracts the actual values from redacted fields
 * to create a plain LibSQL configuration object.
 *
 * @example
 * ```typescript
 * const config = new LibSQLEnvConfig({
 *   url: Redacted.make('file:local.db'),
 *   authToken: Redacted.make('secret-token'),
 *   syncInterval: 5000,
 *   readYourWrites: true
 * });
 *
 * const clientConfig = config.clientConfig;
 * ```
 */
class LibSQLEnvConfig {
	private readonly url: Redacted.Redacted<string>;
	private readonly authToken?: Redacted.Redacted<string>;
	private readonly encryptionKey?: Redacted.Redacted<string>;
	private readonly syncUrl?: Redacted.Redacted<string>;
	private readonly syncInterval?: number;
	private readonly readYourWrites?: boolean;
	private readonly offline?: boolean;
	private readonly tls?: boolean;
	private readonly concurrency?: number;

	constructor(opts: {
		url: Redacted.Redacted<string>;
		authToken?: Redacted.Redacted<string>;
		encryptionKey?: Redacted.Redacted<string>;
		syncUrl?: Redacted.Redacted<string>;
		syncInterval?: number;
		readYourWrites?: boolean;
		offline?: boolean;
		tls?: boolean;
		concurrency?: number;
	}) {
		this.url = opts.url;
		this.authToken = opts.authToken;
		this.encryptionKey = opts.encryptionKey;
		this.syncUrl = opts.syncUrl;
		this.syncInterval = opts.syncInterval;
		this.readYourWrites = opts.readYourWrites;
		this.offline = opts.offline;
		this.tls = opts.tls;
		this.concurrency = opts.concurrency;
	}

	get clientConfig(): LibSQLConfig {
		return {
			url: Redacted.value(this.url),
			authToken: this.authToken ? Redacted.value(this.authToken) : undefined,
			encryptionKey: this.encryptionKey ? Redacted.value(this.encryptionKey) : undefined,
			syncUrl: this.syncUrl ? Redacted.value(this.syncUrl) : undefined,
			syncInterval: this.syncInterval,
			readYourWrites: this.readYourWrites,
			offline: this.offline,
			tls: this.tls,
			concurrency: this.concurrency,
		};
	}
}

/**
 * Configuration for LibSQL database connection loaded from environment variables.
 *
 * @remarks
 * This configuration object is built using Effect's Config system to safely load and validate
 * environment variables for LibSQL database connections.
 *
 * Environment variables: (also can be prefixed with `CMS_`)
 * - `LIBSQL_URL` (required, redacted): The database connection URL
 * - `LIBSQL_AUTH_TOKEN` (optional, redacted): Authentication token for the database
 * - `LIBSQL_ENCRYPTION_KEY` (optional, redacted): Encryption key for the database
 * - `LIBSQL_SYNC_URL` (optional, redacted): URL for database synchronization
 * - `LIBSQL_SYNC_INTERVAL` (optional, number): Interval in milliseconds for database synchronization
 * - `LIBSQL_READ_YOUR_WRITES` (optional, boolean, default: false): Enable read-your-writes consistency
 * - `LIBSQL_OFFLINE` (optional, boolean, default: false): Enable offline mode
 * - `LIBSQL_TLS` (optional, boolean, default: true): Enable TLS for connections
 * - `LIBSQL_CONCURRENCY` (optional, number): Maximum number of concurrent connections
 *
 * @example
 * ```typescript
 * // Load and use the configuration
 * const config = await Effect.runPromise(envConfig);
 * ```
 */
const envConfig = Config.all({
	url: Config.redacted('LIBSQL_URL').pipe(Config.orElse(() => Config.redacted('CMS_LIBSQL_URL'))),
	authToken: Config.withDefault(
		Config.redacted('LIBSQL_AUTH_TOKEN').pipe(
			Config.orElse(() => Config.redacted('CMS_LIBSQL_AUTH_TOKEN'))
		),
		undefined
	),
	encryptionKey: Config.withDefault(
		Config.redacted('LIBSQL_ENCRYPTION_KEY').pipe(
			Config.orElse(() => Config.redacted('CMS_LIBSQL_ENCRYPTION_KEY'))
		),
		undefined
	),
	syncUrl: Config.withDefault(
		Config.redacted('LIBSQL_SYNC_URL').pipe(
			Config.orElse(() => Config.redacted('CMS_LIBSQL_SYNC_URL'))
		),
		undefined
	),
	syncInterval: Config.withDefault(
		Config.number('LIBSQL_SYNC_INTERVAL').pipe(
			Config.orElse(() => Config.number('CMS_LIBSQL_SYNC_INTERVAL'))
		),
		undefined
	),
	readYourWrites: Config.withDefault(
		Config.boolean('LIBSQL_READ_YOUR_WRITES').pipe(
			Config.orElse(() => Config.boolean('CMS_LIBSQL_READ_YOUR_WRITES'))
		),
		false
	),
	offline: Config.withDefault(
		Config.boolean('LIBSQL_OFFLINE').pipe(
			Config.orElse(() => Config.boolean('CMS_LIBSQL_OFFLINE'))
		),
		false
	),
	tls: Config.withDefault(
		Config.boolean('LIBSQL_TLS').pipe(Config.orElse(() => Config.boolean('CMS_LIBSQL_TLS'))),
		true
	),
	concurrency: Config.withDefault(
		Config.number('LIBSQL_CONCURRENCY').pipe(
			Config.orElse(() => Config.number('CMS_LIBSQL_CONCURRENCY'))
		),
		undefined
	),
}).pipe(Config.map((cfg) => new LibSQLEnvConfig(cfg).clientConfig));

/**
 * Creates and configures a LibSQL dialect driver for Kysely database operations.
 *
 * This effect generator function retrieves the environment configuration and
 * initializes a LibSQL dialect with a configured client. The configuration is
 * provided through the environment provider.
 *
 * @returns An Effect that yields a configured LibSQLDialect instance
 *
 * @example
 * ```typescript
 * const driver = await Effect.runPromise(libsqlDriver);
 * ```
 */
export const libsqlDriver = Effect.gen(function* () {
	const config = yield* envConfig;
	return new LibSQLDialect({
		client: createClient(config),
	});
});
