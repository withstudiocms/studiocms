/** biome-ignore-all lint/suspicious/noExplicitAny: it's okay */

import { hasProperty } from 'effect/Predicate';
import * as Record from 'effect/Record';
import * as Schema from 'effect/Schema';
import type * as kysely from 'kysely';

/**
 * Unique identifier for ColumnTypes marker.
 */
export const ColumnTypesId = Symbol.for('effect-sql-kysely/ColumnTypesId');

/**
 * Unique identifier type for ColumnTypes marker.
 *
 * This type alias represents the type of the ColumnTypesId symbol used
 * to brand objects as ColumnTypes. It is primarily used for internal
 * type-checking and branding purposes within the library.
 */
export type ColumnTypesId = typeof ColumnTypesId;

/**
 * Describes the column value types for a table or view for different query contexts.
 *
 * This generic interface groups three separate type maps describing the value shapes
 * that are allowed when selecting, inserting, or updating columns.
 *
 * @template Select - A mapping of column names to the types returned by SELECT queries.
 *                     Typically these types represent the actual stored or computed values.
 * @template Insert - A mapping of column names to the types accepted by INSERT operations.
 *                     Insert types may allow undefined/optional values for columns with defaults
 *                     or auto-generated values.
 * @template Update - A mapping of column names to the types accepted by UPDATE operations.
 *                     Update types may allow partial/optional values for columns that can be
 *                     omitted in patch-style updates.
 *
 * @remarks
 * - The `select`, `insert`, and `update` members are readonly to emphasize that this
 *   interface is a static type-level description of column shapes and should not be
 *   mutated at runtime.
 * - The `[ColumnTypesId]` property is a branding/marker (usually a unique symbol key)
 *   used internally to identify values as `ColumnTypes`. It is not intended for general
 *   runtime use and exists to help the type system distinguish this structure from other objects.
 *
 * @example
 * // Example shape of column types for a "user" table:
 * // type UserSelect = { id: number; email: string; createdAt: Date }
 * // type UserInsert = { email: string; password: string; createdAt?: Date }
 * // type UserUpdate = { email?: string; password?: string }
 *
 */
export interface ColumnTypes<
	Select extends Schema.Schema.All,
	Insert extends Schema.Schema.All,
	Update extends Schema.Schema.All,
> {
	readonly [ColumnTypesId]: ColumnTypesId;
	readonly select: Select;
	readonly insert: Insert;
	readonly update: Update;
}

/**
 * Create a typed ColumnType schema that describes how a single database column
 * should be represented in select, insert and update contexts for integration
 * with Kysely.
 *
 * This factory accepts three schema definitions (one for each context) and
 * returns a Schema that is typed as a Kysely.ColumnType for runtime use while
 * also exposing the original per-context schemas on the resulting object.
 *
 * The returned value:
 * - is a Schema whose Type and Encoded type parameters map to
 *   kysely.ColumnType<Type<Select>, Type<Insert>, Type<Update>> and
 *   kysely.ColumnType<Encoded<Select>, Encoded<Insert>, Encoded<Update>>.
 * - carries an additional ColumnTypes marker and the original `select`,
 *   `insert`, and `update` schema objects as readonly properties.
 * - includes an annotation message warning that the produced schema is not
 *   intended to be used directly and that callers should access
 *   ColumnType.select / ColumnType.insert / ColumnType.update instead.
 *
 * Type parameters:
 * @template Select  - Schema for the "select" (read) representation of the column.
 * @template Insert  - Schema for the "insert" (create) representation of the column.
 * @template Update  - Schema for the "update" (patch) representation of the column.
 *
 * Parameters:
 * @param select - Schema describing the column's selected value and encoding.
 * @param insert - Schema describing the column's value when inserting.
 * @param update - Schema describing the column's value when updating.
 *
 * Returns:
 * A schema object typed as a Kysely ColumnType with preserved per-context
 * schemas and a ColumnTypes marker. The object should be consumed via its
 * exposed `select`, `insert`, and `update` members rather than used directly.
 *
 * Example:
 * ```ts
 * // const col = ColumnType(StringSchema, StringSchema, PartialStringSchema);
 * // db.table('users').select(col.select) ...
 * ```
 */
export const ColumnType = <
	Select extends Schema.Schema.All,
	Insert extends Schema.Schema.All,
	Update extends Schema.Schema.All,
>(
	select: Select,
	insert: Insert,
	update: Update
): Schema.Schema<
	kysely.ColumnType<
		Schema.Schema.Type<Select>,
		Schema.Schema.Type<Insert>,
		Schema.Schema.Type<Update>
	>,
	kysely.ColumnType<
		Schema.Schema.Encoded<Select>,
		Schema.Schema.Encoded<Insert>,
		Schema.Schema.Encoded<Update>
	>,
	Schema.Schema.Context<Select | Insert | Update>
> &
	ColumnTypes<Select, Insert, Update> => {
	return Object.assign(
		Schema.make<any, any, never>(Schema.Never.ast).annotations({
			message: () =>
				'ColumnType Schema is not intended to be used directly. Utilize ColumnType.[select|insert|update]',
		}),
		{
			[ColumnTypesId]: ColumnTypesId,
			select,
			insert,
			update,
		} as const
	);
};

/**
 * Runtime type guard that determines whether a value conforms to the ColumnTypes shape.
 *
 * This function checks for the presence of the internal ColumnTypes identifier (ColumnTypesId)
 * using hasProperty, and acts as a TypeScript type predicate narrowing `value` to
 * ColumnTypes<any, any, any> when it returns true.
 *
 * @param value - The value to test.
 * @returns True if `value` appears to be a ColumnTypes object (has the ColumnTypesId property); otherwise false.
 *
 * @example
 * if (isColumnTypes(someValue)) {
 *   // Here someValue is narrowed to ColumnTypes<any, any, any>
 * }
 */
const isColumnTypes = (value: unknown): value is ColumnTypes<any, any, any> =>
	hasProperty(value, ColumnTypesId);

/**
 * Mark a schema's read and write types as database-generated.
 *
 * Wraps the provided schema so that both the select (read) and insert (write)
 * type mappings are wrapped with `kysely.Generated<T>`, indicating those
 * columns are generated by the database (for example: serial/identity ids,
 * auto-generated timestamps, etc.). The runtime column mapping `R` is kept
 * unchanged. The returned type is also augmented with the column-type helpers
 * derived from the original schema.
 *
 * @template A - the original select (read) type mapping for the schema
 * @template I - the original insert (write) type mapping for the schema
 * @template R - the runtime column types mapping for the schema
 *
 * @param schema - the schema to convert; its select/insert types will be
 *                 wrapped with `kysely.Generated`
 *
 * @returns A new schema whose select and insert types are `kysely.Generated<...>`
 *          versions of the originals, and which includes the same column-type
 *          helper information as the input schema.
 *
 * @remarks
 * Use this helper when you want the type system to reflect that a column's
 * value is produced by the database rather than supplied by the application.
 */
export const Generated = <A, I, R>(
	schema: Schema.Schema<A, I, R>
): Schema.Schema<kysely.Generated<A>, kysely.Generated<I>, R> &
	ColumnTypes<typeof schema, Schema.UndefinedOr<typeof schema>, typeof schema> =>
	ColumnType(schema, Schema.UndefinedOr(schema), schema);

/**
 * Mark a schema's columns as "generated always" (i.e. produced by the database).
 *
 * Transforms the provided schema so that both the "A" and "I" generic projections are
 * wrapped with kysely.GeneratedAlways, indicating those fields are generated by the
 * database and should be treated as read-only from the client perspective. The runtime
 * projection R is left unchanged.
 *
 * The returned type is also intersected with ColumnTypes<typeof schema, typeof Schema.Never, typeof Schema.Never>,
 * which effectively prevents supplying values for these columns during insert/update operations.
 *
 * @typeParam A - original schema's "A" type parameter (select/read projection).
 * @typeParam I - original schema's "I" type parameter (insert/input projection).
 * @typeParam R - original schema's runtime/raw type parameter.
 *
 * @param schema - The source schema to convert into a generated-always schema.
 *
 * @returns A new Schema.Schema whose A and I projections are wrapped with kysely.GeneratedAlways,
 *          and whose column types for insert/update are set to Schema.Never (read-only/generated).
 *
 * @remarks
 * Implementation note: this is implemented via ColumnType(schema, Schema.Never, Schema.Never).
 *
 * @example
 * // Given a schema `userSchema`, produce a version where columns are treated as DB-generated:
 * // const generatedUser = GeneratedAlways(userSchema);
 */
export const GeneratedAlways = <A, I, R>(
	schema: Schema.Schema<A, I, R>
): Schema.Schema<kysely.GeneratedAlways<A>, kysely.GeneratedAlways<I>, R> &
	ColumnTypes<typeof schema, typeof Schema.Never, typeof Schema.Never> =>
	ColumnType(schema, Schema.Never, Schema.Never);

/**
 * Create a JSON column schema that preserves distinct compile-time types for
 * select (read), encoded, context, insert and update operations.
 *
 * This is a thin wrapper around `ColumnType(select, insert, update)` that
 * composes a Kysely `JSONColumnType` from the provided `select` schema and the
 * optional `insert` and `update` schemas.
 *
 * The produced schema:
 * - Uses `kysely.JSONColumnType` to represent the runtime/DB JSON column type,
 *   with the concrete TypeScript types derived from the supplied schemas.
 * - Exposes additional helper column type members via `ColumnTypes<typeof select, Insert, Update>`.
 *
 * @template SelectType
 *   The type of the select (runtime) value described by the `select` schema.
 *   Typically an object or `null`.
 * @template SelectEncoded
 *   The encoded form (how the value is represented when serialized) of the
 *   `select` schema.
 * @template SelectContext
 *   Additional context used by the `select` schema (if any).
 * @template Insert
 *   Schema describing the allowed type for insert operations. Defaults to
 *   `Schema.String` when not provided.
 * @template Update
 *   Schema describing the allowed type for update operations. Defaults to
 *   `Schema.String` when not provided.
 *
 * @param select
 *   A Schema describing the JSON payload for reads (select). Its `Type`,
 *   `Encoded` and `Context` utilities are used to derive the resulting
 *   `kysely.JSONColumnType`.
 * @param insert
 *   Optional schema for insert operations. If omitted the schema defaults to
 *   `Schema.String`. This schema's `Type` and `Encoded` are incorporated into
 *   the resulting JSON column type for inserts.
 * @param update
 *   Optional schema for update operations. If omitted the schema defaults to
 *   `Schema.String`. This schema's `Type` and `Encoded` are incorporated into
 *   the resulting JSON column type for updates.
 *
 * @returns
 *   A composed `Schema.Schema` representing a Kysely JSON column type:
 *   - The select/read type is `kysely.JSONColumnType<Schema.Schema.Type<typeof select>, Schema.Schema.Type<Insert>, Schema.Schema.Type<Update>>`.
 *   - The encoded type is `kysely.JSONColumnType<Schema.Schema.Encoded<typeof select>, Schema.Schema.Encoded<Insert>, Schema.Schema.Encoded<Update>>`.
 *   - The schema context is `Schema.Schema.Context<typeof select | Insert | Update>`.
 *   The returned value also includes `ColumnTypes<typeof select, Insert, Update>` helpers.
 *
 * @remarks
 *   Use this helper when you need a JSON column whose TypeScript statics for
 *   select/insert/update differ (for example: read types are richer, while
 *   insert/update types accept partial or different shapes).
 */
export const JsonColumnType = <
	SelectType extends object | null,
	SelectEncoded extends object | null,
	SelectContext,
	Insert extends Schema.Schema<string, string, any> = Schema.Schema<string, string, never>,
	Update extends Schema.Schema<string, string, any> = Schema.Schema<string, string, never>,
>(
	select: Schema.Schema<SelectType, SelectEncoded, SelectContext>,
	insert: Insert = Schema.String as any,
	update: Update = Schema.String as any
): Schema.Schema<
	kysely.JSONColumnType<
		Schema.Schema.Type<typeof select>,
		Schema.Schema.Type<Insert>,
		Schema.Schema.Type<Update>
	>,
	kysely.JSONColumnType<
		Schema.Schema.Encoded<typeof select>,
		Schema.Schema.Encoded<Insert>,
		Schema.Schema.Encoded<Update>
	>,
	Schema.Schema.Context<typeof select | Insert | Update>
> &
	ColumnTypes<typeof select, Insert, Update> => ColumnType(select, insert, update);

/**
 * Helper type function to extract the select shapes from column types.
 */
type GetSelectType<T> = T extends ColumnTypes<infer Select, any, any>
	? Schema.Schema.Type<Select>
	: Schema.Schema.Type<T>;

/**
 * Helper type function to extract the insert shapes from column types.
 */
type GetInsertType<T> = T extends ColumnTypes<any, infer Insert, any>
	? Schema.Schema.Type<Insert>
	: Schema.Schema.Type<T>;

/**
 * Helper type function to extract the update shapes from column types.
 */
type GetUpdateType<T> = T extends ColumnTypes<any, any, infer Update>
	? Schema.Schema.Type<Update>
	: Schema.Schema.Type<T>;

/**
 * Helper type function to extract the select encoded shapes from column types.
 */
type GetSelectEncoded<T> = T extends ColumnTypes<infer Select, any, any>
	? Schema.Schema.Encoded<Select>
	: Schema.Schema.Encoded<T>;

/**
 * Helper type function to extract the insert encoded shapes from column types.
 */
type GetInsertEncoded<T> = T extends ColumnTypes<any, infer Insert, any>
	? Schema.Schema.Encoded<Insert>
	: Schema.Schema.Encoded<T>;

/**
 * Helper type function to extract the update encoded shapes from column types.
 */
type GetUpdateEncoded<T> = T extends ColumnTypes<any, any, infer Update>
	? Schema.Schema.Encoded<Update>
	: Schema.Schema.Encoded<T>;

/**
 * Represents a strongly-typed database table definition.
 *
 * This interface models a table as a structured collection of columns and
 * augments that structure with derived column types appropriate for different
 * query contexts (SELECT, INSERT, UPDATE). It ties together the raw column
 * declarations provided in `Columns` with the library's transformation helpers
 * so consumers get correctly typed shapes and encoded representations for each
 * operation.
 *
 * @template Columns - A mapping of column names to column schema descriptors
 *   (must extend Schema.Struct.Fields). Each entry describes the column's shape
 *   and associated metadata used by the helper type functions below.
 *
 * @remarks
 * - The interface extends `Schema.Struct<Columns>` so the table itself can be
 *   treated as a structured schema object containing the original column
 *   descriptors.
 * - It also extends `ColumnTypes<...>` where three transformed `Schema.Struct`
 *   shapes are provided:
 *   1. Select-time schemas: `GetSelectType` and `GetSelectEncoded` are applied
 *      per column to produce the runtime and encoded types used when reading
 *      (SELECT).
 *   2. Insert-time schemas: `GetInsertType` and `GetInsertEncoded` are applied
 *      per column to produce the types expected when inserting rows.
 *   3. Update-time schemas: `GetUpdateType` and `GetUpdateEncoded` are
 *      applied per column to produce the types expected when updating rows.
 * - Each transformed schema preserves the original column's context via
 *   `Schema.Schema.Context<Columns[K]>`, ensuring contextual metadata flows to the
 *   derived types (e.g., nullability, defaulting behavior, or custom encoders).
 *
 * @example
 * // Example (conceptual) usage:
 * // type UserColumns = {
 * //   id: PrimaryKeySchema<number>,
 * //   name: StringSchema,
 * //   metadata: JsonSchema<MyMeta>
 * // };
 * // type UserTable = Table<UserColumns>;
 * // // UserTable now exposes:
 * // // - original schema descriptors (for introspection)
 * // // - select-safe types for reading rows
 * // // - insert-safe and update-safe types for write operations
 *
 * @see Schema.Struct
 * @see ColumnTypes
 * @see GetSelectType
 * @see GetInsertType
 * @see GetUpdateType
 *
 * @since 0.1.0
 */
export interface Table<Columns extends Schema.Struct.Fields>
	extends Schema.Struct<Columns>,
		ColumnTypes<
			Schema.Struct<{
				readonly [K in keyof Columns]: Schema.Schema<
					GetSelectType<Columns[K]>,
					GetSelectEncoded<Columns[K]>,
					Schema.Schema.Context<Columns[K]>
				>;
			}>,
			Schema.Struct<{
				readonly [K in keyof Columns]: Schema.Schema<
					GetInsertType<Columns[K]>,
					GetInsertEncoded<Columns[K]>,
					Schema.Schema.Context<Columns[K]>
				>;
			}>,
			Schema.Struct<{
				readonly [K in keyof Columns]: Schema.Schema<
					GetUpdateType<Columns[K]>,
					GetUpdateEncoded<Columns[K]>,
					Schema.Schema.Context<Columns[K]>
				>;
			}>
		> {}
/**
 * Create a Table descriptor from a columns definition.
 *
 * @template Columns - The shape of the table's columns; constrained to Schema.Struct.Fields so the
 *                      compiler can infer column metadata and derived record shapes.
 *
 * @param columns - An object describing each column. For columns that expose column-type metadata
 *                  (detected via isColumnTypes), their select/insert/update shapes are derived from
 *                  that metadata; otherwise the raw column value is used for each shape.
 *
 * @returns A Table object (typed as Table<Columns>) that is based on Schema.Struct(columns) and
 *          augmented with:
 *            - a unique ColumnTypesId symbol for runtime identification,
 *            - a `select` record whose fields are the selectable/readable shapes of each column,
 *            - an `insert` record whose fields are the shapes expected when inserting rows,
 *            - an `update` record whose fields are the shapes expected when updating rows.
 *
 * @remarks
 * This helper centralizes the mapping of column definitions into three commonly used shapes
 * (select/insert/update) while preserving the original Schema.Struct(columns) contract. Columns
 * that do not carry dedicated column-type metadata are treated as-is for all three shapes.
 */
export const Table = <Columns extends Schema.Struct.Fields>(columns: Columns): Table<Columns> => {
	const select: any = Schema.Struct(Record.map(columns, (v) => (isColumnTypes(v) ? v.select : v)));
	const insert: any = Schema.Struct(Record.map(columns, (v) => (isColumnTypes(v) ? v.insert : v)));
	const update: any = Schema.Struct(Record.map(columns, (v) => (isColumnTypes(v) ? v.update : v)));

	return Object.assign(Schema.Struct(columns), {
		[ColumnTypesId]: ColumnTypesId,
		select,
		insert,
		update,
	} as const);
};

/**
 * Defines a database schema as a structure of tables.
 *
 * This function takes an object mapping table names to their respective table schemas
 * and returns a schema representing the entire database structure.
 *
 * @param tables - An object where each key is a table name and each value is a `Table` schema.
 * @returns A `Struct` schema representing the database schema with all its tables.
 *
 * @example
 * ```ts
 * const Users = Table({
 *   id: Generated(Schema.Int),
 *   name: Schema.String,
 *   email: Schema.String,
 * });
 *
 * const Posts = Table({
 *   id: Generated(Schema.Int),
 *   title: Schema.String,
 *   content: Schema.String,
 *   authorId: Schema.Int,
 * });
 *
 * const DatabaseSchema = defineSchema({
 *   users: Users,
 *   posts: Posts,
 * });
 * ```
 */
export const defineSchema = <Tables extends Record<string, Table<any>>>(tables: Tables) =>
	Schema.Struct(tables);

/**
 * Transformer schema that maps between numeric (1/0) and boolean values.
 *
 * Decodes a numeric value to a boolean: returns `true` only when the input is strictly `1`,
 * and `false` for any other numeric value.
 * Encodes a boolean to a number: `true` -> `1`, `false` -> `0`.
 *
 * Useful for interacting with storage layers or protocols that represent booleans as integers.
 *
 * @example
 * // decode
 * BooleanFromNumber.decode(1); // true
 * BooleanFromNumber.decode(0); // false
 *
 * // encode
 * BooleanFromNumber.encode(true); // 1
 * BooleanFromNumber.encode(false); // 0
 *
 * @remarks
 * The decode function performs a strict equality check against `1`. Values such as `2`, `-1`,
 * `null`, or `undefined` will decode to `false`.
 *
 * @constant
 * @public
 */
export const BooleanFromNumber = Schema.transform(Schema.Number, Schema.Boolean, {
	decode: (n) => n === 1,
	encode: (b) => (b ? 1 : 0),
});
