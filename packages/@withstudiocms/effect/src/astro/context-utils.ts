import type { APIContext } from 'astro';
import { Effect, Schema } from '../effect.js';

/**
 * Reads and parses the JSON body from an API request within the given context.
 *
 * @template A - The expected type of the parsed JSON object.
 * @param context - An object containing the API request.
 * @returns An `Effect` that resolves with the parsed JSON object of type `A`, or fails with an `Error` if parsing fails.
 */
export const readAPIContextJson = <A>({ request }: APIContext): Effect.Effect<A, Error, never> =>
	Effect.tryPromise({
		try: () => request.json(),
		catch: () => new Error('Failed to parse JSON from Request'),
	});

/**
 * Reads and parses the JSON body from an API request within the given `APIContext`.
 * Optionally validates and decodes the parsed JSON using a provided `Schema`.
 *
 * @typeParam A - The expected type of the decoded JSON object.
 * @typeParam E - The error type that may be returned by the schema decoder.
 * @typeParam R - The environment type required by the schema decoder.
 * @param context - The API context containing the request to read from.
 * @param schema - Optional schema to validate and decode the parsed JSON.
 * @returns An `Effect` that yields the decoded JSON object of type `A`, or throws an error if parsing or decoding fails.
 */
export const parseAPIContextJson = <A, E, R>(
	context: APIContext,
	schema?: Schema.Schema<A, E, R>
): Effect.Effect<A, Error, R> =>
	Effect.gen(function* () {
		const json = yield* readAPIContextJson<A>(context);
		if (schema) return yield* Schema.decodeUnknown(schema)(json);
		return json as A;
	}).pipe(
		Effect.catchAll((error) => {
			console.error('Failed to read JSON:', error);
			return Effect.fail(new Error('Failed to read JSON'));
		})
	);

/**
 * Reads and parses form data from the API context's request object.
 *
 * Wraps the asynchronous `request.formData()` call in an `Effect.tryPromise`,
 * providing error handling if parsing fails.
 *
 * @param context - The API context containing the request object.
 * @returns An `Effect` that resolves to the parsed form data, or an error if parsing fails.
 */
export const readAPIContextFormData = ({
	request,
}: APIContext): Effect.Effect<FormData, Error, never> =>
	Effect.tryPromise({
		try: () => request.formData(),
		catch: () => new Error('Failed to parse formData from Request'),
	});

/**
 * Parses form data from an `APIContext` into an object, optionally validating and decoding it using a provided schema.
 *
 * @template A - The type of the parsed object.
 * @template E - The error type for schema decoding.
 * @template R - The environment type required by the effect.
 * @param context - The API context containing the form data to parse.
 * @param schema - Optional schema to validate and decode the form data.
 * @returns An `Effect` that yields the parsed object of type `A`, or fails with an `Error` if parsing or decoding fails.
 */
export const parseAPIContextFormDataToObject = <A, E, R>(
	context: APIContext,
	schema?: Schema.Schema<A, E, R>
): Effect.Effect<A, Error, R> =>
	Effect.gen(function* () {
		const formData = yield* readAPIContextFormData(context);
		const entries = Object.fromEntries(formData.entries());

		if (schema) return yield* Schema.decodeUnknown(schema)(entries);

		return entries as A;
	}).pipe(
		Effect.catchAll((error) => {
			console.error('Failed to read form data:', error);
			return Effect.fail(new Error('Failed to read form data'));
		})
	);

/**
 * Attempts to retrieve a string value from a FormData entry by key.
 * Returns an Effect that resolves to the string value if present and of type string,
 * or `null` if the entry is not a string.
 *
 * @param formData - The FormData object to extract the value from.
 * @param key - The key of the entry to retrieve.
 * @returns An Effect that resolves to the string value or `null`.
 */
export const parseFormDataEntryToString = (
	formData: FormData,
	key: string
): Effect.Effect<string | null, Error, never> =>
	Effect.try({
		try: () => {
			const value = formData.get(key);
			if (typeof value !== 'string') {
				return null;
			}
			return value;
		},
		catch: () => new Error(`Failed to parse FormData entry for key: ${key}`),
	});
