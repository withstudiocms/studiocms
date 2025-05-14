import { z } from 'astro/zod';
import type { Literal } from 'effect/LogLevel';
import type { StudioCMSPlugin } from '../plugins/index.js';
import { overridesSchema } from './componentoverrides.js';
import { dashboardConfigSchema } from './dashboard.js';
import { DefaultFrontEndConfigSchema, FrontEndConfigSchema } from './defaultFrontend.js';
import { imageServiceSchema } from './imageService.js';
import { includedIntegrationsSchema } from './integrations.js';
import { BuiltInPageTypeOptionsSchema } from './pageTypeOptions.js';
import { SDKSchema } from './sdk.js';

//
// Exported Schemas for use in other internal packages
//
export {
	dashboardConfigSchema,
	DefaultFrontEndConfigSchema,
	imageServiceSchema,
	overridesSchema,
	FrontEndConfigSchema,
};

//
// MAIN SCHEMA
//
export const StudioCMSOptionsSchema = z
	.object({
		/**
		 * Project Initialization Page - Used during First Time Setup to initialize the database
		 *
		 * @default true
		 */
		dbStartPage: z.boolean().optional().default(true),
		/**
		 * Allows customization of the Image Service Options
		 */
		imageService: imageServiceSchema,
		/**
		 * Default Frontend Configuration
		 *
		 * Allows customization of the default frontend configuration
		 *
		 * @default true
		 */
		defaultFrontEndConfig: DefaultFrontEndConfigSchema,
		/**
		 * Allows customization of the Dashboard Configuration
		 */
		dashboardConfig: dashboardConfigSchema,
		/**
		 * Allows enabling and disabling of the included integrations
		 */
		includedIntegrations: includedIntegrationsSchema,
		/**
		 * Date Locale used for formatting dates
		 */
		dateLocale: z.string().optional().default('en-us'),
		/**
		 * DateTime Format Options
		 */
		dateTimeFormat: z.custom<Intl.DateTimeFormatOptions>().optional().default({
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		}),
		/**
		 * Component Overrides - Allows for customizing the components used in StudioCMS
		 */
		overrides: overridesSchema,
		/**
		 * Whether to show verbose output
		 * @default false
		 */
		verbose: z.boolean().optional().default(false),
		/**
		 * Set the LogLevel for Effect based code
		 */
		logLevel: z
			.union([
				z.literal('All'),
				z.literal('Fatal'),
				z.literal('Error'),
				z.literal('Warning'),
				z.literal('Info'),
				z.literal('Debug'),
				z.literal('Trace'),
				z.literal('None'),
			])
			.optional()
			.default('Info'),
		/**
		 * Add Plugins to the StudioCMS
		 */
		plugins: z.custom<StudioCMSPlugin[]>().optional(),
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
		sdk: SDKSchema,

		/**
		 * Page Type Options
		 */
		pageTypeOptions: BuiltInPageTypeOptionsSchema,

		/**
		 * Component Registry
		 */
		componentRegistry: z.record(z.string()).optional(),
	})
	.optional()
	.default({});

export type StudioCMSOptions = typeof StudioCMSOptionsSchema._input;
export type StudioCMSConfig = typeof StudioCMSOptionsSchema._output;
