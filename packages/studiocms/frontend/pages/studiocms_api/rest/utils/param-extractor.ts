import type { APIContext } from 'astro';
import { Effect, Either, ParseResult, Schema } from 'effect';
import type { ParseOptions } from 'effect/SchemaAST';

/**
 * Type definition for the parameter extraction function.
 */
export type ExtractEndpointParams = <T, E>(
	schema: Schema.Schema<T, E, never>,
	overrideOptions?: ParseOptions
) => <EE>(
	callback: (params: T, ctx: APIContext) => Effect.Effect<Response, EE, never>
) => (ctx: APIContext) => Effect.Effect<Response, EE, never>;

/**
 * Creates a higher-order function that extracts and validates route parameters from an API context.
 *
 * This utility function takes a schema and optional parse options, returning a function that accepts
 * a callback. The returned function validates the API context parameters against the provided schema
 * and passes the decoded parameters to the callback.
 *
 * @template A - The type of the successfully decoded schema output
 * @template E - The type of the schema encoding/input
 *
 * @param schema - An Effect Schema used to validate and decode the context parameters
 * @param overrideOptions - Optional parse options to customize the schema decoding behavior
 *
 * @returns A function that takes a callback accepting validated parameters and returns another
 * function that processes an APIContext, returning an Effect with a Response
 *
 * @example
 * ```typescript
 * const paramsSchema = Schema.Struct({
 *   id: Schema.String,
 *   page: Schema.Number
 * });
 *
 * const handler = extractParams(paramsSchema)((params) =>
 *   Effect.succeed(new Response(JSON.stringify(params)))
 * );
 * ```
 */
export const extractParams: ExtractEndpointParams = <T, E>(
	schema: Schema.Schema<T, E, never>,
	overrideOptions?: ParseOptions
) => {
	// Return a function that takes a callback with the validated parameters
	return <EE>(callback: (params: T, ctx: APIContext) => Effect.Effect<Response, EE, never>) => {
		// Return a function that processes the APIContext
		return (ctx: APIContext): Effect.Effect<Response, EE, never> => {
			// get user override options or default to empty object
			const userSchemaOpts = overrideOptions ?? {};

			// merge user options with default error handling options
			const schemaOpts: ParseOptions = {
				errors: 'all',
				...userSchemaOpts,
			};

			// decode and validate the context parameters using the provided schema and options
			const data = Schema.decodeUnknownEither(schema, schemaOpts)(ctx.params);

			// If decoding fails, format and return the errors in a Response
			if (Either.isLeft(data)) {
				const parsedErrors = ParseResult.TreeFormatter.formatErrorSync(data.left);
				return Effect.succeed(
					new Response(`API Parameters Decoding Error: ${parsedErrors}`, { status: 400 })
				);
			}

			// If decoding is successful, invoke the callback with the validated parameters
			return callback(data.right, ctx);
		};
	};
};

// const testSchema = Schema.Struct({
// 	id: Schema.String,
// 	optionalParam: Schema.NullishOr(Schema.Number),
// }).annotations({ title: 'Test' });

// const testEndpoint = extractParams(testSchema)(({ id, optionalParam }) => {
// 	// Here you can handle the Effect and return a Response
// 	return Effect.succeed(
// 		new Response(`Parameters extracted ${JSON.stringify({ id, optionalParam })}`)
// 	);
// });
