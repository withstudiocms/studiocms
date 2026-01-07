import { getDBClientLive } from '@withstudiocms/kysely';
import type { StudioCMSDatabaseSchema } from '@withstudiocms/sdk/tables';
import { Data, Effect } from 'effect';

/**
 * Supported Database Dialects
 */
export enum DbDialect {
	libsql = 'libsql',
	postgres = 'postgres',
	mysql = 'mysql',
}

/**
 * Error thrown when an unsupported database dialect is encountered
 */
export class UnsupportedDialectError extends Data.TaggedError('UnsupportedDialectError')<{
	dialect: DbDialectType;
	cause?: unknown;
}> {}

/**
 * Type representing the database dialect, either as a key or value
 */
export type DbDialectType = keyof typeof DbDialect | DbDialect;

/**
 * Parse a string into a DbDialect enum value
 */
export const parseDbDialect = Effect.fn((dialect: DbDialectType) =>
	Effect.sync(() => {
		switch (dialect) {
			case 'libsql':
				return DbDialect.libsql;
			case 'postgres':
				return DbDialect.postgres;
			case 'mysql':
				return DbDialect.mysql;
			default:
				// Return a sentinel that will fail the check below
				return null;
		}
	}).pipe(
		Effect.flatMap((d) =>
			d === null ? Effect.fail(new UnsupportedDialectError({ dialect })) : Effect.succeed(d)
		)
	)
);

/**
 * Error thrown when a database driver fails to import
 */
export class DriverImportError extends Data.TaggedError('DriverImportError')<{
	dialect: DbDialect;
	cause: unknown;
}> {}

/**
 * Helper to attempt dynamic import of a database driver with error handling
 */
const tryPromise = (dialect: DbDialect) =>
	Effect.fn(<T>(_try: () => Promise<T>) =>
		Effect.tryPromise({
			try: _try,
			catch: (cause) => new DriverImportError({ dialect, cause }),
		})
	);

/**
 * Get the database driver Effect for the specified dialect
 */
export const getDbDriver = Effect.fn(function* (dialect: DbDialect) {
	const _try = tryPromise(dialect);
	switch (dialect) {
		case DbDialect.libsql: {
			const driverModule = yield* _try(() => import('@withstudiocms/kysely/drivers/libsql'));
			return yield* driverModule.libsqlDriver;
		}
		case DbDialect.postgres: {
			const driverModule = yield* _try(() => import('@withstudiocms/kysely/drivers/postgres'));
			return yield* driverModule.postgresDriver;
		}
		case DbDialect.mysql: {
			const driverModule = yield* _try(() => import('@withstudiocms/kysely/drivers/mysql'));
			return yield* driverModule.mysqlDriver;
		}
		default:
			return yield* Effect.fail(new UnsupportedDialectError({ dialect }));
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
