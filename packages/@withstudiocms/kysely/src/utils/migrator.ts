/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */

import { Effect } from 'effect';
import type { Kysely } from 'kysely';
import { handleCause, SqlError } from './errors.js';
import { addMissingIndexes, dropRemovedIndexes, getTableIndexes } from './indexes.js';
import { getTableColumns, getTableTriggers, tableExists } from './introspection.js';
import { addMissingColumns, createTable, detectRemovedTables } from './tables.js';
import { addMissingTriggersForTable, dropRemovedTriggersForTable } from './triggers.js';
import type { TableDefinition } from './types.js';

export * from './types.js';

/**
 * Synchronize the live database schema with a provided schema definition.
 *
 * This function:
 * - Logs progress and status messages throughout the synchronization process.
 * - Detects tables that existed in the previous schema but are not present in
 *   the current schema and drops them from the database (if they exist).
 * - Iterates over each table in the provided `schemaDefinition` and:
 *   - If the table is marked `deprecated: true`, drops the table if it exists.
 *   - If the table is not deprecated:
 *     - Creates the table if it does not exist.
 *     - If the table exists, inspects its current columns, indexes and triggers,
 *       then adds any missing columns, indexes and triggers and removes any that
 *       have been removed from the definition.
 * - Wraps SQL-level failures in SqlError and delegates error handling to the
 *   configured `handleCause` handler (via Effect.catchAllCause).
 *
 * Important notes:
 * - This operation performs destructive changes (drops tables/indexes/triggers)
 *   when the schema indicates removal or deprecation — ensure you have backups
 *   and appropriate permissions before running.
 * - The function relies on helper utilities such as `tableExists`, `createTable`,
 *   `getTableColumns`, `addMissingColumns`, `getTableIndexes`, `addMissingIndexes`,
 *   `dropRemovedIndexes`, `getTableTriggers`, `addMissingTriggersForTable`, and
 *   `dropRemovedTriggersForTable`.
 * - The function logs informational messages for each major step so progress can
 *   be observed.
 *
 * @param db - An active Kysely database instance to operate against.
 * @param schemaDefinition - The desired current schema description as an array
 *   of TableDefinition entries.
 * @param previousSchemaDefinition - The prior schema description used to detect
 *   removed tables.
 * @returns A Promise that resolves when the synchronization completes. The
 *   promise may reject or resolve according to the configured error handling
 *   behavior for underlying SQL/Effect failures.
 *
 * @throws SqlError - SQL execution errors are wrapped in SqlError when they
 *   originate from direct DB operations.
 */
export const syncDatabaseSchema = (
	db: Kysely<any>,
	schemaDefinition: TableDefinition[],
	previousSchemaDefinition: TableDefinition[]
) =>
	Effect.runPromise(
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
		}).pipe(Effect.catchAllCause(handleCause))
	);

/**
 * Roll back database schema changes by removing tables that are present in the
 * current schema definition but absent from a provided previous schema.
 *
 * This function performs an asynchronous, best-effort rollback:
 * - Iterates over `schemaDefinition` and for each table not present in `previousSchema`
 *   it checks whether the table exists in the connected database and, if so, drops it.
 * - Logs progress and outcomes for each table and for the overall rollback procedure.
 * - Uses the provided `db` Kysely instance's schema API to perform table existence checks
 *   and drops.
 *
 * Notes and guarantees:
 * - The operation is executed asynchronously and returns a promise that resolves
 *   when processing completes.
 * - Drops are executed individually; there is no implicit transactional guarantee
 *   across multiple table drops (i.e., partial rollbacks are possible if an error occurs).
 * - Existence of a table is checked before attempting to drop it, so attempting to
 *   rollback a table that does not exist is safe and will be logged and skipped.
 * - Errors raised during individual drop attempts are wrapped and propagated via
 *   the effect/error handling mechanism used by the implementation.
 *
 * @param db - A Kysely database instance used to query and modify the DB schema.
 * @param schemaDefinition - The current schema definition (array of table definitions)
 *                           from which tables will be compared and possibly dropped.
 * @param previousSchema - The previous/target schema definition; any table present in
 *                         `schemaDefinition` but missing from `previousSchema` is a
 *                         candidate for removal.
 *
 * @returns A promise that resolves when the rollback process completes. The promise
 *          rejects if an unrecoverable error occurs while inspecting or dropping tables.
 *
 * @throws {SqlError|Error} If a database operation fails, the function will propagate
 *         an error (typically wrapped as a SqlError) describing the failure cause.
 */
export const rollbackMigration = (
	db: Kysely<any>,
	schemaDefinition: TableDefinition[],
	previousSchema: TableDefinition[]
) =>
	Effect.runPromise(
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
		}).pipe(Effect.catchAllCause(handleCause))
	);
