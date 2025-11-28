/** biome-ignore-all lint/suspicious/noExplicitAny: Kysely requires `any` type for handling any migrations */
import type { Kysely } from 'kysely';
import { KyselyTableManager } from '../src/plugin.js';
import type { DatabaseDialect, TableDefinition } from '../src/utils/types.js';

// Example 1: Simple plugin table
export async function initializePluginTable(db: Kysely<any>, dialect: DatabaseDialect) {
	const tableDefinition: TableDefinition = {
		name: 'plugin_data',
		columns: [
			{
				name: 'id',
				type: 'integer',
				primaryKey: true,
				autoIncrement: true,
			},
			{
				name: 'key',
				type: 'text',
				notNull: true,
				unique: true,
			},
			{
				name: 'value',
				type: 'text',
			},
			{
				name: 'created_at',
				type: 'integer',
				notNull: true,
			},
		],
	};

	const manager = new KyselyTableManager(db, {
		tableDefinition,
		dialect,
	});

	await manager.initialize();
}

// Example 2: Table with indexes and foreign keys
export async function initializeAdvancedTable(db: Kysely<any>, dialect: DatabaseDialect) {
	const tableDefinition: TableDefinition = {
		name: 'plugin_sessions',
		columns: [
			{
				name: 'id',
				type: 'integer',
				primaryKey: true,
				autoIncrement: true,
			},
			{
				name: 'user_id',
				type: 'integer',
				notNull: true,
				references: {
					table: 'plugin_users',
					column: 'id',
					onDelete: 'cascade',
				},
			},
			{
				name: 'token',
				type: 'text',
				notNull: true,
				unique: true,
			},
			{
				name: 'expires_at',
				type: 'integer',
				notNull: true,
			},
		],
		indexes: [
			{
				name: 'idx_sessions_user_id',
				columns: ['user_id'],
			},
			{
				name: 'idx_sessions_token',
				columns: ['token'],
				unique: true,
			},
		],
	};

	const manager = new KyselyTableManager(db, {
		tableDefinition,
		dialect,
		onTableCreated: async (tableName) => {
			console.log(`${tableName} created! Inserting default data...`);
		},
	});

	await manager.initialize();
}

// Example 3: Table with triggers
export async function initializeTableWithTriggers(db: Kysely<any>, dialect: DatabaseDialect) {
	const tableDefinition: TableDefinition = {
		name: 'plugin_audit_log',
		columns: [
			{
				name: 'id',
				type: 'integer',
				primaryKey: true,
				autoIncrement: true,
			},
			{
				name: 'action',
				type: 'text',
				notNull: true,
			},
			{
				name: 'timestamp',
				type: 'integer',
				notNull: true,
			},
		],
		triggers: [
			{
				name: 'set_audit_timestamp',
				timing: 'before',
				event: 'insert',
				bodySQL: 'UPDATE plugin_audit_log SET timestamp = CURRENT_TIMESTAMP;',
			},
		],
	};

	const manager = new KyselyTableManager(db, {
		tableDefinition,
		dialect,
	});

	await manager.initialize();
}

// Example 4: Multiple tables with shared dialect
export async function initializePluginTables(db: Kysely<any>, dialect: DatabaseDialect) {
	const tables: TableDefinition[] = [
		{
			name: 'plugin_users',
			columns: [
				{ name: 'id', type: 'integer', primaryKey: true, autoIncrement: true },
				{ name: 'username', type: 'text', notNull: true, unique: true },
				{ name: 'email', type: 'text', notNull: true, unique: true },
			],
		},
		{
			name: 'plugin_sessions',
			columns: [
				{ name: 'id', type: 'integer', primaryKey: true, autoIncrement: true },
				{
					name: 'user_id',
					type: 'integer',
					notNull: true,
					references: {
						table: 'plugin_users',
						column: 'id',
						onDelete: 'cascade',
					},
				},
				{ name: 'token', type: 'text', notNull: true },
			],
		},
	];

	// Initialize all tables
	await Promise.all(
		tables.map((tableDefinition) =>
			new KyselyTableManager(db, { tableDefinition, dialect }).initialize()
		)
	);
}
