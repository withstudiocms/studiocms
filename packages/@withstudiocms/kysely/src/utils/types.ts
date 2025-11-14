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
