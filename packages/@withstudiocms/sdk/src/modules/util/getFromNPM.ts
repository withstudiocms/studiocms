import { Effect, HTTPClient, Platform, Schema } from '@withstudiocms/effect';
import { CacheService } from '../../cache.js';
import { cacheKeyGetters, cacheTags } from '../../consts.js';

/**
 * Represents the shape of an npm registry document for a specific package version.
 *
 * This class models the JSON structure returned by the npm registry for a published
 * package version. It includes metadata about the package (name, version, description,
 * license), publisher/maintainer information, repository and publish configuration,
 * and other auxiliary fields commonly present on the npm registry.
 *
 * @remarks
 * The shape mirrors common fields returned by the npm registry and is suitable for
 * validating or typing responses when fetching package metadata (for example via
 * the registry REST API). Optional fields reflect that not all packages supply every
 * piece of metadata.
 *
 * @public
 */
export class NpmRegistryResponseSchema extends Schema.Class<NpmRegistryResponseSchema>(
	'NpmRegistryResponseSchema'
)({
	_id: Schema.String,
	_integrity: Schema.String,
	_npmUser: Schema.Struct({
		name: Schema.String,
		email: Schema.String,
		trustedPublisher: Schema.Struct({
			id: Schema.String,
			oidcConfigId: Schema.String,
		}),
	}),
	maintainers: Schema.Array(
		Schema.Struct({
			name: Schema.String,
			email: Schema.String,
		})
	),
	name: Schema.String,
	version: Schema.String,
	description: Schema.String,
	license: Schema.String,
	author: Schema.optional(
		Schema.Struct({
			name: Schema.String,
			url: Schema.String,
		})
	),
	repository: Schema.optional(
		Schema.Struct({
			type: Schema.String,
			url: Schema.String,
			directory: Schema.optional(Schema.String),
		})
	),
	contributors: Schema.optional(
		Schema.Array(
			Schema.Struct({
				name: Schema.String,
				url: Schema.optional(Schema.String),
			})
		)
	),
	keywords: Schema.Array(Schema.String),
	homepage: Schema.optional(Schema.String),
	publishConfig: Schema.optional(
		Schema.Struct({
			access: Schema.String,
			provenance: Schema.Boolean,
		})
	),
	sideEffects: Schema.optional(Schema.Boolean),
}) {}

/**
 * Helper to process and validate the HTTP response from the NPM registry.
 */
const handleNpmRegistryResponse = Platform.HttpClientResponse.schemaBodyJson(
	NpmRegistryResponseSchema,
	{
		exact: false,
		onExcessProperty: 'preserve',
	}
);

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
 * @method get
 * @param pkg - The name of the NPM package.
 * @param ver - The version tag or number (defaults to 'latest').
 * @returns An Effect that resolves to the version string of the specified package.
 */
export const GetFromNPM = Effect.gen(function* () {
	const [{ get: getter }, { memoize }] = yield* Effect.all([HTTPClient, CacheService]);

	/**
	 * Retrieves the full data of an NPM package from the NPM registry.
	 *
	 * @param pkg - The name of the NPM package.
	 * @param ver - The version tag or number (defaults to 'latest').
	 * @returns An Effect that resolves to the NpmRegistryResponse of the specified package.
	 */
	const getDataFromNPM = Effect.fn((pkg: string, ver = 'latest') =>
		memoize(
			cacheKeyGetters.npmPackage(pkg, ver),
			getter(`https://registry.npmjs.org/${pkg}/${ver}`).pipe(
				Effect.flatMap(handleNpmRegistryResponse)
			),
			{
				tags: cacheTags.npmPackage,
			}
		)
	);

	/**
	 * Retrieves the version of an NPM package.
	 *
	 * @param pkg - The name of the NPM package.
	 * @param ver - The version tag or number (defaults to 'latest').
	 * @returns An Effect that resolves to the version string of the specified package.
	 */
	const getVersion = (pkg: string, ver = 'latest') =>
		getDataFromNPM(pkg, ver).pipe(Effect.map((data) => data.version));

	return { getVersion, getDataFromNPM };
}).pipe(Effect.provide(HTTPClient.Default));
