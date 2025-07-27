import { z } from 'astro/zod';
import type { RobotsConfig } from '../../lib/robots/types.js';
import type { StudioCMSPlugin } from '../plugins/index.js';
import { authConfigSchema } from './auth.js';
import { dashboardConfigSchema } from './dashboard.js';
import { developerConfigSchema } from './developer.js';
import { SDKSchema } from './sdk.js';

//
// Exported Schemas for use in other internal packages
//
export { dashboardConfigSchema };

export const StudioCMSOptionsSchema = z
	.object({
		/**
		 * Project Initialization Page - Used during First Time Setup to initialize the database
		 *
		 * @default true
		 */
		dbStartPage: z.boolean().optional().default(true),

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
		 * Component Registry
		 */
		componentRegistry: z.record(z.string()).optional(),

		/**
		 * Locale specific settings
		 */
		locale: z
			.object({
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
			})
			.optional()
			.default({}),

		/**
		 * Allows adjusting the StudioCMS Dashboard features
		 */
		features: z
			.object({
				/**
				 * Allows the user to enable/disable the use of the StudioCMS Custom `astro-robots-txt` Integration
				 *
				 * @default robotsTXT: { policy: [ { userAgent: ['*'], allow: ['/'], disallow: ['/dashboard/'] } ] }
				 */
				robotsTXT: z.union([z.custom<RobotsConfig>(), z.boolean()]).optional().default(true),

				/**
				 * Enable Quick Actions Menu - Whether to enable the quick actions menu which allows easy access to your dashboard while logged in on non-dashboard pages.
				 * @default true
				 */
				injectQuickActionsMenu: z.boolean().optional().default(true),

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
				 * Allows customization of the Dashboard Configuration
				 */
				dashboardConfig: dashboardConfigSchema,

				/**
				 * Auth Configuration - Allows customization of the Authentication Configuration
				 */
				authConfig: authConfigSchema,

				/**
				 * Developer Options/Configuration
				 */
				developerConfig: developerConfigSchema,

				/**
				 * Set the identifier of the Preferred Image Service
				 *
				 * Requires an Image Service to be installed such as 'cloudinary-js'
				 */
				preferredImageService: z.string().optional(),
			})
			.optional()
			.default({}),
	})
	.optional()
	.default({});

export type StudioCMSOptions = typeof StudioCMSOptionsSchema._input;
export type StudioCMSConfig = typeof StudioCMSOptionsSchema._output;
