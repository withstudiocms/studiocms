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
	dialect: DatabaseDialect;
	onTableCreated?: (tableName: string) => void | Promise<void>;
	onTableExists?: (tableName: string) => void | Promise<void>;
	silent?: boolean;
	logLevel?: LoggerLevel;
	logLabel?: string;
}

/**
 * KyselyTableManager
 *
 * Manages the lifecycle of a single database table using a Kysely instance and a declarative
 * table definition. Responsibilities include:
 * - Introspecting the database to determine whether the table exists.
 * - Creating the table with columns, constraints, defaults, foreign keys, indexes and triggers.
 * - Dropping and recreating the table.
 * - Providing an initialize method that conditionally creates the table and invokes callbacks.
 *
 * The manager is dialect-aware and uses information schema queries for introspection and
 * dialect-specific SQL for trigger creation (PostgreSQL requires a separate function creation).
 *
 * Constructor:
 * - db: A configured Kysely instance used to build and execute schema and raw SQL statements.
 * - options: Configuration for the manager. Required properties include:
 *   - tableDefinition: A TableDefinition describing name, columns, indexes and triggers.
 *   - dialect: One of the supported dialect strings (e.g. "postgres", "mysql", "sqlite").
 *   - onTableCreated?: Optional callback invoked with the table name after successful creation.
 *   - onTableExists?: Optional callback invoked with the table name when the table already exists.
 *   - silent?: When true, suppresses console logs produced by initialize.
 *
 * Public methods:
 * - tableExists(): Promise<boolean>
 *   Checks whether the configured table exists by querying the database's introspection tables.
 *
 * - createTable(): Promise<void>
 *   Creates the table according to the provided TableDefinition. The method:
 *   - Adds columns with declared attributes (primary key, auto-increment, not-null, unique,
 *     defaults, SQL defaults, foreign key references and onDelete behavior).
 *   - Creates declared indexes.
 *   - Creates declared triggers (dialect-specific SQL).
 *
 * - initialize(): Promise<void>
 *   Ensures the table exists. If it does not, creates it, logs progress unless suppressed, and
 *   calls onTableCreated. If it already exists, logs (unless suppressed) and calls onTableExists.
 *
 * - dropTable(): Promise<void>
 *   Drops the table if it exists.
 *
 * - recreateTable(): Promise<void>
 *   Convenience routine that drops the table (if present) then creates it anew.
 *
 * Private/internal methods:
 * - tableExistsViaIntrospection(tableName: string): Promise<boolean>
 *   Performs dialect-specific introspection to determine table existence:
 *   - Postgres: queries information_schema.tables for public schema.
 *   - MySQL: queries information_schema.tables using DATABASE() for the current schema.
 *   - SQLite: queries sqlite_master.
 *
 * - createIndex(index: IndexDefinition): Promise<void>
 *   Builds and executes an index creation statement (supports uniqueness and multiple columns).
 *
 * - createTrigger(trigger: TriggerDefinition): Promise<void>
 *   Creates triggers using raw SQL. For PostgreSQL, a trigger function is created or replaced
 *   and the trigger is attached to it. For SQLite and MySQL, a single CREATE TRIGGER statement
 *   is executed. The trigger body is injected as raw SQL (caller responsibility to ensure correctness).
 *
 * Errors and edge cases:
 * - Throws an error for unsupported dialect values when performing introspection or dialect-specific operations.
 * - Raw SQL execution (trigger/function creation) may propagate provider-specific errors (syntax, permission, etc.).
 * - The caller is responsible for supplying a correct and safe TableDefinition (including valid
 *   raw SQL in trigger bodies and defaultSQL) to avoid SQL injection or runtime errors.
 *
 * Notes:
 * - This class intentionally relies on Kysely's schema builder for typical DDL and on raw SQL
 *   for operations (like trigger functions) not uniformly supported by builders across dialects.
 * - The onTableCreated and onTableExists callbacks allow consumers to perform application-level
 *   migration or initialization tasks after the manager's actions.
 *
 * Example:
 * // Construct with a Kysely instance and options containing a TableDefinition and dialect,
 * // then call manager.initialize() to ensure the table exists.
 *
 * @remarks
 * - Keep trigger.bodySQL and column.defaultSQL under strict control; they are injected as raw SQL.
 * - The manager treats "public" as the schema for PostgreSQL introspection.
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
			silent: false,
			logLevel: 'info',
			logLabel: 'studiocms:database',
			...options,
		};
		this.logger = new SDKLogger({ level: this.options.logLevel }, this.options.logLabel);
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
				this.logger.info(`Table '${tableDefinition.name}' does not exist. Creating...`);
			}

			await this.createTable();

			if (!silent) {
				this.logger.info(`Table '${tableDefinition.name}' created successfully.`);
			}

			await onTableCreated(tableDefinition.name);
		} else {
			if (!silent) {
				this.logger.debug(`Table '${tableDefinition.name}' already exists.`);
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
