import { type Effect, ParseResult, Schema } from 'effect';
import type { Declaration, ParseOptions } from 'effect/SchemaAST';

/**
 * Creates the decoder for the FunctionSchema. This function validates that the input is a function and then wraps it to validate both its arguments and return value based on the provided schemas.
 *
 * @param argsSchema - Schema for function arguments
 * @param returnSchema - Schema for function return value
 * @param promise - Whether the function is asynchronous (returns a Promise)
 *
 * @returns A decoder function that can be used in the FunctionSchema declaration
 */
function createFunctionSchemaDecoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: false
): (
	input: unknown,
	_options: ParseOptions,
	ast: Declaration
) => Effect.Effect<(args: A) => AA, ParseResult.ParseIssue, never>;
function createFunctionSchemaDecoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: true
): (
	input: unknown,
	_options: ParseOptions,
	ast: Declaration
) => Effect.Effect<(args: A) => Promise<AA>, ParseResult.ParseIssue, never>;
function createFunctionSchemaDecoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: boolean
) {
	return (
		input: unknown,
		_options: ParseOptions,
		ast: Declaration
	): Effect.Effect<
		(args: A) => typeof promise extends true ? Promise<AA> : AA,
		ParseResult.ParseIssue,
		never
	> => {
		// Validate that input is a function
		if (typeof input !== 'function') {
			return ParseResult.fail(new ParseResult.Type(ast, input, 'Expected a function'));
		}

		const fn = input as (args: I) => typeof promise extends true ? Promise<II> : II;

		let wrappedFn: ((args: A) => Promise<AA>) | ((args: A) => AA);

		if (promise) {
			wrappedFn = async (args: A): Promise<AA> => {
				// Encode args from A (Type) to I (Encoded) for the raw function
				const encodedArgs = Schema.encodeSync(argsSchema)(args);

				// Call the original function with encoded args
				const result = await fn(encodedArgs);

				// Decode result from II (Encoded) to AA (Type)
				return Schema.decodeSync(returnSchema)(result);
			};
		} else {
			wrappedFn = (args: A): AA => {
				// Encode args from A (Type) to I (Encoded) for the raw function
				const encodedArgs = Schema.encodeSync(argsSchema)(args);

				// Call the original function with encoded args
				const result = fn(encodedArgs);

				// Decode result from II (Encoded) to AA (Type)
				return Schema.decodeSync(returnSchema)(result);
			};
		}

		return ParseResult.succeed(wrappedFn) as Effect.Effect<
			(args: A) => typeof promise extends true ? Promise<AA> : AA,
			ParseResult.ParseIssue,
			never
		>;
	};
}

/**
 * Creates the encoder for the FunctionSchema. This function validates that the input is a function and then wraps it to encode both its arguments and return value based on the provided schemas.
 *
 * @param argsSchema - Schema for function arguments
 * @param returnSchema - Schema for function return value
 * @param promise - Whether the function is asynchronous (returns a Promise)
 *
 * @returns An encoder function that can be used in the FunctionSchema declaration
 */
function createFunctionSchemaEncoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: false
): (
	input: unknown,
	_options: ParseOptions,
	ast: Declaration
) => Effect.Effect<(args: I) => II, ParseResult.ParseIssue, never>;
function createFunctionSchemaEncoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: true
): (
	input: unknown,
	_options: ParseOptions,
	ast: Declaration
) => Effect.Effect<(args: I) => Promise<II>, ParseResult.ParseIssue, never>;
function createFunctionSchemaEncoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: boolean
) {
	return (
		input: unknown,
		_options: ParseOptions,
		ast: Declaration
	): Effect.Effect<
		(args: I) => typeof promise extends true ? Promise<II> : II,
		ParseResult.ParseIssue,
		never
	> => {
		// Validate that input is a function
		if (typeof input !== 'function') {
			return ParseResult.fail(new ParseResult.Type(ast, input, 'Expected a function'));
		}

		const fn = input as (args: A) => typeof promise extends true ? Promise<AA> : AA;

		let wrappedFn: ((args: I) => Promise<II>) | ((args: I) => II);

		if (promise) {
			wrappedFn = async (args: I): Promise<II> => {
				// Decode args from I (Encoded) to A (Type) for the typed function
				const decodedArgs = Schema.decodeSync(argsSchema)(args);

				// Call the original function with decoded/typed args
				const result = await fn(decodedArgs);

				// Encode result from AA (Type) to II (Encoded)
				return Schema.encodeSync(returnSchema)(result);
			};
		} else {
			wrappedFn = (args: I): II => {
				// Decode args from I (Encoded) to A (Type) for the typed function
				const decodedArgs = Schema.decodeSync(argsSchema)(args);

				// Call the original function with decoded/typed args
				const result = fn(decodedArgs);

				// Encode result from AA (Type) to II (Encoded)
				return Schema.encodeSync(returnSchema)(result);
			};
		}

		return ParseResult.succeed(wrappedFn) as Effect.Effect<
			(args: I) => typeof promise extends true ? Promise<II> : II,
			ParseResult.ParseIssue,
			never
		>;
	};
}

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
			decode: (argsSchema, returnSchema) =>
				createFunctionSchemaDecoder(argsSchema, returnSchema, true),
			encode: (argsSchema, returnSchema) =>
				createFunctionSchemaEncoder(argsSchema, returnSchema, true),
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
			pretty: () => (value) => `[async Function: ${value.name || 'anonymous'}]`,
		}
	);

/**
 * Similar to FunctionSchema but for synchronous functions.
 *
 * @param argsSchema - Schema for function arguments
 * @param returnSchema - Schema for function return value
 *
 * @example
 * const loginFn = SyncFunctionSchema(
 *   Schema.Struct({ username: Schema.String, password: Schema.String }),
 *   Schema.Boolean
 * );
 *
 * const validatedLogin = Schema.decodeSync(loginFn)(
 *   (data) => data.username === 'admin' && data.password === '123'
 * );
 */
export const SyncFunctionSchema = <A, I, AA, II, R = never, RR = never>(
	argsSchema: Schema.Schema<A, I, R>,
	returnSchema: Schema.Schema<AA, II, RR>
): Schema.Schema<(args: A) => AA, (args: I) => II, R | RR> =>
	Schema.declare(
		[argsSchema, returnSchema],
		{
			decode: (argsSchema, returnSchema) =>
				createFunctionSchemaDecoder(argsSchema, returnSchema, false),
			encode: (argsSchema, returnSchema) =>
				createFunctionSchemaEncoder(argsSchema, returnSchema, false),
		},
		{
			name: 'SyncFunctionSchema',
			identifier: 'function',
			title: 'SyncFunctionSchema',
			description:
				'Schema for validating synchronous functions with specific argument and return types',
			jsonSchema: {
				type: 'function',
				title: 'SyncFunctionSchema',
				description:
					'Schema for validating synchronous functions with specific argument and return types',
				// Note: JSON Schema does not have a standard way to represent function schemas, so this is just a placeholder
			},
			documentation:
				'Creates a schema for synchronous functions with validated inputs and outputs.',
			arbitrary: () => (fc) =>
				fc.func(fc.object()).map((fn) => (args: A) => {
					// This is a very basic arbitrary implementation that just returns a string result
					return fn(args) as AA;
				}),
			pretty: () => (value) => `[Function: ${value.name || 'anonymous'}]`,
		}
	);
