/** biome-ignore-all lint/suspicious/noExplicitAny: allow dynamic stuff */
import { Effect } from 'effect';
import type { Kysely } from 'kysely';
import { SqlError } from './errors.js';
import { getDialect, indexExists } from './introspection.js';
import { makeSql } from './sql.js';
import type { TableDefinition } from './types.js';
/* v8 ignore start */

/**
 * Retrieve the names of all non-primary/non-automatic indexes for a given table,
 * taking the connected SQL dialect into account.
 *
 * The function determines the database dialect from the provided Kysely instance
 * and runs a dialect-specific query to list index names:
 * - sqlite: queries sqlite_master and excludes internal indexes whose names start with "sqlite_autoindex_".
 * - mysql: queries information_schema.STATISTICS for the current database and excludes the PRIMARY index.
 * - postgres: queries pg_indexes in the "public" schema.
 *
 * Notes:
 * - The returned names are raw index identifiers as reported by the database.
 * - Behavior for schemas other than "public" (Postgres) is not handled.
 *
 * @param db - A Kysely database instance (Kysely<any>) used to detect dialect and execute the query.
 * @param tableName - The table name to inspect (used verbatim in the dialect-specific queries).
 *
 * @returns An Effect that resolves to an array of index names (string[]) for the specified table.
 *
 * @throws If the database dialect is unsupported or if the underlying query execution fails,
 * the underlying error from the query / dialect detection will be propagated.
 *
 * @example
 * // Example usage (pseudocode)
 * // const indexes = yield* getTableIndexes(db, 'users');
 * // // indexes -> ['users_email_idx', 'users_created_at_idx']
 */
export const getTableIndexes = Effect.fn(function* (db: Kysely<any>, tableName: string) {
	const dialect = yield* getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = yield* makeSql<{ name: string }>((sql) =>
				sql<{ name: string }>`
                SELECT name FROM sqlite_master 
                WHERE type='index' AND tbl_name=${tableName}
                AND name NOT LIKE 'sqlite_autoindex_%'
            `.execute(db)
			);
			return result.rows.map((row) => row.name);
		}
		case 'mysql': {
			const result = yield* makeSql<{ INDEX_NAME: string }>((sql) =>
				sql<{ INDEX_NAME: string }>`
                SELECT DISTINCT INDEX_NAME 
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ${tableName}
                AND INDEX_NAME != 'PRIMARY'
            `.execute(db)
			);
			return result.rows.map((row) => row.INDEX_NAME);
		}
		case 'postgres': {
			const result = yield* makeSql<{ indexname: string }>((sql) =>
				sql<{ indexname: string }>`
                SELECT DISTINCT indexname 
                FROM pg_indexes 
                WHERE schemaname = 'public' 
				AND indexname NOT LIKE '%_pkey'
                AND tablename = ${tableName}
            `.execute(db)
			);
			return result.rows.map((row) => row.indexname);
		}
	}
});

/**
 * Creates any indexes declared on the provided table definition if they do not already exist.
 *
 * This is an effectful helper that:
 * - no-ops if the tableDef has no indexes,
 * - logs progress and outcomes,
 * - checks for the existence of each index before attempting creation,
 * - builds and executes the appropriate CREATE INDEX statement (including UNIQUE when requested),
 * - surfaces SQL-level failures as a SqlError wrapped in the effect system.
 *
 * Remarks:
 * - Index existence is determined by an `indexExists` check prior to attempting creation; existing
 *   indexes are skipped and an informational log entry is emitted.
 * - The actual DDL is executed via the Kysely schema builder (`createIndex(...).on(...).columns(...)`).
 * - The caller must ensure the executing connection has the necessary privileges to create indexes.
 *
 * @param db - The Kysely database instance used to check for and create indexes.
 * @param tableDef - Table metadata describing the table name and an array of index definitions.
 *                   Each index definition is expected to include a name, columns, and an optional
 *                   `unique` flag to create a UNIQUE index.
 *
 * @returns An Effect that, when executed, performs the index creation operations and resolves to void.
 *
 * @throws SqlError - If executing the underlying index creation statement fails, the effect will
 *                    fail with a SqlError describing the cause.
 */
export const createIndexes = Effect.fn(function* (db: Kysely<any>, tableDef: TableDefinition) {
	if (!tableDef.indexes || tableDef.indexes.length === 0) return;

	yield* Effect.logDebug(`Creating indexes for table ${tableDef.name} if they do not exist`);

	yield* Effect.forEach(
		tableDef.indexes,
		Effect.fn(function* (indexDef) {
			const exists = yield* indexExists(db, indexDef.name);
			if (exists) {
				yield* Effect.logDebug(`Index ${indexDef.name} already exists for table ${tableDef.name}`);
				return;
			}

			let indexBuilder = db.schema
				.createIndex(indexDef.name)
				.on(tableDef.name)
				.columns(indexDef.columns);

			if (indexDef.unique) {
				indexBuilder = indexBuilder.unique();
			}

			yield* Effect.tryPromise({
				try: () => indexBuilder.execute(),
				catch: (cause) => new SqlError({ cause }),
			});

			yield* Effect.logDebug(`Index ${indexDef.name} created for table ${tableDef.name}`);
		})
	);
});

/**
 * Adds any indexes defined on a table that are not present in the database.
 *
 * This generator-based Effect function inspects the provided TableDefinition and,
 * for each index declared in tableDef.indexes that is not listed in existingIndexes,
 * issues a schema-level create index operation against the provided Kysely instance.
 * If an index definition has `unique: true`, the created index will be unique.
 *
 * Side effects:
 * - Creates missing indexes in the database using db.schema.createIndex(...).
 * - Emits informational logs for the start of the operation, each index added,
 *   and a message when no indexes were added.
 *
 * Behavior notes:
 * - Indexes present in existingIndexes will be skipped (idempotent for present indexes).
 * - Only missing indexes are added; extra indexes present in the database but not
 *   declared in tableDef are not removed.
 * - Indexes are processed sequentially.
 *
 * @param db - A Kysely database instance used to execute schema operations.
 * @param tableDef - The table definition containing the name and an optional
 *                   array of index definitions to ensure exist on the table.
 * @param existingIndexes - An array of index names already present on the table;
 *                          any index whose name appears here will be skipped.
 *
 * @returns An Effect that performs the index creation operations and resolves to void.
 *
 * @throws SqlError - If creating any missing index fails, the operation will fail
 *                    with a SqlError describing the underlying cause.
 *
 * @example
 * // Yielding this effect will create any indexes declared in myTableDef
 * // that are not already present in existingIndexNames.
 * // yield* addMissingIndexes(db, myTableDef, existingIndexNames);
 */
export const addMissingIndexes = Effect.fn(function* (
	db: Kysely<any>,
	tableDef: TableDefinition,
	existingIndexes: string[]
) {
	if (!tableDef.indexes || tableDef.indexes.length === 0) return;

	yield* Effect.logDebug(`Adding missing indexes for table ${tableDef.name}`);

	let addedCount = 0;

	yield* Effect.forEach(
		tableDef.indexes,
		Effect.fn(function* (indexDef) {
			if (existingIndexes.includes(indexDef.name)) return;

			let indexBuilder = db.schema
				.createIndex(indexDef.name)
				.on(tableDef.name)
				.columns(indexDef.columns);

			if (indexDef.unique) {
				indexBuilder = indexBuilder.unique();
			}

			yield* Effect.tryPromise({
				try: () => indexBuilder.execute(),
				catch: (cause) => new SqlError({ cause }),
			});

			yield* Effect.logDebug(`Index ${indexDef.name} added for table ${tableDef.name}`);
			addedCount++;
		})
	);

	if (addedCount === 0) {
		yield* Effect.logDebug(`No missing indexes to add for table ${tableDef.name}`);
	}
});

/**
 * Drops indexes that exist in the database but are no longer defined on the provided table definition.
 *
 * The function computes the set of defined index names from tableDef.indexes and compares it to the
 * provided existingIndexes. Any index name present in existingIndexes but missing from the table
 * definition is considered removed and will be dropped.
 *
 * For each index to drop, the function:
 * - Logs an informational message indicating the index will be dropped.
 * - Executes the drop via db.schema.dropIndex(indexName).execute().
 * - Wraps any thrown error in a SqlError and propagates it through the returned Effect.
 * - Logs a confirmation message after successful drop.
 *
 * Side effects:
 * - Writes informational logs for each drop attempt.
 * - Executes DDL against the database to remove indexes.
 *
 * @param db - Kysely database instance used to execute drop index commands.
 * @param tableDef - Table definition containing the canonical index definitions. Index names are
 *                   derived from tableDef.indexes (if present).
 * @param existingIndexes - Array of index names currently present in the database for the table; any
 *                          name not present in tableDef.indexes will be dropped.
 * @returns An Effect that completes once all drop attempts have finished. The Effect may fail with
 *          a SqlError if an underlying drop operation fails.
 */
export const dropRemovedIndexes = Effect.fn(function* (
	db: Kysely<any>,
	tableDef: TableDefinition,
	existingIndexes: string[]
) {
	const definedIndexes = new Set((tableDef.indexes || []).map((idx) => idx.name));
	const indexesToDrop = existingIndexes.filter((idx) => !definedIndexes.has(idx));

	yield* Effect.forEach(
		indexesToDrop,
		Effect.fn(function* (indexName) {
			yield* Effect.logDebug(`Dropping index ${indexName} from table ${tableDef.name}`);
			yield* Effect.tryPromise({
				try: () => db.schema.dropIndex(indexName).execute(),
				catch: (cause) => new SqlError({ cause }),
			});
			yield* Effect.logDebug(`Index ${indexName} dropped from table ${tableDef.name}`);
		})
	);
});
/* v8 ignore stop */
