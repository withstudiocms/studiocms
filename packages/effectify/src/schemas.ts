import { Schema } from 'effect';
import {
	createFunctionSchemaDecoder,
	createFunctionSchemaEncoder,
} from './_internal/codecs/FunctionSchema';

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
			description:
				'Schema for validating asynchronous functions with specific argument and return types',
			jsonSchema: {
				type: 'function',
				title: 'FunctionSchema',
				description:
					'Schema for validating asynchronous functions with specific argument and return types',
				// Note: JSON Schema does not have a standard way to represent function schemas, so this is just a placeholder
			},
			documentation:
				'Creates a schema for asynchronous functions with validated inputs and outputs.',
			arbitrary: () => (fc) =>
				fc.func(fc.object()).map((fn) => async (args: A) => {
					// This is a very basic arbitrary implementation that just returns a string result
					return fn(args) as AA;
				}),
			pretty: () => (value) => `[AsyncFunction: ${value.name || 'anonymous'}]`,
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
