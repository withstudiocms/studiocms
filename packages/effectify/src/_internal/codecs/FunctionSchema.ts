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
 *
 * @internal
 */
export function createFunctionSchemaDecoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: false
): (
	input: unknown,
	_options: ParseOptions,
	ast: Declaration
) => Effect.Effect<(args: A) => AA, ParseResult.ParseIssue, never>;
export function createFunctionSchemaDecoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: true
): (
	input: unknown,
	_options: ParseOptions,
	ast: Declaration
) => Effect.Effect<(args: A) => Promise<AA>, ParseResult.ParseIssue, never>;
export function createFunctionSchemaDecoder<A, I, AA, II>(
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

		// We have to cast here because we don't know if it's a sync or async function yet. The wrapped function will handle the correct typing based on the 'promise' flag.
		const fn = input as (args: I) => typeof promise extends true ? Promise<II> : II;

		// We will create a wrapped function that validates the inputs and outputs based on the provided schemas. The wrapped function will be either async or sync based on the 'promise' flag.
		let wrappedFn: ((args: A) => Promise<AA>) | ((args: A) => AA);

		// If the function is asynchronous, we need to wrap it in an async function that awaits the result and validates it. If it's synchronous, we can just wrap it in a regular function.
		if (promise) {
			// For async functions, we need to validate the input arguments and the return value asynchronously. We will decode the input arguments using the argsSchema, call the original function with the decoded arguments, and then decode the return value using the returnSchema.
			wrappedFn = async (args: A): Promise<AA> => {
				// Encode args from A (Type) to I (Encoded) for the raw function
				const encodedArgs = Schema.encodeSync(argsSchema)(args);

				// Call the original function with encoded args
				const result = await fn(encodedArgs);

				// Decode result from II (Encoded) to AA (Type)
				return Schema.decodeSync(returnSchema)(result);
			};
		} else {
			// For sync functions, we can do the same thing but without the async/await. We will decode the input arguments, call the original function, and then decode the return value.
			wrappedFn = (args: A): AA => {
				// Encode args from A (Type) to I (Encoded) for the raw function
				const encodedArgs = Schema.encodeSync(argsSchema)(args);

				// Call the original function with encoded args
				const result = fn(encodedArgs);

				// Decode result from II (Encoded) to AA (Type)
				return Schema.decodeSync(returnSchema)(result);
			};
		}

		// Return the wrapped function as the successful result of the decoder. We need to cast it to the correct type based on the 'promise' flag.
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
 *
 * @internal
 */
export function createFunctionSchemaEncoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: false
): (
	input: unknown,
	_options: ParseOptions,
	ast: Declaration
) => Effect.Effect<(args: I) => II, ParseResult.ParseIssue, never>;
export function createFunctionSchemaEncoder<A, I, AA, II>(
	argsSchema: Schema.Schema<A, I, never>,
	returnSchema: Schema.Schema<AA, II, never>,
	promise: true
): (
	input: unknown,
	_options: ParseOptions,
	ast: Declaration
) => Effect.Effect<(args: I) => Promise<II>, ParseResult.ParseIssue, never>;
export function createFunctionSchemaEncoder<A, I, AA, II>(
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

		// We have to cast here because we don't know if it's a sync or async function yet. The wrapped function will handle the correct typing based on the 'promise' flag.
		const fn = input as (args: A) => typeof promise extends true ? Promise<AA> : AA;

		// We will create a wrapped function that encodes the inputs and outputs based on the provided schemas. The wrapped function will be either async or sync based on the 'promise' flag.
		let wrappedFn: ((args: I) => Promise<II>) | ((args: I) => II);

		// If the function is asynchronous, we need to wrap it in an async function that awaits the result and encodes it. If it's synchronous, we can just wrap it in a regular function.
		if (promise) {
			// For async functions, we need to validate the input arguments and the return value asynchronously. We will decode the input arguments using the argsSchema, call the original function with the decoded arguments, and then decode the return value using the returnSchema.
			wrappedFn = async (args: I): Promise<II> => {
				// Decode args from I (Encoded) to A (Type) for the typed function
				const decodedArgs = Schema.decodeSync(argsSchema)(args);

				// Call the original function with decoded/typed args
				const result = await fn(decodedArgs);

				// Encode result from AA (Type) to II (Encoded)
				return Schema.encodeSync(returnSchema)(result);
			};
		} else {
			// For sync functions, we can do the same thing but without the async/await. We will decode the input arguments, call the original function, and then encode the return value.
			wrappedFn = (args: I): II => {
				// Decode args from I (Encoded) to A (Type) for the typed function
				const decodedArgs = Schema.decodeSync(argsSchema)(args);

				// Call the original function with decoded/typed args
				const result = fn(decodedArgs);

				// Encode result from AA (Type) to II (Encoded)
				return Schema.encodeSync(returnSchema)(result);
			};
		}

		// Return the wrapped function as the successful result of the encoder. We need to cast it to the correct type based on the 'promise' flag.
		return ParseResult.succeed(wrappedFn) as Effect.Effect<
			(args: I) => typeof promise extends true ? Promise<II> : II,
			ParseResult.ParseIssue,
			never
		>;
	};
}
