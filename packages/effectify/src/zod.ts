import { fold, tagged, type Z } from '@traversable/zod';
import * as Schema from 'effect/Schema';
import type * as AST from 'effect/SchemaAST';
import type { z } from 'zod';

/**
 * The `File` type in JavaScript. This schema checks if the input is an instance of the `File` class, which is commonly used to represent file objects in web applications. It is declared using `Schema.declare` to create a custom schema that can be used in the Effect schema system.
 */
export const FileFromSelf = Schema.declare(
	(input: unknown): input is File => input instanceof File,
	{
		// A unique identifier for the schema
		identifier: 'FileFromSelf',
		// Detailed description of the schema
		description: 'The `File` type in JavaScript',
	}
);

/**
 * A helper function to generate an error message for unsupported Zod schemas. It takes a Zod schema as input and returns a string indicating that the schema is unsupported, along with the type of the schema. This function is used in the `zodToEffect` function to throw an error when it encounters a Zod schema that cannot be mapped to an Effect schema.
 *
 * @param schema - The Zod schema that is unsupported. It can be either a hole of any Zod schema or a hole of a string. The function accesses the `_zod.def.type` property to determine the type of the schema and include it in the error message.
 * @returns A string error message indicating that the provided Zod schema is unsupported, along with the type of the schema.
 */
const makeError = (schema: Z.Hole<Schema.Schema.Any> | Z.Hole<string>) =>
	`Unsupported schema: ${schema._zod.def.type}`;

/**
 * A type representing the parameters of a template literal in Zod schemas. It can be either any Zod schema without context or a literal value from the Zod AST. This type is used in the `zodToEffect` function to handle the conversion of Zod template literal schemas to Effect template literal schemas. The `TemplateLiteralParameter` type allows for flexibility in representing the parts of a template literal, which can include both static string literals and dynamic schema-based values.
 */
export type TemplateLiteralParameter = Schema.Schema.AnyNoContext | AST.LiteralValue;

/*
TODO: Rework the following type conversion for zod to Effect...

Currently the `zodToEffect` function is implemented using a fold over the Zod schema, which results in a type that is not properly inferred and appears as a union of all possible schema types. This is due to the way the fold function works and how TypeScript infers types in this context. The resulting type of the Effect schema is not what Effect's type system expects, and it will cause LSP errors for end users. This is needs to be fixed.

Example of the type mangling issue:

Zod schema input:

const zodSchema = z.union([
	z.object({
		abc: z.tuple([
			z.string(),
			z.object({
				def: z.optional(z.int()),
				ghi: z.array(z.number()),
			}),
		]),
	}),
	z.intersection(
		z.object({
			jkl: z.record(z.string(), z.array(z.number())),
		}),
		z.object({
			mno: z.map(z.set(z.date()), z.nullable(z.union([z.literal([1, 2, 3]), z.bigint()]))),
		})
	),
]);

The Resulting Effect schema type:

const effectSchema: Schema<{
    abc: [string, {
        ghi: number[];
        def?: number | undefined;
    }];
} | ({
    jkl: Record<string, number[]>;
} & {
    mno: Map<Set<Date>, bigint | 3 | 2 | 1 | null>;
}), {
    abc: [string, {
        ghi: number[];
        def?: number | undefined;
    }];
} | ({
    jkl: Record<string, number[]>;
} & {
    mno: Map<Set<Date>, bigint | 3 | 2 | 1 | null>;
}), never> = zodToEffect(zodSchema);

But the actual output type of `effectSchema` is:

const effectSchema: Schema.Union(
    Schema.Struct({ 
        abc: Schema.Tuple(
            Schema.String, 
            Schema.Struct({ 
                def: Schema.optional(Schema.Int), 
                ghi: Schema.Array(Schema.Number) 
            })
        ) 
    }),
    Schema.Struct({ 
        jkl: Schema.Record({ 
            key: Schema.String, 
            value: Schema.Array(Schema.Number) 
        }) 
    }).pipe(
        Schema.extend(
            Schema.Struct({ 
                mno: Schema.Map({ 
                    key: Schema.Set(Schema.Date), 
                    value: Schema.Union(
                        Schema.Union(Schema.Literal(1, 2, 3), Schema.BigInt), 
                        Schema.Null
                    ) 
                }) 
            })
        )
    )
) = zodToEffect(zodSchema);

*/

/**
 * A function that converts a Zod schema to an Effect schema. It takes a Zod schema as input and returns the corresponding Effect schema. The function uses pattern matching to identify the type of the Zod schema and maps it to the appropriate Effect schema. If the Zod schema is not supported, it throws an error using the `makeError` function. This function allows developers to easily convert their existing Zod schemas into Effect schemas, enabling them to leverage the features and benefits of the Effect library while maintaining compatibility with their existing validation logic.
 *
 * @param schema - The Zod schema to be converted. It can be any Zod schema, and the function will attempt to match it against known Zod schema types to perform the conversion. If the schema type is not recognized or supported, an error will be thrown.
 * @returns The corresponding Effect schema that matches the structure and validation logic of the input Zod schema. The returned schema can be used in the Effect library for validation and type inference.
 */
export function zodToEffect<T>(schema: z.core.$ZodType<T>): Schema.Schema<T>;

export function zodToEffect(schema: z.core.$ZodType) {
	return fold<Schema.Schema.Any>((x) => {
		switch (true) {
			// the usual suspects:
			case tagged('never')(x):
				return Schema.Never as never;
			case tagged('any')(x):
				return Schema.Any;
			case tagged('unknown')(x):
				return Schema.Unknown;
			case tagged('void')(x):
				return Schema.Void;
			case tagged('undefined')(x):
				return Schema.Undefined;
			case tagged('null')(x):
				return Schema.Null;
			case tagged('symbol')(x):
				return Schema.SymbolFromSelf;
			case tagged('boolean')(x):
				return Schema.Boolean;
			case tagged('nan')(x):
				return Schema.Literal(Number.NaN);
			case tagged('int')(x):
				return Schema.Int;
			case tagged('bigint')(x):
				return Schema.BigInt;
			case tagged('number')(x):
				return Schema.Number;
			case tagged('string')(x):
				return Schema.String;
			case tagged('date')(x):
				return Schema.Date;
			case tagged('literal')(x):
				return Schema.Literal(...(x._zod.def.values as string[]));
			case tagged('enum')(x):
				return Schema.Enums(Object.fromEntries(x._zod.def.entries as never));
			case tagged('array')(x):
				return Schema.Array(x._zod.def.element);
			case tagged('optional')(x):
				return Schema.optional(x._zod.def.innerType) as never;
			case tagged('nonoptional')(x):
				return x._zod.def.innerType;
			case tagged('readonly')(x):
				return x._zod.def.innerType;
			case tagged('set')(x):
				return Schema.Set(x._zod.def.valueType);
			case tagged('map')(x):
				return Schema.Map({
					key: x._zod.def.keyType,
					value: x._zod.def.valueType,
				});
			case tagged('nullable')(x):
				return Schema.Union(x._zod.def.innerType, Schema.Null);
			case tagged('object')(x):
				return Schema.Struct(x._zod.def.shape);
			case tagged('tuple')(x):
				return Schema.Tuple(...x._zod.def.items);
			case tagged('union')(x):
				return Schema.Union(...x._zod.def.options);
			case tagged('intersection')(x):
				return x._zod.def.left.pipe(Schema.extend(x._zod.def.right));
			case tagged('record')(x):
				return Schema.Record({
					key: x._zod.def.keyType,
					value: x._zod.def.valueType,
				});
			case tagged('template_literal')(x):
				return Schema.TemplateLiteral(
					...(x._zod.def.parts as unknown as readonly [
						TemplateLiteralParameter,
						...TemplateLiteralParameter[],
					])
				);
			case tagged('file')(x):
				return FileFromSelf;
			// not sure how these schemas map to Effect:
			case tagged('lazy')(x):
			case tagged('prefault')(x):
			case tagged('default')(x):
			case tagged('catch')(x):
			case tagged('custom')(x):
			case tagged('success')(x):
			case tagged('pipe')(x):
			case tagged('promise')(x):
			case tagged('transform')(x): {
				throw Error(makeError(x));
			}
			default:
				return x satisfies never;
		}
	})(schema);
}

/**
 * A writeable version of the `zodToEffect` function that returns a string representation of the Effect schema instead of the actual schema object. This function is useful for debugging and visualization purposes, allowing developers to see the structure of the generated Effect schema as a string. The implementation is similar to the original `zodToEffect` function, but instead of returning the Effect schema objects, it constructs a string representation based on the type of the Zod schema. If the Zod schema is not supported, it throws an error using the `makeError` function.
 *
 * @param schema - The Zod schema to be converted. It can be any Zod schema, and the function will attempt to match it against known Zod schema types to perform the conversion. If the schema type is not recognized or supported, an error will be thrown.
 * @returns The string representation of the corresponding Effect schema that matches the structure and validation logic of the input Zod schema. The returned string can be used for debugging and visualization purposes.
 */
zodToEffect.writeable = <T extends z.core.$ZodType>(schema: T): string =>
	fold<string>((x, _, _input) => {
		switch (true) {
			// the usual suspects:
			case tagged('never')(x):
				return 'Schema.Never';
			case tagged('any')(x):
				return 'Schema.Any';
			case tagged('unknown')(x):
				return 'Schema.Unknown';
			case tagged('void')(x):
				return 'Schema.Void';
			case tagged('undefined')(x):
				return 'Schema.Undefined';
			case tagged('null')(x):
				return 'Schema.Null';
			case tagged('symbol')(x):
				return 'Schema.SymbolFromSelf';
			case tagged('boolean')(x):
				return 'Schema.Boolean';
			case tagged('nan')(x):
				return 'Schema.Literal(NaN)';
			case tagged('int')(x):
				return 'Schema.Int';
			case tagged('bigint')(x):
				return 'Schema.BigInt';
			case tagged('number')(x):
				return 'Schema.Number';
			case tagged('string')(x):
				return 'Schema.String';
			case tagged('date')(x):
				return 'Schema.Date';
			case tagged('literal')(x):
				return `Schema.Literal(${x._zod.def.values
					.map((x) => (typeof x === 'string' ? `"${x}"` : `${x}`))
					.join(', ')})`;
			case tagged('enum')(x):
				return `Schema.Enums({ ${Object.entries(x._zod.def.entries)
					.map(([k, v]) => `${k}: ${v}`)
					.join(', ')} })`;
			case tagged('array')(x):
				return `Schema.Array(${x._zod.def.element})`;
			case tagged('optional')(x):
				return `Schema.optional(${x._zod.def.innerType})`;
			case tagged('nonoptional')(x):
				return x._zod.def.innerType;
			case tagged('readonly')(x):
				return x._zod.def.innerType;
			case tagged('set')(x):
				return `Schema.Set(${x._zod.def.valueType})`;
			case tagged('map')(x):
				return `Schema.Map({ key: ${x._zod.def.keyType}, value: ${x._zod.def.valueType} })`;
			case tagged('nullable')(x):
				return `Schema.Union(${x._zod.def.innerType}, Schema.Null)`;
			case tagged('tuple')(x):
				return `Schema.Tuple(${x._zod.def.items.join(', ')})`;
			case tagged('union')(x):
				return `Schema.Union(${x._zod.def.options.join(', ')})`;
			case tagged('intersection')(x):
				return `${x._zod.def.left}.pipe(Schema.extend(${x._zod.def.right}))`;
			case tagged('record')(x):
				return `Schema.Record({ key: ${x._zod.def.keyType}, value: ${x._zod.def.valueType} })`;
			case tagged('object')(x):
				return `Schema.Struct({ ${Object.entries(x._zod.def.shape)
					.map(([k, v]) => `${k}: ${v}`)
					.join(', ')} })`;
			case tagged('template_literal')(x):
				return `Schema.TemplateLiteral(${x._zod.def.parts
					.map((x) => (typeof x === 'string' ? `"${x}"` : `${x}`))
					.join(', ')})`;
			case tagged('file')(x):
				return 'Schema.declare<File, File, readonly [], never>';
			// not sure how these schemas map to Effect:
			case tagged('lazy')(x):
			case tagged('prefault')(x):
			case tagged('default')(x):
			case tagged('catch')(x):
			case tagged('custom')(x):
			case tagged('success')(x):
			case tagged('pipe')(x):
			case tagged('promise')(x):
			case tagged('transform')(x): {
				throw Error(makeError(x));
			}
			default:
				return x satisfies never;
		}
	})(schema);
