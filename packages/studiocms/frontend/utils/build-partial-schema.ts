import { Schema } from 'effect';

/**
 * Type guard to check if a schema is of type Schema.Struct with all fields of type Schema.All.
 *
 * @param schema - The schema to check
 * @returns True if the schema is of type Schema.All, false otherwise
 */
export const isSchemaAll = <T extends Schema.Struct.Fields>(
	schema: unknown
): schema is Schema.Struct<T> => {
	return schema instanceof Schema.Struct;
};

/**
 * Type helper to create a partial schema type with all fields optional.
 */
export type PartialSchema<T extends Schema.Struct.Fields> = {
	[K in keyof T]: T[K] extends Schema.Schema.All ? Schema.optional<T[K]> : never;
};

/**
 * Builds a partial schema from a given base schema, making all fields optional.
 *
 * @template Fields - The fields of the base schema
 * @param base - The base schema to build the partial schema from
 * @returns A new schema with all fields optional
 */
export const buildPartialSchema = <const Fields extends Schema.Struct.Fields>(
	base: Schema.Struct<Fields>
) => {
	// Construct a new schema with all fields optional except 'id'
	const partialFields = Object.entries(base.fields).reduce(
		(acc, [key, entry]) => {
			if (isSchemaAll(entry)) {
				const safeKey = key as keyof Fields;
				// biome-ignore lint/suspicious/noExplicitAny: cursed magic
				(acc as any)[safeKey] = Schema.optional(entry);
			}
			return acc;
		},
		{} as PartialSchema<Fields>
	);

	return Schema.Struct(partialFields) as Schema.Struct<PartialSchema<Fields>>;
};
