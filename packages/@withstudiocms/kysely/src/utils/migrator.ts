/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */
/* v8 ignore start */

import { Effect } from 'effect';
import type { Kysely } from 'kysely';
import { handleCause, SqlError } from './errors.js';
import { addMissingIndexes, dropRemovedIndexes, getTableIndexes } from './indexes.js';
import { getTableColumns, getTableTriggers, tableExists } from './introspection.js';
import { addMissingColumns, createTable, detectRemovedTables } from './tables.js';
import { addMissingTriggersForTable, dropRemovedTriggersForTable } from './triggers.js';
import type { TableDefinition } from './types.js';

export * from './types.js';

const legacyTableName = 'kysely_schema';
const v1TableName = '_kysely_schema_v1';

/**
 * Get the current timestamp in the following simplified format:
 *
 * - YYMMDDMM
 */
function now() {
	const now = new Date();
	const year = now.getFullYear().toString().slice(-2);
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	return Number(`${year}${month}${day}${hours}${minutes}`);
}

const schemaManager = Effect.fn('schemaManager')(function* (
	db: Kysely<any>,
	previousSchemaDefinition?: TableDefinition[]
) {
	let useDbSchema = false;
	let previousSchemaDefinitionInternal: TableDefinition[] = [];

	const createTable = Effect.tryPromise({
		try: () =>
			db.schema
				.createTable(v1TableName)
				.addColumn('id', 'integer', (col) => col.primaryKey())
				.addColumn('definition', 'text', (col) => col.notNull())
				.execute(),
		catch: (cause) => new SqlError({ cause }),
	});

	const legacyTableExists = yield* tableExists(db, legacyTableName);
	if (legacyTableExists) {
		yield* Effect.logWarning(
			`⚠️  Legacy schema table "${legacyTableName}" detected. Migrating to new schema table "${v1TableName}"...`
		);

		const rows = yield* Effect.tryPromise({
			try: () =>
				db.selectFrom(legacyTableName).selectAll().orderBy('id', 'desc').limit(1).execute(),
			catch: (cause) => new SqlError({ cause }),
		});

		if (rows.length > 0) {
			const latestDefinition = rows[0].definition;
			previousSchemaDefinitionInternal = yield* Effect.try({
				try: () => JSON.parse(latestDefinition) as TableDefinition[],
				catch: (cause) => new SqlError({ cause }),
			});
		}

		// Create the new schema table if it doesn't exist
		const v1TableExists = yield* tableExists(db, v1TableName);
		if (!v1TableExists) {
			yield* createTable;
		}

		// Migrate the latest schema definition to the new table
		if (previousSchemaDefinitionInternal.length > 0) {
			const definition = JSON.stringify(previousSchemaDefinitionInternal);
			yield* Effect.tryPromise({
				try: () =>
					db.insertInto(v1TableName).values({ definition, id: now() }).executeTakeFirstOrThrow(),
				catch: (cause) => new SqlError({ cause }),
			});
		}

		// Drop the legacy table after migration
		yield* Effect.tryPromise({
			try: () => db.schema.dropTable(legacyTableName).execute(),
			catch: (cause) => new SqlError({ cause }),
		});

		yield* Effect.logWarning(
			`✅ Legacy schema table "${legacyTableName}" migrated and dropped. Continuing with "${v1TableName}".`
		);
	}

	if (previousSchemaDefinition === undefined) {
		useDbSchema = true;
	} else {
		previousSchemaDefinitionInternal = previousSchemaDefinition;
	}

	const loadPreviousSchemaFromDB = Effect.gen(function* () {
		const exists = yield* tableExists(db, v1TableName);

		if (!exists) {
			yield* createTable;
			return [];
		}

		const rows = yield* Effect.tryPromise({
			try: () => db.selectFrom(v1TableName).selectAll().orderBy('id', 'desc').limit(1).execute(),
			catch: (cause) => new SqlError({ cause }),
		});

		if (rows.length === 0) {
			return [];
		}

		const latestDefinition = rows[0].definition;
		return yield* Effect.try({
			try: () => JSON.parse(latestDefinition) as TableDefinition[],
			catch: (cause) => new SqlError({ cause }),
		});
	}).pipe(
		Effect.catchAll(
			Effect.fn(function* (cause) {
				yield* Effect.logError(cause);
				return [] as TableDefinition[];
			})
		)
	);

	const getPreviousSchema = () =>
		useDbSchema ? loadPreviousSchemaFromDB : Effect.succeed(previousSchemaDefinitionInternal);

	const saveSchema = Effect.fn('saveSchema')(function* (schemaDefinition: TableDefinition[]) {
		const definition = JSON.stringify(schemaDefinition);
		const exists = yield* tableExists(db, v1TableName);

		if (!exists) {
			yield* createTable;
		}

		yield* Effect.tryPromise({
			try: () =>
				db.insertInto(v1TableName).values({ definition, id: now() }).executeTakeFirstOrThrow(),
			catch: (cause) => new SqlError({ cause }),
		});

		return;
	}, Effect.catchAll(Effect.logError));

	return {
		getPreviousSchema,
		saveSchema,
	};
});

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
	previousSchemaDefinition?: TableDefinition[]
) =>
	Effect.runPromise(
		Effect.gen(function* () {
			yield* Effect.logDebug('Starting database schema synchronization...');

			const migrationManager = yield* schemaManager(db, previousSchemaDefinition);

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
	previousSchemaDefinition?: TableDefinition[]
) =>
	Effect.runPromise(
		Effect.gen(function* () {
			yield* Effect.logDebug('Starting database schema rollback...');

			const migrationManager = yield* schemaManager(db, previousSchemaDefinition);

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
