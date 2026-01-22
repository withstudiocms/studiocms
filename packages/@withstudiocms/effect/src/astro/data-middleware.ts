import type { APIContext, AstroGlobal, MiddlewareNext } from 'astro';
import { Data, Effect, pipe, Schema } from 'effect';
import type { EffectMiddlewareHandler } from './types.js';

/**
 * Represents an error that occurs within middleware processing.
 *
 * This error is tagged as 'MiddlewareError' and includes a message and an optional cause.
 */
export class MiddlewareError extends Data.TaggedError('MiddlewareError')<{
	message: string;
	cause?: unknown;
}> {}

/**
 * Sets a key-value pair in the response headers of the given Astro global context.
 *
 * @param ctx - The Astro global context containing the response object.
 * @param data - An object with `key` and `value` properties to be set in the response headers.
 */
export const setDataContext = (
	{ response }: Pick<AstroGlobal, 'response'>,
	{ key, value }: { key: string; value: string }
) => {
	response.headers.set(key, value);
};

/**
 * Defines a data middleware that validates and parses request headers using the provided schema.
 *
 * The middleware extracts headers from the incoming request, decodes them according to the
 * specified schema, and passes the validated data to the provided handler function.
 * If validation fails, a `MiddlewareError` is thrown.
 *
 * @param schema - The schema used to validate and parse the request headers (headers are converted to an object).
 * @param fn - The middleware handler function that receives the validated data.
 * @returns A middleware function that processes the request headers and invokes the handler.
 */
export const defineDataMiddleware = <A, I>(
	/**
	 * The schema used to validate and parse the request headers.
	 * Headers are converted to an object before validation.
	 */
	schema: Schema.Schema<A, I, never>,

	/**
	 * The middleware handler function that receives the validated data.
	 *
	 * @param context - The API context object containing request and environment information.
	 * @param data - The validated header data conforming to the provided schema.
	 * @param next - The next middleware function in the chain.
	 * @returns An Effect that resolves to either a Response or a Promise of Response.
	 *
	 * Note: Function should return an 200 Response on success or throw MiddlewareError on failure.
	 */
	fn: (
		context: APIContext,
		data: A,
		next: MiddlewareNext
	) => Effect.Effect<Response, MiddlewareError, never>
): EffectMiddlewareHandler =>
	/**
	 * The middleware function that processes the request headers and invokes the handler.
	 *
	 * @param context - The API context object containing request and environment information.
	 * @param next - The next middleware function in the chain.
	 * @returns A Promise that resolves to a Response.
	 */
	Effect.fn(function* (context: APIContext, next: MiddlewareNext) {
		// Invoke the next middleware to get the initial response
		const response = yield* Effect.tryPromise({
			try: () => next(),
			catch: (error) => new MiddlewareError({ message: 'Next middleware failed', cause: error }),
		});

		// Decode and validate the response headers, then invoke the handler function
		// with the validated data, returning the final response
		// If validation fails, a MiddlewareError is thrown
		// The final response is either the original response (if status is 200) or the one returned by the handler
		return yield* pipe(
			response.headers.entries(),
			Object.fromEntries,
			Schema.decodeUnknown(schema),
			Effect.flatMap((data) => fn(context, data, next)),
			Effect.map((res) => (res.status === 200 ? response : res)),
			Effect.mapError(
				(errors) =>
					new MiddlewareError({
						message: 'Header validation failed',
						cause: errors,
					})
			)
		);
	});
