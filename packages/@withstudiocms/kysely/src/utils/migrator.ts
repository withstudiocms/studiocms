/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */

import { Cause, Data, Effect, pipe } from 'effect';
import { type Kysely, type QueryResult, type Sql, sql } from 'kysely';
import type { StudioCMSDatabaseSchema } from '../tables.js';

// ============================================================================
// ERROR CLASSES
// ============================================================================

class SqlError extends Data.TaggedError('SqlError')<{ cause: unknown }> {}

class DialectDeterminationError extends Data.TaggedError('DialectDeterminationError')<{
	cause: unknown;
}> {}

// ============================================================================
// Error Helpers
// ============================================================================

const handleCause = (cause: Cause.Cause<DialectDeterminationError | SqlError>) =>
	Effect.logError(`Migration failure: ${Cause.pretty(cause)}`).pipe(
		Effect.map(() => {
			return new Error('Migration failed. See logs for details.');
		}),
		Effect.flatMap((error) => Effect.die(error))
	);

// ============================================================================
// Effect Wrappers
// ============================================================================

const makeSql = <T>(fn: (sql: Sql) => Promise<QueryResult<T>>) =>
	Effect.tryPromise({
		try: () => fn(sql),
		catch: (cause) => new SqlError({ cause }),
	});

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

type ColumnType = 'integer' | 'text';
type DatabaseDialect = 'sqlite' | 'mysql' | 'postgres';

interface ColumnDefinition {
	name: string;
	type: ColumnType;
	primaryKey?: boolean;
	autoIncrement?: boolean;
	notNull?: boolean;
	unique?: boolean;
	default?: string | number;
	defaultSQL?: string; // For SQL expressions like CURRENT_TIMESTAMP
	references?: {
		table: string;
		column: string;
		onDelete?: 'cascade' | 'set null' | 'restrict' | 'no action';
	};
}

interface IndexDefinition {
	name: string;
	columns: string[];
	unique?: boolean;
}

export interface TableDefinition {
	name: string;
	deprecated?: boolean;
	columns: ColumnDefinition[];
	indexes?: IndexDefinition[];
}

// ============================================================================
// DATABASE DIALECT DETECTION
// ============================================================================

const getDialect = Effect.fn(function* (db: Kysely<StudioCMSDatabaseSchema>) {
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

// ============================================================================
// SCHEMA INTROSPECTION HELPERS (Database-Agnostic)
// ============================================================================

const tableExists = Effect.fn(function* (db: Kysely<StudioCMSDatabaseSchema>, tableName: string) {
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

const indexExists = Effect.fn(function* (db: Kysely<StudioCMSDatabaseSchema>, indexName: string) {
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

const getTableColumns = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableName: string
) {
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

const getTableIndexes = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableName: string
) {
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
                AND tablename = ${tableName}
            `.execute(db)
			);
			return result.rows.map((row) => row.indexname);
		}
	}
});

// ============================================================================
// SCHEMA MODIFICATION HELPERS
// ============================================================================

function applyColumnConstraints(col: any, def: ColumnDefinition, isAlterTable = false) {
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

const createIndexes = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition
) {
	if (!tableDef.indexes || tableDef.indexes.length === 0) return;

	yield* Effect.logInfo(`Creating indexes for table ${tableDef.name} if they do not exist`);

	for (const indexDef of tableDef.indexes) {
		const exists = yield* indexExists(db, indexDef.name);
		if (exists) {
			yield* Effect.logInfo(`Index ${indexDef.name} already exists for table ${tableDef.name}`);
			continue;
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

		yield* Effect.logInfo(`Index ${indexDef.name} created for table ${tableDef.name}`);
	}
});

const addMissingIndexes = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition,
	existingIndexes: string[]
) {
	if (!tableDef.indexes || tableDef.indexes.length === 0) return;

	yield* Effect.logInfo(`Adding missing indexes for table ${tableDef.name}`);

	let addedCount = 0;

	for (const indexDef of tableDef.indexes) {
		if (existingIndexes.includes(indexDef.name)) continue;

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

		yield* Effect.logInfo(`Index ${indexDef.name} added for table ${tableDef.name}`);
		addedCount++;
	}

	if (addedCount === 0) {
		yield* Effect.logInfo(`No missing indexes to add for table ${tableDef.name}`);
	}
});

const dropRemovedIndexes = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition,
	existingIndexes: string[]
) {
	const definedIndexes = new Set((tableDef.indexes || []).map((idx) => idx.name));
	const indexesToDrop = existingIndexes.filter((idx) => !definedIndexes.has(idx));

	yield* pipe(
		indexesToDrop,
		Effect.forEach(
			Effect.fn(function* (indexName) {
				yield* Effect.logInfo(`Dropping index ${indexName} from table ${tableDef.name}`);
				yield* Effect.tryPromise({
					try: () => db.schema.dropIndex(indexName).execute(),
					catch: (cause) => new SqlError({ cause }),
				});
				yield* Effect.logInfo(`Index ${indexName} dropped from table ${tableDef.name}`);
			})
		)
	);
});

const createTable = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition
) {
	yield* Effect.logInfo(`Creating table ${tableDef.name}...`);

	let tableBuilder = db.schema.createTable(tableDef.name);

	for (const colDef of tableDef.columns) {
		tableBuilder = tableBuilder.addColumn(colDef.name, colDef.type, (col) =>
			applyColumnConstraints(col, colDef)
		);
	}

	yield* Effect.tryPromise({
		try: () => tableBuilder.execute(),
		catch: (cause) => new SqlError({ cause }),
	});

	yield* Effect.logInfo(`Table ${tableDef.name} created.`);

	// Create indexes after table creation
	yield* createIndexes(db, tableDef);
});

const addMissingColumns = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition,
	existingColumns: string[]
) {
	yield* Effect.logInfo(`${tableDef.name} exists, checking for missing columns...`);

	let addedCount = 0;

	for (const colDef of tableDef.columns) {
		if (existingColumns.includes(colDef.name)) continue;
		if (colDef.primaryKey) continue;

		yield* Effect.tryPromise({
			try: () =>
				db.schema
					.alterTable(tableDef.name)
					.addColumn(colDef.name, colDef.type, (col) => applyColumnConstraints(col, colDef, true))
					.execute(),
			catch: (cause) => new SqlError({ cause }),
		});

		yield* Effect.logInfo(`Column ${colDef.name} added to table ${tableDef.name}`);
		addedCount++;
	}

	if (addedCount === 0) {
		yield* Effect.logInfo(`No missing columns to add for table ${tableDef.name}`);
	}
});

const detectRemovedTables = Effect.fn(function* (
	currentSchema: TableDefinition[],
	previousSchema: TableDefinition[]
) {
	const currentTableNames = new Set(currentSchema.map((table) => table.name));
	const removedTables = previousSchema
		.map((table) => table.name)
		.filter((tableName) => !currentTableNames.has(tableName));
	return removedTables;
});

// ============================================================================
// MAIN MIGRATION FUNCTIONS
// ============================================================================

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
			for (const tableName of removedTables) {
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
			}
			yield* Effect.logInfo('');
		}

		// Sync current schema
		for (const tableDef of schemaDefinition) {
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
						yield* addMissingIndexes(db, tableDef, existingIndexes);
						yield* dropRemovedIndexes(db, tableDef, existingIndexes);
					}
					break;
				}
			}
		}

		yield* Effect.logInfo('✅ Database schema synchronization complete.');
	}).pipe(Effect.catchAllCause(handleCause));

export const rollbackMigration = (
	db: Kysely<StudioCMSDatabaseSchema>,
	schemaDefinition: TableDefinition[],
	previousSchema: TableDefinition[]
) =>
	Effect.gen(function* () {
		yield* Effect.logInfo('Starting database schema rollback...');

		const previousTableNames = new Set(previousSchema.map((table) => table.name));

		for (const tableDef of schemaDefinition) {
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
		}

		yield* Effect.logInfo('✅ Migration rollback completed!');
	}).pipe(Effect.catchAllCause(handleCause));
