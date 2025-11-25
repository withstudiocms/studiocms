import { getDBClientLive, type StudioCMSDatabaseSchema } from '@withstudiocms/kysely';
import { Effect } from 'effect';

/**
 * Supported Database Dialects
 */
export enum DbDialect {
	libsql = 'libsql',
	postgres = 'postgres',
	mysql = 'mysql',
}

/**
 * Type representing the database dialect, either as a key or value
 */
export type DbDialectType = keyof typeof DbDialect | DbDialect;

/**
 * Parse a string into a DbDialect enum value
 */
export const parseDbDialect = Effect.fn((dialect: DbDialectType) =>
	Effect.try(() => {
		switch (dialect) {
			case 'libsql':
				return DbDialect.libsql;
			case 'postgres':
				return DbDialect.postgres;
			case 'mysql':
				return DbDialect.mysql;
			default:
				throw new Error(`Unknown database dialect: ${dialect}`);
		}
	})
);

/**
 * Get the database driver Effect for the specified dialect
 */
export const getDbDriver = Effect.fn(function* (dialect: DbDialect) {
	switch (dialect) {
		case DbDialect.libsql: {
			const driverModule = yield* Effect.tryPromise(
				() => import('@withstudiocms/kysely/drivers/libsql')
			);
			return yield* driverModule.libsqlDriver;
		}
		case DbDialect.postgres: {
			const driverModule = yield* Effect.tryPromise(
				() => import('@withstudiocms/kysely/drivers/postgres')
			);
			return yield* driverModule.postgresDriver;
		}
		case DbDialect.mysql: {
			const driverModule = yield* Effect.tryPromise(
				() => import('@withstudiocms/kysely/drivers/mysql')
			);
			return yield* driverModule.mysqlDriver;
		}
		default:
			throw new Error(`Unsupported database dialect: ${dialect}`);
	}
});

/**
 * Get a Kysely DB Client for the specified dialect
 */
export const getDbClient = (driverDialect: DbDialectType) =>
	parseDbDialect(driverDialect).pipe(
		Effect.flatMap(getDbDriver),
		Effect.flatMap(getDBClientLive<StudioCMSDatabaseSchema>)
	);
