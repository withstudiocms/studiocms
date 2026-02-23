import { Schema } from 'effect';

/**
 * Supported database dialects.
 */
export const DatabaseDialectSchema = Schema.Literal('sqlite', 'mysql', 'postgres');

/**
 * Supported database dialects.
 */
export type DatabaseDialect = typeof DatabaseDialectSchema.Encoded;

/**
 * Supported column types.
 */
export const ColumnTypeSchema = Schema.Literal('integer', 'text');

/**
 * Supported column types.
 */
export type ColumnType = typeof ColumnTypeSchema.Encoded;

/**
 * Trigger timing options.
 */
export const TriggerTimingSchema = Schema.Literal('before', 'after');

/**
 * Trigger timing options.
 */
export type TriggerTiming = typeof TriggerTimingSchema.Encoded;

/**
 * Trigger event options.
 */
export const TriggerEventSchema = Schema.Literal('insert', 'update', 'delete');

/**
 * Trigger event options.
 */
export type TriggerEvent = typeof TriggerEventSchema.Encoded;

/**
 * Defines a column in a database table.
 */
export const ColumnDefinitionSchema = Schema.mutable(
	Schema.Struct({
		name: Schema.String,
		type: ColumnTypeSchema,
		primaryKey: Schema.optional(Schema.Boolean),
		autoIncrement: Schema.optional(Schema.Boolean),
		notNull: Schema.optional(Schema.Boolean),
		unique: Schema.optional(Schema.Boolean),
		default: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
		defaultSQL: Schema.optional(Schema.String),
		references: Schema.optional(
			Schema.mutable(
				Schema.Struct({
					table: Schema.String,
					column: Schema.String,
					onDelete: Schema.optional(Schema.Literal('cascade', 'set null', 'restrict', 'no action')),
				})
			)
		),
	})
);

/**
 * Defines a column in a database table.
 */
export type ColumnDefinition = typeof ColumnDefinitionSchema.Encoded;

/**
 * Defines an index on a database table.
 */
export const IndexDefinitionSchema = Schema.mutable(
	Schema.Struct({
		name: Schema.String,
		columns: Schema.mutable(Schema.Array(Schema.String)),
		unique: Schema.optional(Schema.Boolean),
	})
);

/**
 * Defines an index on a database table.
 */
export type IndexDefinition = typeof IndexDefinitionSchema.Encoded;

/**
 * Defines a trigger on a database table.
 */
export const TriggerDefinitionSchema = Schema.mutable(
	Schema.Struct({
		name: Schema.String,
		timing: TriggerTimingSchema,
		event: TriggerEventSchema,
		// Body statements that can reference NEW/OLD. For SQLite/MySQL this is the trigger body;
		// for Postgres it's placed inside a trigger function that returns NEW/OLD automatically.
		bodySQL: Schema.String,
	})
);

/**
 * Defines a trigger on a database table.
 */
export type TriggerDefinition = typeof TriggerDefinitionSchema.Encoded;

/**
 * Defines a database table schema.
 */
export const TableDefinitionSchema = Schema.mutable(
	Schema.Struct({
		name: Schema.String,
		deprecated: Schema.optional(Schema.Boolean),
		columns: Schema.mutable(Schema.Array(ColumnDefinitionSchema)),
		indexes: Schema.optional(Schema.mutable(Schema.Array(IndexDefinitionSchema))),
		triggers: Schema.optional(Schema.mutable(Schema.Array(TriggerDefinitionSchema))),
	})
);

/**
 * Defines a database table schema.
 */
export type TableDefinition = typeof TableDefinitionSchema.Encoded;

/**
 * Defines the structure of the saved schema in the database, which includes an array of table definitions.
 */
export const StringifiedTableDefinitionArraySchema = Schema.transform(
	Schema.mutable(Schema.Array(TableDefinitionSchema)),
	Schema.String,
	{
		strict: true,
		decode: (tableDef) => JSON.stringify(tableDef),
		encode: (str) => {
			try {
				const parsed = JSON.parse(str);
				return Schema.decodeUnknownSync(Schema.mutable(Schema.Array(TableDefinitionSchema)))(
					parsed
				);
			} catch (error) {
				throw new Error(
					`Failed to parse table definition: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		},
	}
);

/**
 * A utility function to stringify an array of table definitions using the defined schema.
 *
 * @param tableDefinitions - An array of table definitions to be stringified.
 * @returns A string representation of the table definitions.
 */
export const stringifyTableSchema = Schema.decode(StringifiedTableDefinitionArraySchema);

/**
 * A utility function to parse a stringified array of table definitions back into its original structure using the defined schema.
 *
 * @param str - A string representation of the table definitions.
 * @returns An array of table definitions.
 */
export const parseTableSchema = Schema.encode(StringifiedTableDefinitionArraySchema);
