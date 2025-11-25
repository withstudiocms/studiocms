/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */

import { Effect } from 'effect';
import { type Kysely, sql } from 'kysely';
import { SqlError } from './errors.js';
import { createIndexes } from './indexes.js';
import type { ColumnDefinition, ColumnType, TableDefinition } from './types.js';

/* v8 ignore start */

/**
 * Apply column-level constraints and modifiers to a Kysely column builder.
 *
 * This helper inspects a provided ColumnDefinition and mutates (returns) the
 * passed-in column builder by chaining appropriate Kysely column methods.
 * The function handles common constraints such as primary keys, auto-increment,
 * NOT NULL (with ALTER TABLE sensible defaults), uniqueness, defaults, and
 * foreign key references.
 *
 * Behavior details:
 * - primaryKey: calls `.primaryKey()` when `def.primaryKey` is truthy.
 * - autoIncrement: calls `.autoIncrement()` when `def.autoIncrement` is truthy.
 * - notNull:
 *   - Calls `.notNull()` when `def.notNull` is truthy.
 *   - When `isAlterTable` is true and no explicit `def.default` or `def.defaultSQL`
 *     is provided, a sensible default is applied to avoid violating existing row
 *     constraints. The current sensible defaults map contains:
 *       - integer -> 0
 *       - text -> ''
 *     The function calls `.defaultTo(...)` with the chosen value in this case.
 * - unique: calls `.unique()` when `def.unique` is truthy.
 * - defaultSQL: when `def.defaultSQL` is provided, `.defaultTo(sql.raw(def.defaultSQL))`
 *   is used to set a raw SQL expression as the default.
 * - default: when `def.default` is defined (and `defaultSQL` is not), `.defaultTo(def.default)`
 *   is used to set a literal default value.
 * - references: when `def.references` is provided, `.references("table.column")` is called;
 *   if `def.references.onDelete` is set, `.onDelete(...)` is chained as well.
 *
 * Notes and assumptions:
 * - `col` is expected to be a Kysely column builder (or any object exposing the
 *   chained methods used above). The function types `col` as `any` to allow flexibility,
 *   and it returns the same object after applying chains.
 * - `def.type` is used only to select sensible ALTER TABLE defaults for NOT NULL;
 *   types not included in the internal map will not receive an automatic default.
 * - When both `defaultSQL` and `default` are provided, `defaultSQL` takes precedence.
 * - This function mutates and returns the supplied `col` builder; it does not clone it.
 *
 * @param col - The column builder object to modify (e.g., a Kysely column builder).
 * @param def - Column definition describing constraints and default behavior.
 * @param isAlterTable - When true, apply ALTER TABLE specific behavior (e.g., add sensible
 *                       defaults for new NOT NULL columns when no default is present).
 *                       Defaults to false.
 * @returns The same `col` builder instance with chained constraint methods applied.
 */
export function applyColumnConstraints(col: any, def: ColumnDefinition, isAlterTable = false) {
	if (def.primaryKey) col = col.primaryKey();
	if (def.autoIncrement) col = col.autoIncrement(); // Kysely handles DB-specific syntax

	if (def.notNull) {
		if (isAlterTable && def.default === undefined && !def.defaultSQL) {
			// Provide sensible defaults for NOT NULL columns in ALTER TABLE
			const typeDefaults: Record<ColumnType, any> = {
				integer: 0,
				text: '',
			};
			col = col.notNull().defaultTo(typeDefaults[def.type]);
		} else {
			col = col.notNull();
		}
	}

	if (def.unique) col = col.unique();

	// Handle defaults
	if (def.defaultSQL) {
		col = col.defaultTo(sql.raw(def.defaultSQL));
	} else if (def.default !== undefined) {
		col = col.defaultTo(def.default);
	}

	// Handle foreign keys
	if (def.references) {
		col = col.references(`${def.references.table}.${def.references.column}`);
		if (def.references.onDelete) {
			col = col.onDelete(def.references.onDelete);
		}
	}

	return col;
}

/**
 * Creates a table in the database according to the provided TableDefinition.
 *
 * This Effect-based generator will:
 * - Log the start of table creation.
 * - Use the provided Kysely instance to build a CREATE TABLE statement for tableDef.name.
 * - Iterate over tableDef.columns, adding each column to the builder and applying column constraints
 *   (via applyColumnConstraints).
 * - Execute the CREATE TABLE statement, mapping any execution error to a SqlError.
 * - Log successful creation.
 * - Create any defined indexes for the table after the table has been created (via createIndexes).
 *
 * @param db - Kysely database instance for the application's schema.
 * @param tableDef - TableDefinition describing the table name, columns, and any index metadata.
 * @returns An Effect that performs the table and index creation side effects. The effect resolves on
 *          success or fails with a SqlError if the CREATE TABLE operation fails.
 * @throws {SqlError} If the underlying CREATE TABLE promise rejects, the error is wrapped as SqlError.
 */
export const createTable = Effect.fn(function* (db: Kysely<any>, tableDef: TableDefinition) {
	yield* Effect.logDebug(`Creating table ${tableDef.name}...`);

	let tableBuilder = db.schema.createTable(tableDef.name);

	yield* Effect.forEach(
		tableDef.columns,
		Effect.fn(function* (colDef) {
			tableBuilder = tableBuilder.addColumn(colDef.name, colDef.type, (col) =>
				applyColumnConstraints(col, colDef)
			);
		})
	);

	yield* Effect.tryPromise({
		try: () => tableBuilder.execute(),
		catch: (cause) => new SqlError({ cause }),
	});

	yield* Effect.logDebug(`Table ${tableDef.name} created.`);

	// Create indexes after table creation
	yield* createIndexes(db, tableDef);
});

/**
 * Add any missing non-primary-key columns defined in a table definition to an existing table.
 *
 * Compares the provided table definition against the list of existing column names and issues
 * ALTER TABLE ... ADD COLUMN statements for each column that is:
 * - present in `tableDef.columns`,
 * - not present in `existingColumns`, and
 * - not marked as a primary key on the definition.
 *
 * Each column addition uses applyColumnConstraints to apply the appropriate column constraints
 * and is executed via the Kysely schema builder. Individual add-column operations are executed
 * inside Effect.tryPromise so SQL-level failures are wrapped in a SqlError.
 *
 * The function logs informational messages about the check and about any columns that are added.
 *
 * @param db - Kysely instance connected to the target database.
 * @param tableDef - Table definition containing the table name and column definitions to ensure exist.
 * @param existingColumns - Array of column names that already exist on the target table.
 *
 * @returns An Effect that completes when all missing columns have been processed. If no columns
 *          needed to be added it resolves as a no-op after logging that nothing was added.
 *
 * @throws SqlError - If a SQL error occurs while attempting to add a column, the underlying error
 *         is wrapped in a SqlError and surfaced by the Effect.
 *
 * @remarks
 * - Primary key columns are intentionally skipped to avoid altering primary key definitions.
 * - Side effects: performs schema-altering SQL statements and emits informational logs.
 *
 * @example
 * // yield* addMissingColumns(db, myTableDefinition, ['id', 'created_at']);
 */
export const addMissingColumns = Effect.fn(function* (
	db: Kysely<any>,
	tableDef: TableDefinition,
	existingColumns: string[]
) {
	yield* Effect.logDebug(`${tableDef.name} exists, checking for missing columns...`);

	let addedCount = 0;

	yield* Effect.forEach(
		tableDef.columns,
		Effect.fn(function* (colDef) {
			if (existingColumns.includes(colDef.name)) return;
			if (colDef.primaryKey) return;

			yield* Effect.tryPromise({
				try: () =>
					db.schema
						.alterTable(tableDef.name)
						.addColumn(colDef.name, colDef.type, (col) => applyColumnConstraints(col, colDef, true))
						.execute(),
				catch: (cause) => new SqlError({ cause }),
			});

			yield* Effect.logDebug(`Column ${colDef.name} added to table ${tableDef.name}`);
			addedCount++;
		})
	);

	if (addedCount === 0) {
		yield* Effect.logDebug(`No missing columns to add for table ${tableDef.name}`);
	}
});

/* v8 ignore stop */

/**
 * Detects table names that existed in the previous schema but are absent from the current schema.
 *
 * This function is implemented as an Effect.fn generator and returns the list of removed table names.
 * Comparison is performed using the TableDefinition.name string values with exact (case-sensitive) equality.
 * The returned array preserves the order and duplicates (if any) from the previousSchema.
 *
 * @param currentSchema - Array of TableDefinition objects representing the current schema.
 * @param previousSchema - Array of TableDefinition objects representing the previous schema to compare against.
 * @returns An array of table names (strings) that are present in previousSchema but not present in currentSchema.
 *
 * @remarks
 * Time complexity is O(n + m) where n is the length of currentSchema and m is the length of previousSchema.
 * Space complexity is O(n) due to the temporary set of current table names.
 *
 * @example
 * // returns ["old_table"]
 * detectRemovedTables([{ name: "users" }], [{ name: "users" }, { name: "old_table" }])
 */
export const detectRemovedTables = Effect.fn(function* (
	currentSchema: TableDefinition[],
	previousSchema: TableDefinition[]
) {
	const currentTableNames = new Set(currentSchema.map((table) => table.name));
	const removedTables = previousSchema
		.map((table) => table.name)
		.filter((tableName) => !currentTableNames.has(tableName));
	return removedTables;
});
