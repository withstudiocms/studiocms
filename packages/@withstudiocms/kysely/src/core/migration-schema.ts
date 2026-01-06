/** biome-ignore-all lint/suspicious/noExplicitAny: Dynamic Operations */
import { pipe, Record, Schema } from 'effect';
import type { TableDefinition } from '../utils/migrator.js';
import { ColumnTypesId, isColumnTypes, type Table } from './schema.js';

export {
	BooleanFromNumber,
	ColumnType,
	CreatedAtDate,
	DateFromString,
	encodeDatabase,
	Generated,
	GeneratedAlways,
	JSONObjectFromString,
	JsonColumnType,
	NumberFromBoolean,
	OptionalColumnType,
	StringArrayFromString,
} from './schema.js';
export { Schema };

/**
 * Represents a migration table definition with its associated schema.
 *
 * @template Columns - The schema structure fields that define the columns of the table.
 *
 * @property migration - The table definition for the migration.
 * @property schema - The table schema containing the column definitions.
 *
 * @example
 * ```typescript
 * const myMigration: MigrationTableDefinition<MyColumns> = {
 *   migration: myTableDefinition,
 *   schema: myTableSchema
 * };
 * ```
 */
export type MigrationTableDefinition<Columns extends Schema.Struct.Fields> = {
	migration: TableDefinition;
	schema: Table<Columns>;
};

/**
 * Defines a database table with both SQL migration definition and runtime schema validation.
 *
 * @template Columns - The schema structure defining the table's columns
 *
 * @param name - The name of the database table
 * @param opts - Configuration options for the table
 * @param opts.sqlDefinition - SQL migration definition excluding the table name
 * @param opts.columnSchema - Schema definition for table columns with validation rules
 *
 * @returns A migration table definition containing:
 * - `migration`: Complete SQL table definition including the table name
 * - `schema`: Runtime schema with separate Select, Insert, and Update validators derived from column schemas
 *
 * @remarks
 * This function creates both migration definitions for database schema management and
 * runtime schemas for data validation. It automatically generates separate schemas for
 * Select, Insert, and Update operations based on the column definitions.
 *
 * @example
 * ```typescript
 * const userTable = defineTable('users', {
 *   sqlDefinition: {
 *     columns: [...]
 *   },
 *   columnSchema: {
 *     id: Schema.Number,
 *     name: Schema.String
 *   }
 * });
 * ```
 */
export const defineTable = <Columns extends Schema.Struct.Fields>(
	name: string,
	opts: {
		sqlDefinition: Omit<TableDefinition, 'name'>;
		columnSchema: Columns;
	}
): MigrationTableDefinition<Columns> => {
	const { sqlDefinition, columnSchema } = opts;

	const Select: any = Schema.Struct(
		Record.map(columnSchema, (v) => (isColumnTypes(v) ? v.Select : v))
	);
	const Insert: any = Schema.Struct(
		Record.map(columnSchema, (v) => (isColumnTypes(v) ? v.Insert : v))
	);
	const Update: any = Schema.Struct(
		Record.map(columnSchema, (v) => (isColumnTypes(v) ? v.Update : v))
	);
	const schema = Object.assign(Schema.Struct(columnSchema), {
		[ColumnTypesId]: ColumnTypesId,
		Select,
		Insert,
		Update,
	} as const);

	const migration: TableDefinition = {
		name,
		...sqlDefinition,
	};

	return {
		migration,
		schema,
	};
};

/**
 * Extracts the column definitions from a MigrationTableDefinition.
 */
type ExtractColumns<T> = T extends MigrationTableDefinition<infer C> ? C : never;

/**
 * Defines a database schema by mapping table definitions to their corresponding schema structures.
 *
 * This function takes a record of table definitions and transforms them into a structured schema
 * where each table's columns are properly typed and extracted.
 *
 * @template Tables - A record type where keys are table names and values are MigrationTableDefinition instances
 * @param tables - An object containing table definitions to be transformed into a schema
 * @returns A Schema.Struct where each key corresponds to a table with its extracted columns properly typed
 *
 * @example
 * ```typescript
 * const database = defineDatabase({
 *   users: userTableDefinition,
 *   posts: postTableDefinition
 * });
 * ```
 */
export const defineDatabase = <Tables extends Record<string, MigrationTableDefinition<any>>>(
	tables: Tables
): Schema.Struct<{ readonly [K in keyof Tables]: Table<ExtractColumns<Tables[K]>> }> =>
	pipe(
		Record.map(tables, (table) => table.schema),
		Schema.Struct
	) as unknown as Schema.Struct<{ readonly [K in keyof Tables]: Table<ExtractColumns<Tables[K]>> }>;

/**
 * Defines a migration schema by extracting migration definitions from a collection of tables.
 *
 * @param tables - A record of table names mapped to their migration table definitions
 * @returns An array of table definitions extracted from the migration property of each table
 *
 * @example
 * ```typescript
 * const tables = {
 *   users: { migration: userTableDef },
 *   posts: { migration: postTableDef }
 * };
 * const schema = defineMigrationSchema(tables);
 * ```
 */
export const defineMigrationSchema = (
	tables: Record<string, MigrationTableDefinition<any>>
): TableDefinition[] => Object.values(tables).map((table) => table.migration);

// // Example usage of defineTable
// const testTable = defineTable('TestTable', {
// 	sqlDefinition: {
// 		columns: [
// 			{ name: 'id', type: 'text', primaryKey: true },
// 			{ name: 'name', type: 'text', notNull: true },
// 			{ name: 'description', type: 'text' },
// 		],
// 	},
// 	columnSchema: {
// 		id: Schema.String,
// 		name: Schema.String,
// 		description: Schema.optional(Schema.String),
// 	},
// });

// // Example usage of defineDatabase
// const database = defineDatabase({
// 	TestTable: testTable,
// });

// // Example usage of defineMigrationSchema
// const migration = defineMigrationSchema({
// 	TestTable: testTable,
// });

// Example of the encoded database schema
// const encodedSchema = encodeDatabase(testDatabase);

/* The type of encodedSchema is:

const encodedSchema: {
    readonly TestTable: {
        readonly name: string;
        readonly id: string;
        readonly description?: string | undefined;
    };
}

*/
