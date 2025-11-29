/** biome-ignore-all lint/suspicious/noExplicitAny: Kysely requires `any` type for handling any migrations */

import { type Kysely, sql } from 'kysely';
import { type LoggerLevel, SDKLogger } from './utils/logger.js';
import type {
	DatabaseDialect,
	IndexDefinition,
	TableDefinition,
	TriggerDefinition,
} from './utils/types.js';

export type {
	DatabaseDialect,
	IndexDefinition,
	TableDefinition,
	TriggerDefinition,
} from './utils/types.js';

/**
 * Options for configuring the KyselyTableManager.
 */
export interface TableManagerOptions {
	tableDefinition: TableDefinition;
	onTableCreated?: (tableName: string) => void | Promise<void>;
	onTableExists?: (tableName: string) => void | Promise<void>;
	logLevel?: LoggerLevel;
	logLabel?: string;
}

/**
 * KyselyTableManager
 *
 * Manages the lifecycle of a single database table using a Kysely instance:
 * - detects the database dialect,
 * - inspects whether the table exists,
 * - creates the table (columns, indexes, triggers),
 * - drops and recreates the table,
 * - invokes lifecycle callbacks and logs progress.
 *
 * The manager maps a TableDefinition (columns, indexes, triggers) to Kysely schema builder calls
 * and executes any required raw SQL for triggers or SQL-default values. Dialect-specific
 * behavior is applied where necessary (for example, PostgreSQL trigger functions vs. SQLite
 * inline trigger bodies).
 *
 * Constructor parameters:
 * @param db - The Kysely instance used to run schema and raw SQL statements.
 * @param options - TableManagerOptions describing the table to manage and runtime behavior.
 *   - tableDefinition: TableDefinition (required) – name, columns, indexes and triggers to create.
 *   - onTableCreated?: (tableName: string) => Promise<void> | void – callback executed after creation.
 *   - onTableExists?: (tableName: string) => Promise<void> | void – callback executed if the table already exists.
 *   - silent?: boolean – when true, reduces logging (default: false).
 *   - logLevel?: string – logging verbosity for SDKLogger (default: 'info').
 *   - logLabel?: string – logger label (default: 'studiocms:database').
 *
 * Important methods and behavior:
 *
 * - getDialect(): DatabaseDialect
 *   Determines the underlying database dialect by inspecting the Kysely executor's adapter
 *   (e.g. sqlite, mysql, postgres). Throws an Error if the dialect cannot be determined or is unsupported.
 *   @internal
 *
 * - tableExistsViaIntrospection(tableName: string): Promise<boolean>
 *   Uses information_schema (Postgres/MySQL) or sqlite_master (SQLite) to determine whether the
 *   given table exists. Returns true when the table is present.
 *   @internal
 *
 * - tableExists(): Promise<boolean>
 *   Convenience wrapper that checks existence for the table defined in options.tableDefinition.name.
 *
 * - createTable(): Promise<void>
 *   Creates the table as described by the provided TableDefinition:
 *     - iterates columns and maps column properties (primaryKey, autoIncrement, notNull,
 *       unique, default, defaultSQL, references and onDelete) to Kysely column builder calls;
 *     - executes the CREATE TABLE statement via the Kysely schema builder;
 *     - creates any defined indexes and triggers after the table creation.
 *   Note: defaultSQL and trigger bodies are executed as raw SQL (sql.raw), so they must be valid
 *   for the target dialect.
 *
 * - createIndex(index: IndexDefinition): Promise<void>
 *   Creates an index on the managed table. Supports multi-column indexes and unique indexes.
 *   @internal
 *
 * - createTrigger(trigger: TriggerDefinition): Promise<void>
 *   Creates a trigger on the managed table. Behavior is dialect-aware:
 *     - PostgreSQL: creates a helper function (plpgsql) then a trigger that executes the function.
 *     - SQLite/MySQL: creates the trigger with an inline body.
 *   Raw SQL fragments are used for function/trigger bodies and names; ensure names and bodies
 *   are safe and valid for the dialect.
 *   @internal
 *
 * - initialize(): Promise<void>
 *   Public entry point to ensure the table exists. If the table does not exist:
 *     - logs (unless silent),
 *     - creates the table (columns/indexes/triggers),
 *     - calls onTableCreated with the table name.
 *   If the table already exists:
 *     - logs a debug message (unless silent),
 *     - calls onTableExists with the table name.
 *
 * - dropTable(): Promise<void>
 *   Drops the managed table if it exists (uses schema.dropTable(...).ifExists()).
 *
 * - recreateTable(): Promise<void>
 *   Convenience method that drops the table (if present) and then creates it again.
 *
 * Errors and side effects:
 * - Throws an Error when an unsupported or unrecognized dialect is encountered.
 * - All DDL operations and any raw SQL used for defaults or triggers are executed against the
 *   provided Kysely instance and therefore have side effects on the connected database.
 *
 * Threading/transactional notes:
 * - Dialect detection uses adapter capabilities (e.g. supportsReturning, supportsTransactionalDdl)
 *   to infer behavior; transactional DDL support varies by dialect and influences the approach.
 *
 * Example (conceptual):
 * const manager = new KyselyTableManager(db, { tableDefinition, onTableCreated: () => {...} });
 * await manager.initialize();
 *
 * @public
 */
export class KyselyTableManager {
	private db: Kysely<any>;
	private options: Required<Omit<TableManagerOptions, 'tableDefinition'>> & {
		tableDefinition: TableDefinition;
	};
	private logger: SDKLogger;

	constructor(db: Kysely<any>, options: TableManagerOptions) {
		this.db = db;
		this.options = {
			onTableCreated: () => {},
			onTableExists: () => {},
			logLevel: 'info',
			logLabel: 'studiocms:database',
			...options,
		};
		this.logger = new SDKLogger({ level: this.options.logLevel }, this.options.logLabel);
	}

	/**
	 * Get the database dialect from the Kysely instance
	 */
	private getDialect(): DatabaseDialect {
		const { adapter } = this.db.getExecutor();

		const cases = [
			{
				dialect: 'sqlite' as DatabaseDialect,
				condition: adapter.supportsReturning && !adapter.supportsTransactionalDdl,
			},
			/* v8 ignore start */
			{
				dialect: 'mysql' as DatabaseDialect,
				condition: !adapter.supportsReturning && !adapter.supportsTransactionalDdl,
			},
			{
				dialect: 'postgres' as DatabaseDialect,
				condition: adapter.supportsReturning && adapter.supportsTransactionalDdl,
			},
			/* v8 ignore stop */
		];

		for (const { condition, dialect } of cases) {
			if (condition) return dialect;
		}

		throw new Error('Unsupported database dialect');
	}

	/**
	 * Check if table exists using database introspection
	 */
	private async tableExistsViaIntrospection(tableName: string): Promise<boolean> {
		const dialect = this.getDialect();

		switch (dialect) {
			case 'sqlite': {
				const result = await this.db
					.selectFrom('sqlite_master')
					.select('name')
					.where('type', '=', 'table')
					.where('name', '=', tableName)
					.executeTakeFirst();
				return !!result;
			}

			/* v8 ignore start */
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

			default:
				throw new Error(`Unsupported dialect: ${dialect}`);
			/* v8 ignore stop */
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
		const dialect = this.getDialect();
		const { tableDefinition } = this.options;

		/* v8 ignore start */
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
			/* v8 ignore stop */
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
		const { tableDefinition, onTableCreated, onTableExists } = this.options;

		this.logger.info(`Verifying existence of table '${tableDefinition.name}'...`);

		const exists = await this.tableExists();

		if (!exists) {
			this.logger.info(`Table '${tableDefinition.name}' does not exist. Creating...`);

			await this.createTable();

			this.logger.info(`Table '${tableDefinition.name}' created successfully.`);

			await onTableCreated(tableDefinition.name);
		} else {
			this.logger.info(`Table '${tableDefinition.name}' already exists.`);

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
