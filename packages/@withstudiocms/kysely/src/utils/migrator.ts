/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */

import { Cause, Data, Effect } from 'effect';
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
		Effect.map(() => Effect.die(new Error('Migration failed. See logs for details.')))
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

type DatabaseDialect = 'sqlite' | 'mysql' | 'postgres';
type ColumnType = 'integer' | 'text';
type TriggerTiming = 'before' | 'after';
type TriggerEvent = 'insert' | 'update' | 'delete';

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

interface TriggerDefinition {
	name: string;
	timing: TriggerTiming; // 'before' | 'after'
	event: TriggerEvent; // 'insert' | 'update' | 'delete'
	// Body statements that can reference NEW/OLD. For SQLite/MySQL this is the trigger body;
	// for Postgres it's placed inside a trigger function that returns NEW/OLD automatically.
	bodySQL: string;
}

export interface TableDefinition {
	name: string;
	deprecated?: boolean;
	columns: ColumnDefinition[];
	indexes?: IndexDefinition[];
	triggers?: TriggerDefinition[];
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

const getTableTriggers = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableName: string
) {
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

// ============================================================================
// TRIGGER SQL BUILDERS (Dialect-specific)
// ============================================================================

function quoteIdent(dialect: DatabaseDialect, ident: string): string {
	switch (dialect) {
		case 'mysql':
			return `\`${ident}\``;
		case 'sqlite':
		case 'postgres':
			return `"${ident}"`;
	}
}

function toUpperKeyword<T extends string>(v: T): string {
	return v.toUpperCase();
}

function buildSQLiteTriggerSQL(table: string, t: TriggerDefinition): string {
	const timing = toUpperKeyword(t.timing); // BEFORE|AFTER
	const event = toUpperKeyword(t.event); // INSERT|UPDATE|DELETE
	// SQLite uses FOR EACH ROW implicitly; BEGIN...END allows multi-statement bodies
	return `CREATE TRIGGER IF NOT EXISTS ${quoteIdent('sqlite', t.name)} ${timing} ${event} ON ${quoteIdent('sqlite', table)}
FOR EACH ROW
BEGIN
${t.bodySQL}
END;`;
}

function buildMySQLTriggerSQL(table: string, t: TriggerDefinition): string {
	const timing = toUpperKeyword(t.timing); // BEFORE|AFTER
	const event = toUpperKeyword(t.event); // INSERT|UPDATE|DELETE
	// MySQL requires FOR EACH ROW. Programmatic clients don't need DELIMITER changes.
	const body = t.bodySQL.trim();
	const bodyWrapped = body.toUpperCase().startsWith('BEGIN')
		? body
		: `BEGIN
${body}
END`;
	return `CREATE TRIGGER ${quoteIdent('mysql', t.name)} ${timing} ${event} ON ${quoteIdent('mysql', table)}
FOR EACH ROW
${bodyWrapped};`;
}

function buildPostgresTriggerSQL(table: string, t: TriggerDefinition) {
	const timing = toUpperKeyword(t.timing); // BEFORE|AFTER
	const event = toUpperKeyword(t.event); // INSERT|UPDATE|DELETE
	const fnName = `${table}_${t.name}_fn`;
	const returnValue = t.event === 'delete' ? 'OLD' : 'NEW';

	const fnSQL = `CREATE OR REPLACE FUNCTION ${quoteIdent('postgres', fnName)}()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
${t.bodySQL}
RETURN ${returnValue};
END
$$;`;

	const trgSQL = `CREATE TRIGGER ${quoteIdent('postgres', t.name)} ${timing} ${event} ON ${quoteIdent('postgres', table)}
FOR EACH ROW
EXECUTE FUNCTION ${quoteIdent('postgres', fnName)}();`;

	return { fnSQL, trgSQL };
}

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

	yield* Effect.forEach(
		tableDef.indexes,
		Effect.fn(function* (indexDef) {
			const exists = yield* indexExists(db, indexDef.name);
			if (exists) {
				yield* Effect.logInfo(`Index ${indexDef.name} already exists for table ${tableDef.name}`);
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

			yield* Effect.logInfo(`Index ${indexDef.name} created for table ${tableDef.name}`);
		})
	);
});

const addMissingIndexes = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition,
	existingIndexes: string[]
) {
	if (!tableDef.indexes || tableDef.indexes.length === 0) return;

	yield* Effect.logInfo(`Adding missing indexes for table ${tableDef.name}`);

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

			yield* Effect.logInfo(`Index ${indexDef.name} added for table ${tableDef.name}`);
			addedCount++;
		})
	);

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

	yield* Effect.forEach(
		indexesToDrop,
		Effect.fn(function* (indexName) {
			yield* Effect.logInfo(`Dropping index ${indexName} from table ${tableDef.name}`);
			yield* Effect.tryPromise({
				try: () => db.schema.dropIndex(indexName).execute(),
				catch: (cause) => new SqlError({ cause }),
			});
			yield* Effect.logInfo(`Index ${indexName} dropped from table ${tableDef.name}`);
		})
	);
});

const createTable = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition
) {
	yield* Effect.logInfo(`Creating table ${tableDef.name}...`);

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

			yield* Effect.logInfo(`Column ${colDef.name} added to table ${tableDef.name}`);
			addedCount++;
		})
	);

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

const addMissingTriggersForTable = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition,
	existingTriggers: string[]
) {
	if (!tableDef.triggers || tableDef.triggers.length === 0) return;

	const dialect = yield* getDialect(db);

	yield* Effect.forEach(
		tableDef.triggers,
		Effect.fn(function* (t) {
			if (existingTriggers.includes(t.name)) return;

			yield* Effect.logInfo(`Creating trigger ${t.name} on ${tableDef.name}...`);

			switch (dialect) {
				case 'sqlite': {
					const sqlText = buildSQLiteTriggerSQL(tableDef.name, t);
					yield* makeSql((sql) => sql.raw(sqlText).execute(db));
					break;
				}
				case 'mysql': {
					const sqlText = buildMySQLTriggerSQL(tableDef.name, t);
					yield* makeSql((sql) => sql.raw(sqlText).execute(db));
					break;
				}
				case 'postgres': {
					const { fnSQL, trgSQL } = buildPostgresTriggerSQL(tableDef.name, t);
					yield* makeSql((sql) => sql.raw(fnSQL).execute(db));
					yield* makeSql((sql) => sql.raw(trgSQL).execute(db));
					break;
				}
			}

			yield* Effect.logInfo(`Trigger ${t.name} created on ${tableDef.name}`);
		})
	);
});

const dropRemovedTriggersForTable = Effect.fn(function* (
	db: Kysely<StudioCMSDatabaseSchema>,
	tableDef: TableDefinition,
	existingTriggers: string[]
) {
	const defined = new Set((tableDef.triggers ?? []).map((t) => t.name));
	const toDrop = existingTriggers.filter((name) => !defined.has(name));

	if (toDrop.length === 0) return;

	const dialect = yield* getDialect(db);

	yield* Effect.forEach(
		toDrop,
		Effect.fn(function* (trigName) {
			yield* Effect.logInfo(`Dropping trigger ${trigName} from ${tableDef.name}...`);

			switch (dialect) {
				case 'sqlite': {
					yield* makeSql((sql) =>
						sql.raw(`DROP TRIGGER IF EXISTS ${quoteIdent('sqlite', trigName)};`).execute(db)
					);
					break;
				}
				case 'mysql': {
					yield* makeSql((sql) =>
						sql.raw(`DROP TRIGGER IF EXISTS ${quoteIdent('mysql', trigName)};`).execute(db)
					);
					break;
				}
				case 'postgres': {
					yield* makeSql((sql) =>
						sql
							.raw(
								`DROP TRIGGER IF EXISTS ${quoteIdent('postgres', trigName)} ON ${quoteIdent(
									'postgres',
									tableDef.name
								)};`
							)
							.execute(db)
					);
					break;
				}
			}

			yield* Effect.logInfo(`Trigger ${trigName} dropped from ${tableDef.name}`);
		})
	);
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
