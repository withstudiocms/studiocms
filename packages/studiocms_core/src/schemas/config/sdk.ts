import { z } from 'astro/zod';
import { defaultCacheLifeTime } from '../../consts';

const TimeUnitSchema = z.union([z.literal('m'), z.literal('h')]);

type TimeUnit = z.infer<typeof TimeUnitSchema>;

const TimeStringSchema = z
	.string()
	.regex(/^\d+(m|h)$/, {
		message: "Invalid time string format. Must be a number followed by 'm' or 'h'.",
	})
	.transform<number>((value) => {
		// Define time multipliers
		const timeUnits: Record<TimeUnit, number> = {
			m: 60 * 1000, // Minutes to milliseconds
			h: 60 * 60 * 1000, // Hours to milliseconds
		};

		// Extract the numeric value and unit from the input string
		const match = value.match(/^(\d+)([mh])$/);

		if (!match) {
			throw new Error("Invalid time format. Use values like '5m', '1h', etc.");
		}

		const val = Number.parseInt(match[1] as string, 10);
		const unit = match[2] as TimeUnit;

		return val * timeUnits[unit];
	});

export type TimeString = typeof TimeStringSchema._input;

/**
 * Schema for cache configuration.
 */
const CacheConfigSchema = z.object({
	/**
	 * Cache Lifetime
	 *
	 * `{number}{unit}` - e.g. '5m' for 5 minutes or '1h' for 1 hour
	 * @default '5m'
	 */
	lifetime: TimeStringSchema.optional().default(defaultCacheLifeTime),
});

/**
 * Schema for processed cache configuration.
 *
 * Extends the base CacheConfigSchema with additional properties.
 *
 * Properties:
 * - `enabled` (boolean): Indicates if the cache is enabled.
 *   - @default true
 */
const ProcessedCacheConfigSchema = z.object({
	/**
	 * Cache Enabled
	 *
	 * @default true
	 */
	enabled: z.boolean().default(true),
	/**
	 * Cache Lifetime
	 *
	 * `{number}{unit}` - e.g. '5m' for 5 minutes or '1h' for 1 hour
	 * @default '5m'
	 */
	lifetime: TimeStringSchema.default(defaultCacheLifeTime),
});

/**
 * Represents the configuration for the cache.
 *
 * This type is inferred from the `CacheConfigSchema` using Zod's `infer` method.
 * It ensures that the cache configuration adheres to the schema defined in `CacheConfigSchema`.
 */
export type CacheConfig = z.infer<typeof CacheConfigSchema>;

/**
 * Represents the processed cache configuration inferred from the ProcessedCacheConfigSchema.
 *
 * This type is used to define the structure of the cache configuration after it has been
 * processed and validated by the schema.
 */
export type ProcessedCacheConfig = z.infer<typeof ProcessedCacheConfigSchema>;

/**
 * Schema for SDK cache configuration.
 *
 * This schema allows for either a boolean value or a more detailed cache configuration object.
 *
 * - If a boolean value is provided:
 *   - `true`: Enables caching with a default lifetime.
 *   - `false`: Disables caching.
 * - If a cache configuration object is provided, it must conform to `CacheConfigSchema`.
 *
 * The schema is optional and defaults to `true` (enabled with default lifetime).
 *
 * The transformation ensures that the resulting configuration is of type `ProcessedCacheConfig`:
 * - If a boolean value is provided, it is transformed into an object with `enabled` and `lifetime` properties.
 * - If a cache configuration object is provided, it is transformed to ensure `enabled` is always `true`.
 */
const SDKCacheSchema = z
	.union([z.boolean(), CacheConfigSchema])
	.optional()
	.default(true)
	.transform<ProcessedCacheConfig>((cacheConfig) => {
		if (typeof cacheConfig === 'boolean') {
			return {
				enabled: cacheConfig,
				lifetime: TimeStringSchema.parse(defaultCacheLifeTime),
			};
		}
		return { enabled: true, lifetime: cacheConfig.lifetime };
	});

/**
 * Schema for processing SDK configuration.
 */
const ProcessedSDKSchema = z.object({
	/**
	 * Cache Configuration
	 *
	 * @default cacheConfig: { lifetime: '5m' }
	 */
	cacheConfig: ProcessedCacheConfigSchema,
});

/**
 * Type definition for the processed SDK configuration.
 *
 * This type is inferred from the `ProcessedSDKSchema` using Zod's `infer` method.
 * It represents the structure of the SDK configuration after it has been processed.
 */
export type ProcessedSDKConfig = z.infer<typeof ProcessedSDKSchema>;

/**
 * SDKSchema is a Zod schema that validates the SDK configuration.
 * It can either be a boolean or an object containing cache configuration.
 *
 * If it is a boolean, it defaults to `true` and transforms into an object
 * with default cache configuration.
 *
 * If it is an object, it must contain the `cacheConfig` property which is
 * validated by the `SDKCacheSchema`.
 */
export const SDKSchema = z
	.union([
		z.boolean(),
		z.object({
			/**
			 * Cache Configuration
			 *
			 * @default cacheConfig: { lifetime: '5m' }
			 */
			cacheConfig: SDKCacheSchema,
		}),
	])
	.optional()
	.default(true)
	.transform<ProcessedSDKConfig>((sdkConfig) => {
		if (typeof sdkConfig === 'boolean') {
			return {
				cacheConfig: {
					enabled: sdkConfig,
					lifetime: TimeStringSchema.parse(defaultCacheLifeTime),
				},
			};
		}
		return sdkConfig;
	});

export type StudioCMS_SDKOptions = typeof SDKSchema._input;
export type StudioCMS_SDKConfig = typeof SDKSchema._output;
