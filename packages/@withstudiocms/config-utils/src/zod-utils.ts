import { z } from 'astro/zod';
import { deepmerge } from 'deepmerge-ts';

/**
 * Parses and validates the provided configuration options using the given Zod schema.
 *
 * @template T - A Zod schema type extending `z.ZodTypeAny`.
 * @param schema - The Zod schema to validate the configuration options against.
 * @param opts - The configuration options to be validated.
 * @returns The validated and parsed configuration options as the schema's output type.
 * @throws {Error} If the configuration options are invalid or if an unknown error occurs during parsing.
 */
export function parseConfig<T extends z.ZodTypeAny>(schema: T, opts: unknown): T['_output'] {
	try {
		return schema.parse(opts);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Invalid Configuration Options: ${error.message}`);
		}
		throw new Error('An unknown error occurred while parsing the configuration options.');
	}
}

/**
 * Recursively removes all default values from a given Zod schema.
 *
 * - For `ZodDefault`, it unwraps the default value.
 * - For `ZodObject`, it processes each field and wraps them as optional without defaults.
 * - For `ZodArray`, `ZodOptional`, `ZodNullable`, and `ZodTuple`, it recursively processes their elements/items.
 * - For all other schema types, it returns the schema as-is.
 *
 * @param schema - The Zod schema to process.
 * @returns A new Zod schema with all defaults removed and fields made optional where applicable.
 */
export function deepRemoveDefaults(schema: z.ZodTypeAny): z.ZodTypeAny {
	if (schema instanceof z.ZodDefault) return deepRemoveDefaults(schema.removeDefault());

	if (schema instanceof z.ZodObject) {
		// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
		const newShape: any = {};

		for (const key in schema.shape) {
			const fieldSchema = schema.shape[key];
			newShape[key] = z.ZodOptional.create(deepRemoveDefaults(fieldSchema));
		}
		return new z.ZodObject({
			...schema._def,
			shape: () => newShape,
			// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
		}) as any;
	}

	if (schema instanceof z.ZodArray) return z.ZodArray.create(deepRemoveDefaults(schema.element));

	if (schema instanceof z.ZodOptional)
		return z.ZodOptional.create(deepRemoveDefaults(schema.unwrap()));

	if (schema instanceof z.ZodNullable)
		return z.ZodNullable.create(deepRemoveDefaults(schema.unwrap()));

	if (schema instanceof z.ZodTuple)
		// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
		return z.ZodTuple.create(schema.items.map((item: any) => deepRemoveDefaults(item)));

	return schema;
}

/**
 * Parses and merges configuration objects using a Zod schema.
 *
 * This function removes all default values from the provided schema,
 * parses the `configFile` object with the modified schema, and then
 * deeply merges the result with the `inlineConfig` object.
 *
 * If parsing fails, an error is thrown with a descriptive message.
 *
 * @typeParam T - A Zod schema type.
 * @param schema - The Zod schema to use for validation.
 * @param inlineConfig - The inline configuration object, expected to match the schema's output type.
 * @param configFile - The configuration object to parse, expected to match the schema's input type.
 * @returns The merged configuration object, conforming to the schema's output type.
 * @throws {Error} If parsing the configuration fails.
 */
export function parseAndMerge<T extends z.ZodTypeAny>(
	schema: T,
	inlineConfig?: T['_output'],
	configFile?: T['_input']
): T['_output'] {
	try {
		const ZeroDefaultsSchema = deepRemoveDefaults(schema);
		if (!configFile) {
			return inlineConfig ?? schema.parse({});
		}
		const parsedConfigFile = ZeroDefaultsSchema.parse(configFile);
		return deepmerge(inlineConfig ?? {}, parsedConfigFile);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Invalid Config Options: ${error.message}`);
		}
		throw new Error(
			'Invalid Config Options: An unknown error occurred while parsing the Config options.'
		);
	}
}
