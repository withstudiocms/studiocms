import { Config, ConfigProvider, Effect, Redacted } from 'effect';
import { MysqlDialect } from 'kysely';
import { createPool, type PoolOptions } from 'mysql2';

/**
 * MySQL database connection configuration with redacted sensitive values.
 *
 * This class encapsulates the necessary parameters to establish a connection pool
 * to a MySQL database, including database name, host, port, user, and password.
 * Sensitive values are stored as `Redacted<string>` types to prevent accidental exposure.
 *
 * @remarks
 * The `poolConfig` getter extracts the actual values from redacted fields
 * to create a plain PoolOptions object suitable for initializing a MySQL connection pool.
 *
 * @example
 * ```typescript
 * const config = new MysqlEnvConfig({
 *   database: Redacted.make('my_database'),
 *   host: Redacted.make('localhost'),
 *   port: Redacted.make(3306),
 *   user: Redacted.make('db_user'),
 *   password: Redacted.make('secret_password'),
 * });
 *
 * const poolConfig = config.poolConfig;
 * ```
 */
class MysqlEnvConfig {
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

	get poolConfig(): PoolOptions {
		return {
			database: Redacted.value(this.database),
			host: Redacted.value(this.host),
			port: Redacted.value(this.port),
			user: Redacted.value(this.user),
			password: Redacted.value(this.password),
			connectionLimit: this.connectionLimit,
		};
	}
}

/**
 * Configuration for MySQL database connection pool derived from environment variables.
 *
 * This configuration reads the following environment variables:
 * - `MYSQL_DATABASE`: The name of the MySQL database to connect to (redacted in logs)
 * - `MYSQL_HOST`: The MySQL server host address (redacted in logs)
 * - `MYSQL_PORT`: The MySQL server port number (redacted in logs)
 * - `MYSQL_USER`: The MySQL user for authentication (redacted in logs)
 * - `MYSQL_PASSWORD`: The MySQL password for authentication (redacted in logs)
 * - `MYSQL_CONNECTION_LIMIT`: Optional connection pool limit (defaults to undefined)
 *
 * The configuration is processed through a pipeline that:
 * 1. Combines all environment variables into a single configuration object
 * 2. Maps the combined config to a `MysqlEnvConfig` instance
 * 3. Extracts and returns the `poolConfig` property for use in database connection pooling
 *
 * @remarks
 * Sensitive configuration values (credentials, host, port) are marked as redacted
 * to prevent accidental exposure in logs or error messages.
 */
const envConfig = Config.all({
	database: Config.redacted('MYSQL_DATABASE'),
	host: Config.redacted('MYSQL_HOST'),
	port: Config.redacted(Config.number('MYSQL_PORT')),
	user: Config.redacted('MYSQL_USER'),
	password: Config.redacted('MYSQL_PASSWORD'),
	connectionLimit: Config.withDefault(Config.number('MYSQL_CONNECTION_LIMIT'), undefined),
}).pipe(
	Config.map((opts) => new MysqlEnvConfig(opts)),
	Effect.map((env) => env.poolConfig)
);

/**
 * Configuration provider that attempts to load configuration from environment variables.
 *
 * First tries to load configuration from the root level environment variables.
 * If that fails, falls back to loading from environment variables nested under the 'CMS' prefix.
 *
 * @example
 * // Will try to read from process.env.SOME_VAR first
 * // Then try to read from process.env.CMS_SOME_VAR
 *
 * @remarks
 * This uses a pipe-based approach with orElse to provide a fallback mechanism
 * for configuration loading, ensuring the application can find configuration
 * in either the root environment or under a 'CMS' namespace.
 */
const envProvider = ConfigProvider.fromEnv().pipe(
	ConfigProvider.orElse(() => ConfigProvider.fromEnv().pipe(ConfigProvider.nested('CMS')))
);

/**
 * Creates a MySQL dialect instance for Kysely using connection configuration from environment variables.
 *
 * This effect retrieves the database configuration from the environment provider and initializes
 * a MySQL dialect with a connection pool using the provided configuration.
 *
 * @returns An Effect that resolves to a configured MysqlDialect instance
 * @throws Will fail if the environment configuration cannot be retrieved or is invalid
 *
 * @example
 * ```typescript
 * const dialect = await Effect.runPromise(mysqlDriver);
 * const db = new Kysely({ dialect });
 * ```
 */
export const mysqlDriver = Effect.gen(function* () {
	const config = yield* envConfig;
	return new MysqlDialect({
		pool: createPool(config),
	});
}).pipe(Effect.withConfigProvider(envProvider));
