/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */

import { type Kysely, sql } from 'kysely';
import type { StudioCMSDatabaseSchema } from '../tables.js';

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

function getDialect(db: Kysely<any>): DatabaseDialect {
	const adapter = db.getExecutor().adapter;

	if (!adapter.supportsReturning && !adapter.supportsTransactionalDdl) {
		return 'mysql'; // MySQL lacks both features
	}

	if (adapter.supportsReturning && !adapter.supportsTransactionalDdl) {
		return 'sqlite'; // SQLite doesn't support TransactionalDdl
	}

	return 'postgres'; // Postgres support all the above
}

// ============================================================================
// SCHEMA INTROSPECTION HELPERS (Database-Agnostic)
// ============================================================================

async function tableExists(
	tableName: string,
	db: Kysely<StudioCMSDatabaseSchema>
): Promise<boolean> {
	const dialect = getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = await sql<{ name: string }>`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name=${tableName}
            `.execute(db);
			return result.rows.length > 0;
		}
		case 'mysql': {
			const result = await sql<{ TABLE_NAME: string }>`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${tableName}
            `.execute(db);
			return result.rows.length > 0;
		}
		case 'postgres': {
			const result = await sql<{ tablename: string }>`
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' AND tablename = ${tableName}
            `.execute(db);
			return result.rows.length > 0;
		}
	}
}

async function indexExists(
	indexName: string,
	db: Kysely<StudioCMSDatabaseSchema>
): Promise<boolean> {
	const dialect = getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = await sql<{ name: string }>`
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name=${indexName}
            `.execute(db);
			return result.rows.length > 0;
		}
		case 'mysql': {
			const result = await sql<{ INDEX_NAME: string }>`
                SELECT INDEX_NAME 
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = ${indexName}
            `.execute(db);
			return result.rows.length > 0;
		}
		case 'postgres': {
			const result = await sql<{ indexname: string }>`
                SELECT indexname 
                FROM pg_indexes 
                WHERE schemaname = 'public' AND indexname = ${indexName}
            `.execute(db);
			return result.rows.length > 0;
		}
	}
}

async function getTableColumns(
	tableName: string,
	db: Kysely<StudioCMSDatabaseSchema>
): Promise<string[]> {
	const dialect = getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = await sql`PRAGMA table_info(${sql.ref(tableName)})`.execute(db);
			return result.rows.map((row: any) => row.name);
		}
		case 'mysql': {
			const result = await sql<{ COLUMN_NAME: string }>`
                SELECT COLUMN_NAME 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${tableName}
            `.execute(db);
			return result.rows.map((row) => row.COLUMN_NAME);
		}
		case 'postgres': {
			const result = await sql<{ column_name: string }>`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = ${tableName}
            `.execute(db);
			return result.rows.map((row) => row.column_name);
		}
	}
}

async function getTableIndexes(
	tableName: string,
	db: Kysely<StudioCMSDatabaseSchema>
): Promise<string[]> {
	const dialect = getDialect(db);

	switch (dialect) {
		case 'sqlite': {
			const result = await sql<{ name: string }>`
                SELECT name FROM sqlite_master 
                WHERE type='index' AND tbl_name=${tableName}
                AND name NOT LIKE 'sqlite_autoindex_%'
            `.execute(db);
			return result.rows.map((row) => row.name);
		}
		case 'mysql': {
			const result = await sql<{ INDEX_NAME: string }>`
                SELECT DISTINCT INDEX_NAME 
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ${tableName}
                AND INDEX_NAME != 'PRIMARY'
            `.execute(db);
			return result.rows.map((row) => row.INDEX_NAME);
		}
		case 'postgres': {
			const result = await sql<{ indexname: string }>`
                SELECT indexname 
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND tablename = ${tableName}
            `.execute(db);
			return result.rows.map((row) => row.indexname);
		}
	}
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

async function createIndexes(tableDef: TableDefinition, db: Kysely<StudioCMSDatabaseSchema>) {
	if (!tableDef.indexes || tableDef.indexes.length === 0) return;

	console.log(`  Creating indexes for ${tableDef.name}...`);

	for (const indexDef of tableDef.indexes) {
		const exists = await indexExists(indexDef.name, db);
		if (!exists) {
			let indexBuilder = db.schema
				.createIndex(indexDef.name)
				.on(tableDef.name)
				.columns(indexDef.columns);

			if (indexDef.unique) {
				indexBuilder = indexBuilder.unique();
			}

			await indexBuilder.execute();
			console.log(`    ✓ Created index: ${indexDef.name}`);
		} else {
			console.log(`    ℹ Index ${indexDef.name} already exists`);
		}
	}
}

async function addMissingIndexes(
	tableDef: TableDefinition,
	existingIndexes: string[],
	db: Kysely<StudioCMSDatabaseSchema>
) {
	if (!tableDef.indexes || tableDef.indexes.length === 0) return;

	console.log(`  Checking for new indexes on ${tableDef.name}...`);
	let addedCount = 0;

	for (const indexDef of tableDef.indexes) {
		if (!existingIndexes.includes(indexDef.name)) {
			let indexBuilder = db.schema
				.createIndex(indexDef.name)
				.on(tableDef.name)
				.columns(indexDef.columns);

			if (indexDef.unique) {
				indexBuilder = indexBuilder.unique();
			}

			await indexBuilder.execute();
			console.log(`    ✓ Added index: ${indexDef.name}`);
			addedCount++;
		}
	}

	if (addedCount === 0) {
		console.log('    ℹ No new indexes to add');
	}
}

async function dropRemovedIndexes(
	tableDef: TableDefinition,
	existingIndexes: string[],
	db: Kysely<StudioCMSDatabaseSchema>
) {
	const definedIndexes = new Set((tableDef.indexes || []).map((idx) => idx.name));
	const indexesToDrop = existingIndexes.filter((idx) => !definedIndexes.has(idx));

	if (indexesToDrop.length > 0) {
		console.log(`  Dropping removed indexes from ${tableDef.name}...`);
		for (const indexName of indexesToDrop) {
			await db.schema.dropIndex(indexName).execute();
			console.log(`    ✓ Dropped index: ${indexName}`);
		}
	}
}

async function createTable(tableDef: TableDefinition, db: Kysely<StudioCMSDatabaseSchema>) {
	console.log(`Creating ${tableDef.name} table...`);

	let tableBuilder = db.schema.createTable(tableDef.name);

	for (const colDef of tableDef.columns) {
		// Kysely automatically converts 'integer' to the appropriate type for each database
		tableBuilder = tableBuilder.addColumn(colDef.name, colDef.type, (col) =>
			applyColumnConstraints(col, colDef)
		);
	}

	await tableBuilder.execute();
	console.log(`✓ ${tableDef.name} table created`);

	await createIndexes(tableDef, db);
}

async function addMissingColumns(
	tableDef: TableDefinition,
	existingColumns: string[],
	db: Kysely<StudioCMSDatabaseSchema>
) {
	console.log(`${tableDef.name} table exists, checking for new columns...`);
	let addedCount = 0;

	for (const colDef of tableDef.columns) {
		// Skip primary key columns (can't be added later)
		if (colDef.primaryKey) continue;

		if (!existingColumns.includes(colDef.name)) {
			await db.schema
				.alterTable(tableDef.name)
				.addColumn(colDef.name, colDef.type, (col) => applyColumnConstraints(col, colDef, true))
				.execute();

			console.log(`  ✓ Added column: ${colDef.name}`);
			addedCount++;
		}
	}

	if (addedCount === 0) {
		console.log('  ℹ No new columns to add');
	}
}

function detectRemovedTables(
	currentSchema: TableDefinition[],
	previousSchema: TableDefinition[]
): string[] {
	const currentTableNames = new Set(currentSchema.map((table) => table.name));
	return previousSchema
		.filter((table) => !currentTableNames.has(table.name))
		.map((table) => table.name);
}

// ============================================================================
// MAIN MIGRATION FUNCTIONS
// ============================================================================

export async function syncDatabaseSchema(
	schemaDefinition: TableDefinition[],
	previousSchema: TableDefinition[],
	db: Kysely<StudioCMSDatabaseSchema>
) {
	console.log('Starting database schema synchronization...\n');

	const removedTables = detectRemovedTables(schemaDefinition, previousSchema);

	if (removedTables.length > 0) {
		console.log(`🗑️  Dropping ${removedTables.length} removed table(s) from previous schema:`);
		for (const tableName of removedTables) {
			const exists = await tableExists(tableName, db);
			if (exists) {
				console.log(`  Dropping removed table: ${tableName}...`);
				await db.schema.dropTable(tableName).execute();
				console.log(`  ✓ Dropped: ${tableName}`);
			} else {
				console.log(`  ℹ Table ${tableName} already doesn't exist, skipping.`);
			}
		}
		console.log('');
	}

	for (const tableDef of schemaDefinition) {
		const exists = await tableExists(tableDef.name, db);

		switch (tableDef.deprecated) {
			case true:
				if (exists) {
					console.log(`Dropping deprecated table: ${tableDef.name}...`);
					await db.schema.dropTable(tableDef.name).execute();
					console.log(`✓ Dropped table: ${tableDef.name}`);
				} else {
					console.log(`Table ${tableDef.name} is deprecated and does not exist, skipping drop.`);
				}
				break;
			case false:
			case undefined: {
				if (!exists) {
					await createTable(tableDef, db);
				} else {
					const existingColumns = await getTableColumns(tableDef.name, db);
					await addMissingColumns(tableDef, existingColumns, db);

					const existingIndexes = await getTableIndexes(tableDef.name, db);
					await dropRemovedIndexes(tableDef, existingIndexes, db);
					await addMissingIndexes(tableDef, existingIndexes, db);
				}
				console.log('');
			}
		}
	}

	console.log('✅ Database schema synchronization completed!');
}

export async function rollbackMigration(
	schemaDefinition: TableDefinition[],
	previousSchema: TableDefinition[],
	db: Kysely<StudioCMSDatabaseSchema>
) {
	console.log('Starting migration rollback...\n');

	const previousTableNames = new Set(previousSchema.map((table) => table.name));

	for (const tableDef of schemaDefinition) {
		if (!previousTableNames.has(tableDef.name)) {
			const exists = await tableExists(tableDef.name, db);
			if (exists) {
				console.log(`Dropping table not present in previous schema: ${tableDef.name}...`);
				await db.schema.dropTable(tableDef.name).execute();
				console.log(`✓ Dropped table: ${tableDef.name}`);
			} else {
				console.log(`Table ${tableDef.name} does not exist, skipping drop.`);
			}
		}
	}

	console.log('✅ Migration rollback completed!');
}
