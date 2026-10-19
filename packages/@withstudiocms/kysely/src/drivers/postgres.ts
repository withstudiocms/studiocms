import { Config, Effect, Redacted } from 'effect';
import { PostgresDialect } from 'kysely';
import { Pool, type PoolConfig } from 'pg';

/**
 * PostgreSQL database connection configuration with redacted sensitive values.
 *
 * This class encapsulates the necessary parameters to establish a connection pool
 * to a PostgreSQL database, including database name, host, port, user, and password.
 * Sensitive values are stored as `Redacted<string>` types to prevent accidental exposure.
 *
 * @remarks
 * The `poolConfig` getter extracts the actual values from redacted fields
 * to create a plain PoolConfig object suitable for initializing a PostgreSQL connection pool.
 *
 * @example
 * ```typescript
 * const config = new PostgresEnvConfig({
 *   database: Redacted.make('my_database'),
 *   host: Redacted.make('localhost'),
 *   port: Redacted.make(5432),
 *   user: Redacted.make('db_user'),
 *   password: Redacted.make('secret_password'),
 * });
 *
 * const poolConfig = config.poolConfig;
 * ```
 */
class PostgresEnvConfig {
	private readonly database: Redacted.Redacted<string>;
	private readonly host: Redacted.Redacted<string>;
	private readonly port: Redacted.Redacted<number>;
	private readonly user: Redacted.Redacted<string>;
	private readonly password: Redacted.Redacted<string>;
	private readonly connectionLimit: number = 10;

	constructor(opts: {
		database: Redacted.Redacted<string>;
		host: Redacted.Redacted<string>;
		port: Redacted.Redacted<number>;
		user: Redacted.Redacted<string>;
		password: Redacted.Redacted<string>;
		connectionLimit?: number;
	}) {
		this.database = opts.database;
		this.host = opts.host;
		this.port = opts.port;
		this.user = opts.user;
		this.password = opts.password;
		if (opts.connectionLimit !== undefined) {
			this.connectionLimit = opts.connectionLimit;
		}
	}

	get poolConfig(): PoolConfig {
		return {
			database: Redacted.value(this.database),
			host: Redacted.value(this.host),
			port: Redacted.value(this.port),
			user: Redacted.value(this.user),
			password: Redacted.value(this.password),
			max: this.connectionLimit,
		};
	}
}

/**
 * Effect that produces the PostgreSQL PoolConfig by reading from environment variables.
 *
 * It uses the `Config` module to read and redact sensitive information,
 * ensuring that database connection parameters are securely handled.
 */
const envConfig = Config.all({
	database: Config.redacted('PG_DATABASE').pipe(
		Config.orElse(() => Config.redacted('CMS_PG_DATABASE'))
	),
	host: Config.redacted('PG_HOST').pipe(Config.orElse(() => Config.redacted('CMS_PG_HOST'))),
	port: Config.redacted(Config.number('PG_PORT')).pipe(
		Config.orElse(() => Config.redacted(Config.number('CMS_PG_PORT')))
	),
	user: Config.redacted('PG_USER').pipe(Config.orElse(() => Config.redacted('CMS_PG_USER'))),
	password: Config.redacted('PG_PASSWORD').pipe(
		Config.orElse(() => Config.redacted('CMS_PG_PASSWORD'))
	),
	connectionLimit: Config.withDefault(
		Config.number('PG_CONNECTION_LIMIT').pipe(
			Config.orElse(() => Config.number('CMS_PG_CONNECTION_LIMIT'))
		),
		undefined
	),
}).pipe(Config.map((opts) => new PostgresEnvConfig(opts).poolConfig));

/**
 * Creates a PostgreSQL dialect driver for Kysely using Effect.
 *
 * This generator function retrieves database configuration from the environment
 * and initializes a PostgresDialect with a connection pool. The configuration
 * is provided through the `envProvider` config provider.
 *
 * @returns An Effect that yields a PostgresDialect instance configured with
 * a connection pool based on environment configuration.
 *
 * @example
 * ```typescript
 * const dialect = await Effect.runPromise(postgresDriver);
 * ```
 */
export const postgresDriver = Effect.gen(function* () {
	const config = yield* envConfig;
	return new PostgresDialect({
		pool: new Pool(config),
	});
});
