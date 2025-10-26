/** biome-ignore-all lint/suspicious/noExplicitAny: It's okay, doing dynamic stuff */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Kysely, sql } from 'kysely';
import type { StudioCMSDatabaseSchema } from '../tables.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to check if a table exists
async function tableExists(
	tableName: string,
	db: Kysely<StudioCMSDatabaseSchema>
): Promise<boolean> {
	const result = await sql<{ name: string }>`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=${tableName}
  `.execute(db);

	return result.rows.length > 0;
}

// Helper to get existing columns for a table
async function getTableColumns(
	tableName: string,
	db: Kysely<StudioCMSDatabaseSchema>
): Promise<string[]> {
	const result = await sql`PRAGMA table_info(${sql.ref(tableName)})`.execute(db);
	return result.rows.map((row: any) => row.name);
}

// ============================================================================
// DYNAMIC SCHEMA DEFINITION
// ============================================================================
// Define your entire database schema here. The sync function will automatically
// create tables and add missing columns based on this configuration.
// ============================================================================

type ColumnType = 'integer' | 'text' | 'blob';

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

export interface TableDefinition {
	name: string;
	deprecated?: boolean;
	columns: ColumnDefinition[];
}

// ============================================================================
// DYNAMIC SYNC FUNCTIONS
// ============================================================================

// Helper to apply column constraints dynamically
function applyColumnConstraints(col: any, def: ColumnDefinition, isAlterTable = false) {
	if (def.primaryKey) col = col.primaryKey();
	if (def.autoIncrement) col = col.autoIncrement();
	if (def.notNull) {
		// For ALTER TABLE, we need a default value for NOT NULL columns
		if (isAlterTable && def.default === undefined && !def.defaultSQL) {
			// Provide a sensible default based on type
			const typeDefaults: Record<ColumnType, any> = {
				integer: 0,
				text: '',
				blob: null,
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

// Create a new table based on definition
async function createTable(tableDef: TableDefinition, db: Kysely<StudioCMSDatabaseSchema>) {
	console.log(`Creating ${tableDef.name} table...`);

	let tableBuilder = db.schema.createTable(tableDef.name);

	for (const colDef of tableDef.columns) {
		tableBuilder = tableBuilder.addColumn(colDef.name, colDef.type, (col) =>
			applyColumnConstraints(col, colDef)
		);
	}

	await tableBuilder.execute();
	console.log(`✓ ${tableDef.name} table created`);
}

// Add missing columns to an existing table
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

// Detect tables that were removed from schema (comparing previous vs current)
function detectRemovedTables(
	currentSchema: TableDefinition[],
	previousSchema: TableDefinition[]
): string[] {
	const currentTableNames = new Set(currentSchema.map((table) => table.name));
	return previousSchema
		.filter((table) => !currentTableNames.has(table.name))
		.map((table) => table.name);
}

// Sync database schema - handles adding new tables and columns dynamically
export async function syncDatabaseSchema(
	schemaDefinition: TableDefinition[],
	previousSchema: TableDefinition[],
	db: Kysely<StudioCMSDatabaseSchema>
) {
	console.log('Starting database schema synchronization...\n');

	// Step 1: Drop tables that were removed from schema (exist in previous but not in current)
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
				}
				console.log(''); // Empty line for readability
			}
		}
	}

	console.log('✅ Database schema synchronization completed!');
}

export async function rollbackMigration(
	currentSchema: TableDefinition[],
	previousSchema: TableDefinition[],
	db: Kysely<StudioCMSDatabaseSchema>
) {
	console.log('Starting migration rollback...\n');

	const previousTableNames = new Set(previousSchema.map((table) => table.name));

	for (const tableDef of currentSchema) {
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

export async function getPreviousMigrationSchema(
	previousMigrationName: string | null
): Promise<TableDefinition[]> {
	console.log('Getting previous migration schema');

	// Derive the previous migration file path
	const migrationsFolder = '../migrations';
	const migrationFiles = await fs.readdir(path.join(__dirname, migrationsFolder));
	const sortedMigrations = migrationFiles
		.filter((file) => (file.endsWith('.ts') && !file.endsWith('.d.ts')) || file.endsWith('.js'))
		.sort();

	if (!previousMigrationName) {
		console.log('No previous migration specified, returning empty schema');
		return [];
	}

	// previousMigrationName is expected to be without extension
	const previousMigrationFile = sortedMigrations.find((file) =>
		file.startsWith(previousMigrationName)
	);

	if (!previousMigrationFile) {
		console.log('No previous migration found, returning empty schema');
		return [];
	}

	const previousMigrationPath = path.join(__dirname, migrationsFolder, previousMigrationFile);

	const previousMigrationModule = await import(previousMigrationPath);

	if (typeof previousMigrationModule.schemaDefinition !== 'undefined') {
		const schemaDef = previousMigrationModule.schemaDefinition as TableDefinition[];
		if (Array.isArray(schemaDef)) {
			return schemaDef;
		}
		console.log('Previous migration schemaDefinition is not an array, returning empty schema');
		return [];
	}
	console.log('Previous migration does not export schemaDefinition, returning empty schema');
	return [];
}
