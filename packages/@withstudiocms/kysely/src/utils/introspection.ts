/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */

import { Effect } from 'effect';
import type { Kysely } from 'kysely';
import { DialectDeterminationError } from './errors.js';
import { makeSql } from './sql.js';
import type { DatabaseDialect } from './types.js';

/**
 * Determine the SQL dialect for the provided Kysely instance by inspecting the
 * executor's adapter capabilities.
 *
 * The detection uses the adapter's support for RETURNING and transactional DDL
 * to distinguish between known dialects:
 *  - "mysql":     !supportsReturning && !supportsTransactionalDdl
 *  - "sqlite":    supportsReturning && !supportsTransactionalDdl
 *  - "postgres":  supportsReturning && supportsTransactionalDdl
 *
 * This function is provided as an Effect and will either succeed with one of
 * the DatabaseDialect literals ("mysql" | "sqlite" | "postgres") or fail with
 * a DialectDeterminationError.
 *
 * @param db - A Kysely instance parameterized by the application's database schema.
 * @returns An Effect that resolves to the detected DatabaseDialect.
 * @throws DialectDeterminationError if obtaining the executor fails or if the
 *         adapter capabilities do not match any known dialect pattern.
 */
export const getDialect = Effect.fn(function* (db: Kysely<any>) {
	const { adapter } = yield* Effect.try({
		try: () => db.getExecutor(),
		catch: (cause) => new DialectDeterminationError({ cause }),
	});

	const cases = [
		{
			dialect: 'mysql' as DatabaseDialect,
			condition: !adapter.supportsReturning && !adapter.supportsTransactionalDdl,
		},
		{
			dialect: 'sqlite' as DatabaseDialect,
			condition: adapter.supportsReturning && !adapter.supportsTransactionalDdl,
		},
		{
			dialect: 'postgres' as DatabaseDialect,
			condition: adapter.supportsReturning && adapter.supportsTransactionalDdl,
		},
	];

	for (const { dialect, condition } of cases) {
		if (condition) {
			return dialect;
		}
	}

	return yield* Effect.fail(
		new DialectDeterminationError({ cause: 'Unable to determine database dialect.' })
	);
});

/**
 * Determine whether a table with the given name exists in the connected database.
 *
 * This helper is implemented as an Effect generator and detects the database dialect
 * from the provided Kysely instance to run the appropriate existence query:
 * - sqlite: queries sqlite_master for an entry matching the table name.
 * - mysql: queries information_schema.TABLES for the current database (DATABASE()).
 * - postgres: queries pg_tables within the 'public' schema for the table name.
 *
 * Notes:
 * - The check follows the database's native case-sensitivity rules; callers should
 *   normalize the tableName if a specific case-insensitive behavior is required.
 * - The routine executes raw SQL queries and will surface any SQL/connection errors
 *   through the Effect (i.e., the Effect may fail).
 *
 * @param db - A Kysely instance typed with the application's database schema.
 * @param tableName - The table name to check for existence.
 * @returns An Effect that resolves to `true` if the table exists, otherwise `false`.
 *
 * @throws The Effect may fail if SQL execution fails (e.g. connection issues,
 *         insufficient permissions, or an unsupported dialect).
 *
 * @example
 * // yield* in an Effect generator:
 * // const exists = yield* tableExists(db, 'users');
 */
export const tableExists = Effect.fn(function* (db: Kysely<any>, tableName: string) {
	const dialect = yield* getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = yield* makeSql<{ name: string }>((sql) =>
				sql<{ name: string }>`
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name=${tableName}
                `.execute(db)
			);
			return result.rows.length > 0;
		}
		case 'mysql': {
			const result = yield* makeSql<{ TABLE_NAME: string }>((sql) =>
				sql<{ TABLE_NAME: string }>`
                SELECT TABLE_NAME FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${tableName}
                `.execute(db)
			);
			return result.rows.length > 0;
		}
		case 'postgres': {
			const result = yield* makeSql<{ tablename: string }>((sql) =>
				sql<{ tablename: string }>`
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' AND tablename = ${tableName}
                `.execute(db)
			);
			return result.rows.length > 0;
		}
	}
});

/**
 * Check whether an index with the given name exists in the connected database.
 *
 * This function runs a dialect-specific query to determine whether an index named
 * `indexName` exists in the current database. Supported dialects: "sqlite", "mysql",
 * and "postgres". The check queries sqlite_master, information_schema.STATISTICS, or
 * pg_indexes respectively.
 *
 * @param db - A Kysely instance for the target database.
 * @param indexName - The name of the index to look up. Matching and sensitivity depend on the
 *   underlying DBMS (collation and identifier case rules).
 *
 * @returns An Effect that resolves to `true` if the index exists, otherwise `false`.
 *
 * @remarks
 * - Behavior and casing are determined by the database engine; some engines may treat
 *   identifiers case-insensitively or normalize names.
 * - If the dialect is not one of the supported values or the underlying query fails,
 *   the effect will fail with the corresponding error.
 *
 * @example
 * // yield* indexExists(db, 'users_email_idx')  // returns true | false inside an Effect
 *
 * @throws If the database query fails or an unsupported dialect is encountered.
 */
export const indexExists = Effect.fn(function* (db: Kysely<any>, indexName: string) {
	const dialect = yield* getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = yield* makeSql<{ name: string }>((sql) =>
				sql<{ name: string }>`
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name=${indexName}
                `.execute(db)
			);
			return result.rows.length > 0;
		}
		case 'mysql': {
			const result = yield* makeSql<{ INDEX_NAME: string }>((sql) =>
				sql<{ INDEX_NAME: string }>`
                SELECT INDEX_NAME 
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = ${indexName}
                `.execute(db)
			);
			return result.rows.length > 0;
		}
		case 'postgres': {
			const result = yield* makeSql<{ indexname: string }>((sql) =>
				sql<{ indexname: string }>`
                SELECT indexname 
                FROM pg_indexes 
                WHERE schemaname = 'public' AND indexname = ${indexName}
                `.execute(db)
			);
			return result.rows.length > 0;
		}
	}
});

/**
 * Retrieves the column names for a given table from the provided Kysely database connection.
 *
 * This is implemented as an Effect generator that:
 *  - determines the current SQL dialect via getDialect(db),
 *  - executes a dialect-specific query using makeSql(...) against the provided `db`,
 *  - and returns an array of column name strings for the specified table.
 *
 * Dialect-specific behavior:
 *  - sqlite: runs `PRAGMA table_info(<table>)` and returns the `name` field from each row.
 *    The table name is injected as an identifier using `sql.ref(tableName)`.
 *  - mysql: queries `information_schema.COLUMNS` for the current database and returns
 *    the `COLUMN_NAME` field from each row. The table name is passed as a bound parameter.
 *  - postgres: queries `information_schema.COLUMNS` for the `public` schema and returns
 *    the `column_name` field from each row. The table name is passed as a bound parameter.
 *
 * Notes:
 *  - If the table does not exist or has no columns, the function will return an empty array.
 *  - If dialect detection fails, the SQL execution fails, or an unsupported dialect is encountered,
 *    the underlying Effect will fail/throw according to the effect/DB driver behavior.
 *  - Callers should ensure `tableName` refers to an existing table in the connected database.
 *
 * @param db - A Kysely instance typed with the application's database schema (Kysely<any>).
 * @param tableName - The name of the table whose columns should be listed.
 * @returns An Effect (generator) that resolves to an array of column name strings (string[]).
 * @throws If dialect resolution or the underlying SQL query fails, or if an unsupported dialect is encountered.
 */
export const getTableColumns = Effect.fn(function* (db: Kysely<any>, tableName: string) {
	const dialect = yield* getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = yield* makeSql((sql) =>
				sql`PRAGMA table_info(${sql.ref(tableName)})`.execute(db)
			);
			return result.rows.map((row: any) => row.name);
		}
		case 'mysql': {
			const result = yield* makeSql((sql) =>
				sql<{ COLUMN_NAME: string }>`
                SELECT COLUMN_NAME 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${tableName}
            `.execute(db)
			);
			return result.rows.map((row) => row.COLUMN_NAME);
		}
		case 'postgres': {
			const result = yield* makeSql((sql) =>
				sql<{ column_name: string }>`
                SELECT column_name 
                FROM information_schema.COLUMNS 
                WHERE table_schema = 'public' AND table_name = ${tableName}
            `.execute(db)
			);
			return result.rows.map((row) => row.column_name);
		}
	}
});

/**
 * Retrieve the names of all triggers defined for a given table on the connected database.
 *
 * @param db - A Kysely instance for the application's database schema. Used to run dialect-specific queries.
 * @param tableName - The name of the table whose triggers should be listed.
 * @returns An Effect that yields an array of trigger names (string[]).
 *
 * @remarks
 * - Implemented as an Effect.fn generator that detects the SQL dialect and executes an appropriate,
 *   parameterized query:
 *     - sqlite: queries sqlite_master for entries of type 'trigger' with tbl_name = tableName.
 *     - mysql: queries information_schema.TRIGGERS filtered by the current database (TRIGGER_SCHEMA = DATABASE())
 *       and EVENT_OBJECT_TABLE = tableName.
 *     - postgres: queries pg_trigger joined with pg_class and pg_namespace, excludes internal triggers (tgisinternal),
 *       restricts to the 'public' schema, and matches the table name.
 * - The table name is bound as a query parameter (not string-interpolated), avoiding SQL injection when used with Kysely.
 * - Note: Postgres behavior is limited to the 'public' schema; triggers in other schemas will not be returned.
 *
 * @throws The returned Effect will fail if the underlying database query fails (e.g., connectivity, permissions,
 *         or unexpected dialect handling).
 *
 * @example
 * // Obtain an Effect that yields trigger names for the "users" table, then run it with your Effect runtime.
 * const effect = getTableTriggers(db, 'users');
 */
export const getTableTriggers = Effect.fn(function* (db: Kysely<any>, tableName: string) {
	const dialect = yield* getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = yield* makeSql<{ name: string }>((sql) =>
				sql<{ name: string }>`
                    SELECT name 
                    FROM sqlite_master 
                    WHERE type='trigger' AND tbl_name=${tableName}
                `.execute(db)
			);
			return result.rows.map((r) => r.name);
		}
		case 'mysql': {
			const result = yield* makeSql<{ TRIGGER_NAME: string }>((sql) =>
				sql<{ TRIGGER_NAME: string }>`
                    SELECT TRIGGER_NAME
                    FROM information_schema.TRIGGERS
                    WHERE TRIGGER_SCHEMA = DATABASE() 
                      AND EVENT_OBJECT_TABLE = ${tableName}
                `.execute(db)
			);
			return result.rows.map((r) => r.TRIGGER_NAME);
		}
		case 'postgres': {
			const result = yield* makeSql<{ tgname: string }>((sql) =>
				sql<{ tgname: string }>`
                    SELECT t.tgname
                    FROM pg_trigger t
                    JOIN pg_class c ON c.oid = t.tgrelid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE NOT t.tgisinternal
                      AND n.nspname = 'public'
                      AND c.relname = ${tableName}
                `.execute(db)
			);
			return result.rows.map((r) => r.tgname);
		}
	}
});
