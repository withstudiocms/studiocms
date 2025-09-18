/* v8 ignore start */
// Requires remote connection... with Effect
import { Effect, HTTPClient, Platform, Schema } from '../../../effect.js';

/**
 * Represents the version information retrieved from NPM.
 *
 * @extends Schema.Class<NpmVersion>
 * @property version - The version string of the NPM package.
 */
export class NpmVersion extends Schema.Class<NpmVersion>('NpmVersion')({
	version: Schema.String,
}) {}

/**
 * An Effect service for retrieving the version of an NPM package from the NPM registry.
 *
 * @remarks
 * This service uses an HTTP client with retry logic to fetch the version information
 * for a given package and version (defaulting to 'latest') from the NPM registry.
 *
 * @example
 * ```typescript
 * const version = await GetVersionFromNPM.get('react');
 * ```
 *
 * @service
 * - Depends on `FetchHttpClient.layer` for HTTP requests.
 *
 * @method get
 * @param pkg - The name of the NPM package.
 * @param ver - The version tag or number (defaults to 'latest').
 * @returns An Effect that resolves to the version string of the specified package.
 */
export class GetVersionFromNPM extends Effect.Service<GetVersionFromNPM>()(
	'studiocms/sdk/effect/GetVersionFromNPM',
	{
		effect: Effect.gen(function* () {
			const client = yield* HTTPClient;

			/**
			 * Retrieves the version of an NPM package.
			 *
			 * @param pkg - The name of the NPM package.
			 * @param ver - The version tag or number (defaults to 'latest').
			 * @returns An Effect that resolves to the version string of the specified package.
			 */
			const get = (pkg: string, ver = 'latest') =>
				Effect.gen(function* () {
					const response = yield* client
						.get(`https://registry.npmjs.org/${pkg}/${ver}`)
						.pipe(Effect.flatMap(Platform.HttpClientResponse.schemaBodyJson(NpmVersion)));
					return response.version;
				});

			return { get };
		}),
		dependencies: [HTTPClient.Default],
	}
) {}
/* v8 ignore stop */
