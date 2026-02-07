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
 * Parses a provided configuration object against a Zod schema, merges it with the schema's defaults, and returns the validated, merged result.
 *
 * @template T - A Zod schema type (extends z.ZodTypeAny).
 * @param schema - The Zod schema used to obtain default values and to validate incoming config. Defaults are extracted by parsing an empty object.
 * @param configFile - Optional raw config input to validate and merge with defaults. If omitted or `undefined`, the schema's defaults are returned directly.
 * @returns The merged configuration object of type T['_output'].
 * @throws Error - Throws an Error with a message prefixed "Invalid Config Options: " when parsing/validation fails. Unknown/parsing errors are wrapped with a generic message.
 * @remarks
 * - Internally, defaults are removed from a cloned schema (via deepRemoveDefaults) so that user-supplied values are validated without schema default injection.
 * - The function first obtains the default options by parsing an empty object against the original schema, then validates the provided config (if any) against the zero-defaults schema, and finally deep-merges the parsed config into the defaults (deepmerge). User-provided values override defaults; missing values are filled from defaults.
 * - The returned value conforms to the schema's output type (T['_output']).
 * @example
 * // const merged = parseAndMerge(myZodSchema, { port: 3000 });
 */
export function parseAndMerge<T extends z.ZodTypeAny>(
	schema: T,
	configFile?: T['_input']
): T['_output'] {
	try {
		const ZeroDefaultsSchema = deepRemoveDefaults(schema);
		const defaultOpts = schema.parse({});

		// If configFile is undefined, return the default options directly
		if (configFile === undefined) {
			return defaultOpts;
		}

		const parsedConfigFile = ZeroDefaultsSchema.parse(configFile);
		return deepmerge(defaultOpts, parsedConfigFile);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Invalid Config Options: ${error.message}`);
		}
		throw new Error(
			'Invalid Config Options: An unknown error occurred while parsing the Config options.'
		);
	}
}
