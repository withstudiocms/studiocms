/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */
/* v8 ignore start */

import { Effect } from 'effect';
import type { Kysely } from 'kysely';
import { type DialectDeterminationError, handleCause, SqlError } from './errors.js';
import { addMissingIndexes, dropRemovedIndexes, getTableIndexes } from './indexes.js';
import { getTableColumns, getTableTriggers, tableExists } from './introspection.js';
import { addMissingColumns, createTable, detectRemovedTables } from './tables.js';
import { addMissingTriggersForTable, dropRemovedTriggersForTable } from './triggers.js';
import type { TableDefinition } from './types.js';

export * from './types.js';

/**
 * Manages schema definitions for database migrations in Kysely.
 *
 * This class handles storing and retrieving table schema definitions either from
 * a provided in-memory definition or from a dedicated schema tracking table in the database.
 * It uses Effect-ts for error handling and composable effects.
 *
 * @remarks
 * The manager maintains a `kysely_schema` table to persist schema definitions across migrations.
 * If no previous schema definition is provided during construction, it will attempt to load
 * the schema from the database instead.
 *
 * @example
 * ```typescript
 * const db = new Kysely<Database>({ dialect });
 * const previousSchema: TableDefinition[] = [...];
 * const manager = new MigrationSchemaManager(db, previousSchema);
 *
 * // Get the previous schema
 * const schema = await Effect.runPromise(manager.getPreviousSchema());
 *
 * // Save a new schema version
 * const result = await Effect.runPromise(manager.saveSchema(newSchema));
 * ```
 */
class MigrationSchemaManager {
	#db: Kysely<any>;
	#previousSchemaDefinition: TableDefinition[];
	#useDBSchema = false;
	private readonly schemaTableName = 'kysely_schema';

	constructor(db: Kysely<any>, previousSchemaDefinition: TableDefinition[]) {
		this.#db = db;
		this.#previousSchemaDefinition = previousSchemaDefinition;

		if (this.#previousSchemaDefinition.length === 0) {
			this.#useDBSchema = true;
		}
	}

	/**
	 * Creates the schema tracking table in the database if it does not already exist.
	 *
	 * The `kysely_schema` table is used to store serialized schema definitions
	 * for tracking changes across migrations.
	 *
	 * @returns An Effect that resolves when the table is created.
	 */
	private createSchemaTable(): Effect.Effect<void, SqlError, never> {
		const db = this.#db;
		const tableName = this.schemaTableName;
		return Effect.tryPromise({
			try: () =>
				db.schema
					.createTable(tableName)
					.addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
					.addColumn('definition', 'text', (col) => col.notNull())
					.execute(),
			catch: (cause) => new SqlError({ cause }),
		});
	}

	/**
	 * Loads the previous schema definition from the database.
	 *
	 * This method checks for the existence of the `kysely_schema` table and retrieves
	 * the latest schema definition stored within it. If the table does not exist,
	 * it creates the table and returns an empty schema.
	 *
	 * @returns An Effect that resolves to the previous schema definition array.
	 */
	private loadPreviousSchemaFromDB(): Effect.Effect<
		TableDefinition[],
		SqlError | DialectDeterminationError,
		never
	> {
		const db = this.#db;
		const tableName = this.schemaTableName;

		const createSchemaTable = this.createSchemaTable;

		return Effect.gen(function* () {
			const exists = yield* tableExists(db, tableName);

			if (!exists) {
				yield* createSchemaTable();
				return [];
			}

			const rows = yield* Effect.tryPromise({
				try: () => db.selectFrom(tableName).selectAll().execute(),
				catch: (cause) => new SqlError({ cause }),
			});

			if (rows.length === 0) {
				return [];
			}

			const latestDefinition = rows[rows.length - 1].definition;
			return JSON.parse(latestDefinition) as TableDefinition[];
		});
	}

	/**
	 * Retrieves the previous schema definition, either from the database or
	 * from the provided in-memory definition.
	 *
	 * If the manager was constructed without a previous schema definition,
	 * it will load the schema from the database. Otherwise, it returns
	 * the in-memory definition.
	 *
	 * @returns An Effect that resolves to the previous schema definition array.
	 */
	getPreviousSchema(): Effect.Effect<
		TableDefinition[],
		SqlError | DialectDeterminationError,
		never
	> {
		return this.#useDBSchema
			? this.loadPreviousSchemaFromDB()
			: Effect.succeed(this.#previousSchemaDefinition);
	}

	/**
	 * Saves the provided schema definition to the database.
	 *
	 * This method serializes the schema definition and inserts it into
	 * the `kysely_schema` table for tracking.
	 *
	 * @param schemaDefinition - The schema definition array to save.
	 * @returns An Effect that resolves when the schema is saved.
	 */
	saveSchema(schemaDefinition: TableDefinition[]): Effect.Effect<
		{
			id: number;
		},
		SqlError,
		never
	> {
		const db = this.#db;
		const tableName = this.schemaTableName;

		return Effect.gen(function* () {
			const definition = JSON.stringify(schemaDefinition);

			const data: {
				id: number;
			} = yield* Effect.tryPromise({
				try: () =>
					db.insertInto(tableName).values({ definition }).returning('id').executeTakeFirstOrThrow(),
				catch: (cause) => new SqlError({ cause }),
			});

			return data;
		});
	}
}

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
			yield* Effect.logDebug('Starting database schema synchronization...');

			const migrationManager = new MigrationSchemaManager(db, previousSchemaDefinition);

			const previousSchema = yield* migrationManager.getPreviousSchema();

			const removedTables = yield* detectRemovedTables(schemaDefinition, previousSchema);

			// Drop removed tables
			if (removedTables.length > 0) {
				yield* Effect.logDebug(
					`🗑️  Dropping ${removedTables.length} removed table(s) from previous schema:`
				);

				yield* Effect.forEach(
					removedTables,
					Effect.fn(function* (tableName) {
						const exists = yield* tableExists(db, tableName);
						if (exists) {
							yield* Effect.logDebug(`  Dropping removed table: ${tableName}...`);
							yield* Effect.tryPromise({
								try: () => db.schema.dropTable(tableName).execute(),
								catch: (cause) => new SqlError({ cause }),
							});
							yield* Effect.logDebug(`  ✓ Dropped: ${tableName}`);
						} else {
							yield* Effect.logDebug(`  ℹ Table ${tableName} already doesn't exist, skipping.`);
						}
					})
				);
				yield* Effect.logDebug('');
			}

			// Sync current schema
			yield* Effect.forEach(
				schemaDefinition,
				Effect.fn(function* (tableDef) {
					const exists = yield* tableExists(db, tableDef.name);

					switch (tableDef.deprecated) {
						case true: {
							if (exists) {
								yield* Effect.logDebug(`Table ${tableDef.name} is deprecated. Dropping...`);
								yield* Effect.tryPromise({
									try: () => db.schema.dropTable(tableDef.name).execute(),
									catch: (cause) => new SqlError({ cause }),
								});
								yield* Effect.logDebug(`Table ${tableDef.name} dropped.`);
							} else {
								yield* Effect.logDebug(
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

			// Save the current schema definition for future migrations
			yield* migrationManager.saveSchema(schemaDefinition);

			yield* Effect.logDebug('✅ Database schema synchronization complete.');
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
	previousSchemaDefinition: TableDefinition[]
) =>
	Effect.runPromise(
		Effect.gen(function* () {
			yield* Effect.logDebug('Starting database schema rollback...');

			const migrationManager = new MigrationSchemaManager(db, previousSchemaDefinition);

			const previousSchema = yield* migrationManager.getPreviousSchema();

			const previousTableNames = new Set(previousSchema.map((table) => table.name));

			yield* Effect.forEach(
				schemaDefinition,
				Effect.fn(function* (tableDef) {
					if (!previousTableNames.has(tableDef.name)) {
						const exists = yield* tableExists(db, tableDef.name);
						if (exists) {
							yield* Effect.logDebug(
								`Rolling back: Dropping table not present in previous schema: ${tableDef.name}...`
							);
							yield* Effect.tryPromise({
								try: () => db.schema.dropTable(tableDef.name).execute(),
								catch: (cause) => new SqlError({ cause }),
							});
							yield* Effect.logDebug(`✓ Dropped table: ${tableDef.name}`);
						} else {
							yield* Effect.logDebug(`Table ${tableDef.name} does not exist. Skipping drop.`);
						}
					}
				})
			);

			// Save the previous schema definition after rollback
			yield* migrationManager.saveSchema(previousSchema);

			yield* Effect.logDebug('✅ Migration rollback completed!');
		}).pipe(Effect.catchAllCause(handleCause))
	);

/* v8 ignore stop */
