import { Duration } from 'effect';
import * as Schema from 'effect/Schema';
import { OptionalWithDefaults } from '../custom';

/**
 * Schema for the cache lifetime configuration, which is an optional duration that defaults to 5 minutes if not provided.
 */
export const LifeTimeSchema = Schema.optionalWith(Schema.DurationFromSelf, {
	default: () => Duration.minutes(5),
}).annotations({
	description: 'Cache Lifetime - The duration for which the cache is valid',
});

/**
 * Schema for the cache configuration, which can be either a boolean to enable/disable caching or an object to specify the cache lifetime.
 */
export const CacheConfigSchema = Schema.Union(
	Schema.Boolean,
	Schema.Struct({
		lifetime: LifeTimeSchema,
	})
).annotations({
	description: 'Cache Configuration - Allows enabling/disabling cache and setting cache lifetime',
});

/**
 * Default cache lifetime in milliseconds (5 minutes).
 */
export const InputSDKConfigSchema = Schema.Union(
	Schema.Boolean,
	Schema.Struct({
		cacheConfig: CacheConfigSchema,
	})
).annotations({
	description: 'SDK Configuration - Allows configuring the SDK with cache settings',
});

/**
 * Schema for the processed cache configuration, which has a boolean to indicate if caching is enabled and a number for the cache lifetime in milliseconds.
 */
export const OutputSDKConfigSchema = Schema.Struct({
	cacheConfig: Schema.Struct({
		lifetime: Schema.Number,
		enabled: Schema.Boolean,
	}).annotations({
		description:
			'Processed Cache Configuration - Contains the processed cache settings with lifetime in milliseconds and enabled status',
	}),
}).annotations({
	description:
		'Processed SDK Configuration - The resulting configuration after processing the input SDK configuration',
});

/**
 * Gets the default cache configuration based on whether caching is enabled or not.
 *
 * @param enabled - A boolean indicating whether caching is enabled or not.
 * @returns An object containing the cache configuration with lifetime in milliseconds and enabled status.
 */
export const getDefaultCacheConfig = (enabled: boolean) => ({
	cacheConfig: {
		lifetime: Duration.toMillis(Duration.minutes(5)),
		enabled,
	},
});

/**
 * Processes the input SDK configuration and returns the processed cache configuration.
 */
export const SDKConfigSchema = Schema.transform(InputSDKConfigSchema, OutputSDKConfigSchema, {
	strict: true,
	decode: (input) => {
		if (typeof input === 'boolean') {
			return getDefaultCacheConfig(input);
		}
		if (typeof input.cacheConfig === 'boolean') {
			return getDefaultCacheConfig(input.cacheConfig);
		}
		return {
			cacheConfig: {
				enabled: true,
				lifetime: input.cacheConfig?.lifetime
					? Duration.toMillis(input.cacheConfig.lifetime)
					: Duration.toMillis(Duration.minutes(5)),
			},
		};
	},
	encode: (output) => {
		return {
			cacheConfig: {
				lifetime: Duration.millis(output.cacheConfig.lifetime),
			},
		};
	},
}).annotations({
	title: 'SDK Configuration',
	description: 'Configuration options related to the SDK, including cache settings',
	identifier: 'SDKConfig',
});

/**
 * Schema for the SDK configuration with defaults, which allows configuring the SDK with cache settings and defaults to enabled with a 5 minute lifetime if not provided.
 */
export const SDKConfigSchemaWithDefaults = OptionalWithDefaults(SDKConfigSchema, true).annotations({
	description:
		'SDK Configuration with Default - Allows configuring the SDK with cache settings, defaults to enabled with a 5 minute lifetime',
});

/**
 * Type for the SDK configuration.
 */
export type SDKConfig = typeof SDKConfigSchema.Encoded;

/**
 * Resolved type for the SDK configuration.
 */
export type SDKConfigResolved = typeof SDKConfigSchema.Type;
