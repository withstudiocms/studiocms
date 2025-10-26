/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */

import { Effect } from 'effect';
import type { Kysely } from 'kysely';
import type { StudioCMSDatabaseSchema } from '../tables.js';
import { handleCause, SqlError } from './errors.js';
import { addMissingIndexes, dropRemovedIndexes, getTableIndexes } from './indexes.js';
import { getTableColumns, getTableTriggers, tableExists } from './introspection.js';
import { addMissingColumns, createTable, detectRemovedTables } from './tables.js';
import { addMissingTriggersForTable, dropRemovedTriggersForTable } from './triggers.js';
import type { TableDefinition } from './types.js';

export * from './types.js';

/**
 * Synchronize the database schema with a provided schema definition.
 *
 * This function compares the current database schema (queried via the provided
 * Kysely instance) with a new schema definition and an optional previous schema
 * definition. It performs the following high-level steps as an Effectful
 * operation:
 *
 * 1. Logs the start of synchronization.
 * 2. Detects tables that existed in the previous schema but are absent from
 *    the new schema and attempts to drop them (if they exist in the database).
 * 3. Iterates over the tables in the current schema definition and for each:
 *    - If the table is marked as deprecated (tableDef.deprecated === true),
 *      attempts to drop the table (if it exists).
 *    - Otherwise:
 *      - Creates the table if it does not exist.
 *      - If the table exists, fetches current columns, indexes, and triggers
 *        from the database and:
 *          - Adds any missing columns.
 *          - Adds missing indexes and drops indexes removed from the definition.
 *          - Adds missing triggers and drops triggers removed from the
 *            definition.
 * 4. Logs completion of synchronization.
 * 5. Catches and handles error causes via the configured cause handler.
 *
 * Important behavior & side effects:
 * - This routine may drop tables, indexes, and triggers; use with caution in
 *   production environments and ensure backups/migrations as needed.
 * - Columns are only added if missing; existing columns are not modified or
 *   dropped by this process.
 * - All database operations are executed through the provided Kysely instance.
 * - Informational logging is emitted throughout to trace progress.
 *
 * @param db - A Kysely instance for the target database (typed to the project
 *   database schema).
 * @param schemaDefinition - The desired/current schema definition as an array
 *   of TableDefinition objects. Each TableDefinition must describe the table
 *   name, columns, indexes, triggers, and an optional `deprecated` flag.
 * @param previousSchemaDefinition - The previously-applied schema definition
 *   used to detect and remove tables that were removed between schema versions.
 *
 * @returns An Effect that, when run, performs the synchronization and resolves
 *   when complete. The Effect will log progress and may fail with database or
 *   SQL-related errors (wrapped as SqlError or other effect causes).
 *
 * @throws Will surface SQL/database errors encountered while creating, dropping,
 *   or altering database objects via the Effect failure channel.
 *
 * @remarks
 * - This function is intended to be run as part of an application startup or a
 *   migration routine. It is not transactional across all operations; individual
 *   DDL operations are executed independently.
 *
 * @example
 * // Typical usage:
 * // await Effect.runPromise(syncDatabaseSchema(db, currentSchema, previousSchema));
 */
export const syncDatabaseSchema = (
	db: Kysely<StudioCMSDatabaseSchema>,
	schemaDefinition: TableDefinition[],
	previousSchemaDefinition: TableDefinition[]
) =>
	Effect.gen(function* () {
		yield* Effect.logInfo('Starting database schema synchronization...');

		const removedTables = yield* detectRemovedTables(schemaDefinition, previousSchemaDefinition);

		// Drop removed tables
		if (removedTables.length > 0) {
			yield* Effect.logInfo(
				`🗑️  Dropping ${removedTables.length} removed table(s) from previous schema:`
			);

			yield* Effect.forEach(
				removedTables,
				Effect.fn(function* (tableName) {
					const exists = yield* tableExists(db, tableName);
					if (exists) {
						yield* Effect.logInfo(`  Dropping removed table: ${tableName}...`);
						yield* Effect.tryPromise({
							try: () => db.schema.dropTable(tableName).execute(),
							catch: (cause) => new SqlError({ cause }),
						});
						yield* Effect.logInfo(`  ✓ Dropped: ${tableName}`);
					} else {
						yield* Effect.logInfo(`  ℹ Table ${tableName} already doesn't exist, skipping.`);
					}
				})
			);
			yield* Effect.logInfo('');
		}

		// Sync current schema
		yield* Effect.forEach(
			schemaDefinition,
			Effect.fn(function* (tableDef) {
				const exists = yield* tableExists(db, tableDef.name);

				switch (tableDef.deprecated) {
					case true: {
						if (exists) {
							yield* Effect.logInfo(`Table ${tableDef.name} is deprecated. Dropping...`);
							yield* Effect.tryPromise({
								try: () => db.schema.dropTable(tableDef.name).execute(),
								catch: (cause) => new SqlError({ cause }),
							});
							yield* Effect.logInfo(`Table ${tableDef.name} dropped.`);
						} else {
							yield* Effect.logInfo(
								`Deprecated table ${tableDef.name} does not exist. Skipping drop.`
							);
						}
						break;
					}
					case false:
					case undefined: {
						if (!exists) {
							yield* createTable(db, tableDef);
						} else {
							const existingColumns = yield* getTableColumns(db, tableDef.name);
							yield* addMissingColumns(db, tableDef, existingColumns);

							const existingIndexes = yield* getTableIndexes(db, tableDef.name);
							yield* Effect.all([
								addMissingIndexes(db, tableDef, existingIndexes),
								dropRemovedIndexes(db, tableDef, existingIndexes),
							]);

							const existingTriggers = yield* getTableTriggers(db, tableDef.name);
							yield* Effect.all([
								addMissingTriggersForTable(db, tableDef, existingTriggers),
								dropRemovedTriggersForTable(db, tableDef, existingTriggers),
							]);
						}
						break;
					}
				}
			})
		);

		yield* Effect.logInfo('✅ Database schema synchronization complete.');
	}).pipe(Effect.catchAllCause(handleCause));

/**
 * Roll back database schema changes by removing tables that exist in the provided
 * current schema definition but are not present in the previous schema snapshot.
 *
 * The function returns an Effect which, when executed, will:
 * - Log the start of the rollback process.
 * - For each table in `schemaDefinition`:
 *   - If the table name is not present in `previousSchema`, check whether the table
 *     exists in the database.
 *   - If the table exists, attempt to drop it (wrapping any database error as `SqlError`)
 *     and log success; if it does not exist, log that the drop was skipped.
 * - Log completion of the rollback.
 * - All errors/causes are routed through the configured `handleCause` catcher.
 *
 * @param db - A configured Kysely database instance for the target database.
 * @param schemaDefinition - The array of table definitions representing the current/target schema.
 * @param previousSchema - The array of table definitions representing the previous/desired schema state;
 *                         tables present here will be preserved, tables absent here may be dropped.
 *
 * @returns An Effect representing the asynchronous rollback operation. Executing the Effect performs
 *          the described checks and DDL operations and resolves when complete.
 *
 * @throws SqlError - If a table drop operation fails, the underlying error is wrapped as `SqlError`.
 *                    Other runtime causes may be handled by the `handleCause` error handler.
 *
 * @remarks
 * - This operation is destructive for tables that exist in the current schema but not in the previous schema.
 *   Use with caution and ensure you have backups or other safeguards if needed.
 * - Idempotent in the sense that attempting to drop a non-existent table is detected and skipped (logged).
 *
 * @example
 * // Execute the rollback Effect (example API; adapt to your Effect runtime)
 * // await runEffect(rollbackMigration(db, currentSchema, prevSchema));
 */
export const rollbackMigration = (
	db: Kysely<StudioCMSDatabaseSchema>,
	schemaDefinition: TableDefinition[],
	previousSchema: TableDefinition[]
) =>
	Effect.gen(function* () {
		yield* Effect.logInfo('Starting database schema rollback...');

		const previousTableNames = new Set(previousSchema.map((table) => table.name));

		yield* Effect.forEach(
			schemaDefinition,
			Effect.fn(function* (tableDef) {
				if (!previousTableNames.has(tableDef.name)) {
					const exists = yield* tableExists(db, tableDef.name);
					if (exists) {
						yield* Effect.logInfo(
							`Rolling back: Dropping table not present in previous schema: ${tableDef.name}...`
						);
						yield* Effect.tryPromise({
							try: () => db.schema.dropTable(tableDef.name).execute(),
							catch: (cause) => new SqlError({ cause }),
						});
						yield* Effect.logInfo(`✓ Dropped table: ${tableDef.name}`);
					} else {
						yield* Effect.logInfo(`Table ${tableDef.name} does not exist. Skipping drop.`);
					}
				}
			})
		);

		yield* Effect.logInfo('✅ Migration rollback completed!');
	}).pipe(Effect.catchAllCause(handleCause));
