export * as Cli from '@effect/cli';
export * as Platform from '@effect/platform';
export * as PlatformNode from '@effect/platform-node';
export * from 'effect';
export { dual } from 'effect/Function';

import { FetchHttpClient, HttpClient } from '@effect/platform';
import { Effect, Schedule } from 'effect';
import { dual } from 'effect/Function';

/**
 * Executes an `Effect` asynchronously and returns a promise of its result.
 *
 * @template A - The type of the successful result.
 * @template E - The type of the error.
 * @param effect - The effect to run.
 * @returns A promise that resolves with the result of the effect.
 */
export const runEffect = async <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> =>
	await Effect.runPromise<A, E>(effect);

/**
 * Appends a search parameter to a given URL.
 *
 * This function is curried and can be used in two ways:
 * - By providing the parameter name and value first, then the URL.
 * - By providing the URL, parameter name, and value together.
 *
 * @param url - The URL object to which the search parameter will be appended.
 * @param name - The name of the search parameter.
 * @param value - The value of the search parameter.
 * @returns The updated URL object with the new search parameter appended.
 */
export const appendSearchParamsToUrl = dual<
	(name: string, value: string) => (url: URL) => URL,
	(url: URL, name: string, value: string) => URL
>(3, (url, name, value) => {
	url.searchParams.append(name, value);
	return url;
});

/**
 * Represents an HTTP client service that wraps a base HTTP client with retry logic for transient errors.
 *
 * @remarks
 * This service is registered under the name 'HTTPClient' and depends on the `FetchHttpClient.layer`.
 * It uses the `Effect.gen` function to yield the base HTTP client and applies a retry strategy for transient errors,
 * retrying up to 3 times with a 3-second interval between attempts.
 *
 * @extends Effect.Service
 *
 * @example
 * ```typescript
 * const httpTest = Effect.gen(function* () {
 *  const client = yield* HTTPClient;
 *  const response = yield* client.get('https://example.com');
 *  return yield* response.text;
 * }).pipe(Effect.provide(HTTPClient.Default));
 * ```
 */
export class HTTPClient extends Effect.Service<HTTPClient>()('HTTPClient', {
	dependencies: [FetchHttpClient.layer],
	effect: Effect.gen(function* () {
		const baseHttpClient = (yield* HttpClient.HttpClient).pipe(
			HttpClient.retryTransient({
				times: 3,
				schedule: Schedule.spaced('3 second'),
			})
		);

		return baseHttpClient;
	}),
}) {}
