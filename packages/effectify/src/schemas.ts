import { Effect, ParseResult, Schema } from 'effect';

/**
 * Creates a schema for functions with validated inputs and outputs.
 * Similar to Zod's z.function().
 *
 * The schema validates:
 * - Input arguments when calling the function
 * - Return values from the function
 *
 * @param argsSchema - Schema for function arguments
 * @param returnSchema - Schema for function return value
 *
 * @example
 * const loginFn = FunctionSchema(
 *   Schema.Struct({ username: Schema.String, password: Schema.String }),
 *   Schema.Boolean
 * );
 *
 * const validatedLogin = Schema.decodeSync(loginFn)(
 *   async (data) => data.username === 'admin' && data.password === '123'
 * );
 */
export const FunctionSchema = <A, I, AA, II, R = never, RR = never>(
	argsSchema: Schema.Schema<A, I, R>,
	returnSchema: Schema.Schema<AA, II, RR>
): Schema.Schema<(args: A) => Promise<AA>, (args: I) => Promise<II>, R | RR> =>
	Schema.declare(
		[argsSchema, returnSchema],
		{
			decode: (argsSchemaParam, returnSchemaParam) => (input, _options, ast) => {
				// Validate that input is a function
				if (typeof input !== 'function') {
					return ParseResult.fail(new ParseResult.Type(ast, input, 'Expected a function'));
				}

				const fn = input as (args: I) => Promise<II>;

				// Return a wrapped function that validates inputs and outputs
				const wrappedFn = async (args: A): Promise<AA> => {
					// Encode args from A (Type) to I (Encoded) for the raw function
					const encodedArgs = await Effect.runPromise(Schema.encode(argsSchemaParam)(args));

					// Call the original function with encoded args
					const result = await fn(encodedArgs);

					// Decode result from II (Encoded) to AA (Type)
					return Effect.runPromise(Schema.decode(returnSchemaParam)(result));
				};

				return ParseResult.succeed(wrappedFn);
			},
			encode: (argsSchemaParam, returnSchemaParam) => (input, _options, ast) => {
				// Validate that input is a function
				if (typeof input !== 'function') {
					return ParseResult.fail(new ParseResult.Type(ast, input, 'Expected a function'));
				}

				const fn = input as (args: A) => Promise<AA>;

				// Return a wrapped function that encodes inputs and outputs
				const wrappedFn = async (args: I): Promise<II> => {
					// Decode args from I (Encoded) to A (Type) for the typed function
					const decodedArgs = await Effect.runPromise(Schema.decode(argsSchemaParam)(args));

					// Call the original function with decoded/typed args
					const result = await fn(decodedArgs);

					// Encode result from AA (Type) to II (Encoded)
					return Effect.runPromise(Schema.encode(returnSchemaParam)(result));
				};

				return ParseResult.succeed(wrappedFn);
			},
		},
		{
			name: 'FunctionSchema',
			identifier: 'function',
			title: 'FunctionSchema',
			description: 'Schema for validating functions with specific argument and return types',
			jsonSchema: {
				type: 'function',
				title: 'FunctionSchema',
				description: 'Schema for validating functions with specific argument and return types',
				// Note: JSON Schema does not have a standard way to represent function schemas, so this is just a placeholder
			},
			documentation: 'Creates a schema for functions with validated inputs and outputs.',
			arbitrary: () => (fc) =>
				fc.func(fc.object()).map((fn) => async (args: A) => {
					// This is a very basic arbitrary implementation that just returns a string result
					return fn(args) as AA;
				}),
			pretty: () => (value) => `[Function: ${value.name || 'anonymous'}]`,
		}
	);
