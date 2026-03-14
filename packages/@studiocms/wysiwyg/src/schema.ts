import { Schema } from 'studiocms/effect';

/**
 * Schema definition for an array containing elements of any type.
 *
 * This schema allows for arrays that can contain any type of elements,
 */
export const AnyArray = Schema.mutable(Schema.Array(Schema.Unknown));

/**
 * Schema definition for a mutable string.
 *
 * This schema allows for strings that can be modified after creation.
 */
export const MString = Schema.mutable(Schema.String);

/**
 * Creates a mutable schema for a struct with the specified fields.
 *
 * @template F - The fields of the struct.
 * @returns A mutable schema for the struct with the given fields.
 */
export const MStruct = <F extends Schema.Struct.Fields>(fields: F) =>
	Schema.mutable(Schema.Struct(fields));

/**
 * Creates a mutable array schema for elements of type `V`.
 * @template V - The type of elements in the array.
 * @returns A mutable schema for an array containing elements of type `V`.
 */
export const MArray = <V extends Schema.Schema.Any>(val: V) => Schema.mutable(Schema.Array(val));

/**
 * Creates a mutable record schema with specified key and value types.
 *
 * @template K - The type of the keys in the record.
 * @template V - The type of the values in the record.
 * @param opts - An object containing the key and value types.
 * @returns A mutable schema for a record with specified key and value types.
 */
export const MRecord = <K extends Schema.Schema.All, V extends Schema.Schema.All>(opts: {
	readonly key: K;
	readonly value: V;
}) => Schema.mutable(Schema.Record(opts));

/**
 * Creates a mutable array schema for a struct with specified fields.
 *
 * @template F - The fields of the struct.
 * @returns A mutable schema for an array containing structs with the specified fields.
 */
export const MArrayStruct = <F extends Schema.Struct.Fields>(fields: F) => MArray(MStruct(fields));

/**
 * Schema definition for StudioCMS project data.
 *
 * This schema describes the structure of the project data used in StudioCMS,
 * including optional HTML content, data sources, assets, styles, symbols, and pages.
 *
 */
export const studioCMSProjectDataSchema = Schema.Struct({
	dataSources: AnyArray,
	assets: AnyArray,
	styles: AnyArray,
	symbols: AnyArray,
	pages: AnyArray,
	__STUDIOCMS_HTML: Schema.optional(MString),
});
