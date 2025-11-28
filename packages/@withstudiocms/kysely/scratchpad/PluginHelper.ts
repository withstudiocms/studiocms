/** biome-ignore-all lint/suspicious/noExplicitAny: Kysely requires `any` type for handling any migrations */
import { type Kysely, sql } from 'kysely';

/**
 * Supported database dialects.
 */
export type DatabaseDialect = 'sqlite' | 'mysql' | 'postgres';

/**
 * Supported column types.
 */
export type ColumnType = 'integer' | 'text';

/**
 * Trigger timing options.
 */
export type TriggerTiming = 'before' | 'after';

/**
 * Trigger event options.
 */
export type TriggerEvent = 'insert' | 'update' | 'delete';

/**
 * Defines a column in a database table.
 */
export interface ColumnDefinition {
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

/**
 * Defines an index on a database table.
 */
export interface IndexDefinition {
	name: string;
	columns: string[];
	unique?: boolean;
}

/**
 * Defines a trigger on a database table.
 */
export interface TriggerDefinition {
	name: string;
	timing: TriggerTiming; // 'before' | 'after'
	event: TriggerEvent; // 'insert' | 'update' | 'delete'
	// Body statements that can reference NEW/OLD. For SQLite/MySQL this is the trigger body;
	// for Postgres it's placed inside a trigger function that returns NEW/OLD automatically.
	bodySQL: string;
}

/**
 * Defines a database table schema.
 */
export interface TableDefinition {
	name: string;
	deprecated?: boolean;
	columns: ColumnDefinition[];
	indexes?: IndexDefinition[];
	triggers?: TriggerDefinition[];
}

interface TableManagerOptions {
	tableDefinition: TableDefinition;
	dialect: DatabaseDialect;
	onTableCreated?: (tableName: string) => void | Promise<void>;
	onTableExists?: (tableName: string) => void | Promise<void>;
	silent?: boolean;
}

export class KyselyTableManager {
	private db: Kysely<any>;
	private options: Required<Omit<TableManagerOptions, 'tableDefinition'>> & {
		tableDefinition: TableDefinition;
	};

	constructor(db: Kysely<any>, options: TableManagerOptions) {
		this.db = db;
		this.options = {
			onTableCreated: () => {},
			onTableExists: () => {},
			silent: false,
			...options,
		};
	}

	/**
	 * Check if table exists using database introspection
	 */
	private async tableExistsViaIntrospection(tableName: string): Promise<boolean> {
		const { dialect } = this.options;

		switch (dialect) {
			case 'postgres': {
				const result = await this.db
					.selectFrom('information_schema.tables')
					.select('table_name')
					.where('table_schema', '=', 'public')
					.where('table_name', '=', tableName)
					.executeTakeFirst();
				return !!result;
			}

			case 'mysql': {
				const result = await this.db
					.selectFrom('information_schema.tables')
					.select('table_name')
					.where('table_schema', '=', sql`DATABASE()`)
					.where('table_name', '=', tableName)
					.executeTakeFirst();
				return !!result;
			}

			case 'sqlite': {
				const result = await this.db
					.selectFrom('sqlite_master')
					.select('name')
					.where('type', '=', 'table')
					.where('name', '=', tableName)
					.executeTakeFirst();
				return !!result;
			}

			default:
				throw new Error(`Unsupported dialect: ${dialect}`);
		}
	}

	/**
	 * Check if table exists
	 */
	async tableExists(): Promise<boolean> {
		return this.tableExistsViaIntrospection(this.options.tableDefinition.name);
	}

	/**
	 * Create the table with defined columns
	 */
	async createTable(): Promise<void> {
		const { tableDefinition } = this.options;

		let builder = this.db.schema.createTable(tableDefinition.name);

		// Add columns
		for (const column of tableDefinition.columns) {
			builder = builder.addColumn(column.name, column.type, (col) => {
				if (column.primaryKey) {
					col = col.primaryKey();
				}
				if (column.autoIncrement) {
					col = col.autoIncrement();
				}
				if (column.notNull) {
					col = col.notNull();
				}
				if (column.unique) {
					col = col.unique();
				}
				if (column.default !== undefined) {
					col = col.defaultTo(column.default);
				}
				if (column.defaultSQL) {
					col = col.defaultTo(sql.raw(column.defaultSQL));
				}
				if (column.references) {
					col = col.references(`${column.references.table}.${column.references.column}`);
					if (column.references.onDelete) {
						col = col.onDelete(column.references.onDelete);
					}
				}
				return col;
			});
		}

		await builder.execute();

		// Create indexes if defined
		if (tableDefinition.indexes) {
			for (const index of tableDefinition.indexes) {
				await this.createIndex(index);
			}
		}

		// Create triggers if defined
		if (tableDefinition.triggers) {
			for (const trigger of tableDefinition.triggers) {
				await this.createTrigger(trigger);
			}
		}
	}

	/**
	 * Create an index
	 */
	private async createIndex(index: IndexDefinition): Promise<void> {
		const { tableDefinition } = this.options;

		let builder = this.db.schema.createIndex(index.name).on(tableDefinition.name);

		if (index.unique) {
			builder = builder.unique();
		}

		builder = builder.columns(index.columns);

		await builder.execute();
	}

	/**
	 * Create a trigger
	 */
	private async createTrigger(trigger: TriggerDefinition): Promise<void> {
		const { tableDefinition, dialect } = this.options;

		if (dialect === 'postgres') {
			// PostgreSQL requires a function first, then the trigger
			const functionName = `${trigger.name}_func`;

			await sql`
        CREATE OR REPLACE FUNCTION ${sql.raw(functionName)}()
        RETURNS TRIGGER AS $$
        BEGIN
          ${sql.raw(trigger.bodySQL)}
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `.execute(this.db);

			await sql`
        CREATE TRIGGER ${sql.raw(trigger.name)}
        ${sql.raw(trigger.timing.toUpperCase())} ${sql.raw(trigger.event.toUpperCase())}
        ON ${sql.table(tableDefinition.name)}
        FOR EACH ROW
        EXECUTE FUNCTION ${sql.raw(functionName)}();
      `.execute(this.db);
		} else {
			// SQLite and MySQL
			await sql`
        CREATE TRIGGER ${sql.raw(trigger.name)}
        ${sql.raw(trigger.timing.toUpperCase())} ${sql.raw(trigger.event.toUpperCase())}
        ON ${sql.table(tableDefinition.name)}
        FOR EACH ROW
        BEGIN
          ${sql.raw(trigger.bodySQL)}
        END;
      `.execute(this.db);
		}
	}

	/**
	 * Initialize table - create if it doesn't exist
	 */
	async initialize(): Promise<void> {
		const { tableDefinition, onTableCreated, onTableExists, silent } = this.options;

		const exists = await this.tableExists();

		if (!exists) {
			if (!silent) {
				console.log(`Table '${tableDefinition.name}' does not exist. Creating...`);
			}

			await this.createTable();

			if (!silent) {
				console.log(`Table '${tableDefinition.name}' created successfully.`);
			}

			await onTableCreated(tableDefinition.name);
		} else {
			if (!silent) {
				console.log(`Table '${tableDefinition.name}' already exists.`);
			}

			await onTableExists(tableDefinition.name);
		}
	}

	/**
	 * Drop the table if it exists
	 */
	async dropTable(): Promise<void> {
		const { tableDefinition } = this.options;
		await this.db.schema.dropTable(tableDefinition.name).ifExists().execute();
	}

	/**
	 * Recreate the table (drop and create)
	 */
	async recreateTable(): Promise<void> {
		await this.dropTable();
		await this.createTable();
	}
}

// ============================================================
// USAGE EXAMPLES
// ============================================================

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
				bodySQL: `SET NEW.timestamp = strftime('%s', 'now');`,
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
