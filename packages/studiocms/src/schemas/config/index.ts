import { z } from 'astro/zod';
import { RobotsTXTConfigSchema } from '../../integrations/robots/schema.js';
import { availableTranslationsKeys } from '../../virtuals/i18n/v-files.js';
import type { StudioCMSPlugin } from '../plugins/index.js';
import { type AuthConfig, authConfigSchema } from './auth.js';
import { type DashboardConfig, dashboardConfigSchema } from './dashboard.js';
import { type DBConfigSchema, dbConfigSchema } from './db.js';
import { type DeveloperConfig, developerConfigSchema } from './developer.js';
import { SDKSchema, type StudioCMS_SDKOptions } from './sdk.js';

//
// Exported Schemas for use in other internal packages
//
export { dashboardConfigSchema };

interface LocaleConfig {
	/**
	 * Date Locale used for formatting dates
	 *
	 * @default 'en-us'
	 */
	dateLocale?: string;

	/**
	 * DateTime Format Options
	 *
	 * @default
	 * { year: 'numeric', month: 'short', day: 'numeric' }
	 */
	dateTimeFormat?: Intl.DateTimeFormatOptions;

	/**
	 * I18n Specific Settings
	 */
	i18n?: {
		/**
		 * Default Locale for the StudioCMS
		 *
		 * This option sets the default language for the StudioCMS application.
		 *
		 * It must be one of the available translation keys or 'en' for English.
		 *
		 * @remarks
		 * All translations are 2-letter language codes as per ISO 639-1 standard.
		 * Existing available translations can be found in the `/src/virtuals/i18n/translations/` directory. or on [Crowdin](https://crowdin.com/project/studiocms).
		 *
		 * @default 'en'
		 */
		defaultLocale?: string;
	};
}

export interface FeaturesConfig {
	/**
	 * Allows the user to enable/disable the use of the StudioCMS Custom `astro-robots-txt` Integration
	 *
	 * @default robotsTXT: { policy: [ { userAgent: ['*'], allow: ['/'], disallow: ['/dashboard/'] } ] }
	 */
	robotsTXT?: boolean | z.infer<typeof RobotsTXTConfigSchema>;

	/**
	 * Enable Quick Actions Menu - Whether to enable the quick actions menu which allows easy access to your dashboard while logged in on non-dashboard pages.
	 * @default true
	 */
	injectQuickActionsMenu?: boolean;

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
	sdk?: StudioCMS_SDKOptions;

	/**
	 * Allows customization of the Dashboard Configuration
	 */
	dashboardConfig?: DashboardConfig;

	/**
	 * Auth Configuration - Allows customization of the Authentication Configuration
	 */
	authConfig?: AuthConfig;

	/**
	 * Developer Options/Configuration
	 */
	developerConfig?: DeveloperConfig;

	/**
	 * Set the identifier of the Preferred Image Service
	 *
	 * Requires an Image Service to be installed such as 'cloudinary-js'
	 */
	preferredImageService?: string;
}

export interface StudioCMSOptions {
	/**
	 * Project Initialization Page - Used during First Time Setup to initialize the database
	 *
	 * @default true
	 */
	dbStartPage?: boolean;

	/**
	 * Whether to show verbose output
	 * @default false
	 */
	verbose?: boolean;

	/**
	 * Set the LogLevel for Effect based code
	 */
	logLevel?: 'All' | 'Fatal' | 'Error' | 'Warning' | 'Info' | 'Debug' | 'Trace' | 'None';

	/**
	 * Database Configuration
	 */
	db?: DBConfigSchema;

	/**
	 * Add Plugins to the StudioCMS
	 */
	plugins?: StudioCMSPlugin[];

	/**
	 * Component Registry
	 */
	componentRegistry?: Record<string, string>;

	/**
	 * Locale specific settings
	 */
	locale?: LocaleConfig;

	/**
	 * Allows adjusting the StudioCMS Dashboard features
	 */
	features?: FeaturesConfig;
}

export const StudioCMSOptionsSchema = z
	.object({
		dbStartPage: z.boolean().optional().default(true),
		verbose: z.boolean().optional().default(false),
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
		db: dbConfigSchema,
		plugins: z.custom<StudioCMSPlugin[]>().optional(),
		componentRegistry: z.record(z.string()).optional(),
		locale: z
			.object({
				dateLocale: z.string().optional().default('en-us'),
				dateTimeFormat: z.custom<Intl.DateTimeFormatOptions>().optional().default({
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				}),
				i18n: z
					.object({
						defaultLocale: z
							.string()
							.superRefine((val, ctx) => {
								if (!availableTranslationsKeys.includes(val)) {
									ctx.addIssue({
										code: z.ZodIssueCode.custom,
										message: `Locale '${val}' is not supported. Available locales are: ${availableTranslationsKeys.join(
											', '
										)}`,
									});
									return z.NEVER;
								}
							})
							.optional()
							.default('en'),
					})
					.optional()
					.default({}),
			})
			.optional()
			.default({}),
		features: z
			.object({
				robotsTXT: z.union([RobotsTXTConfigSchema, z.boolean()]).optional().default(true),
				injectQuickActionsMenu: z.boolean().optional().default(true),
				sdk: SDKSchema,
				dashboardConfig: dashboardConfigSchema,
				authConfig: authConfigSchema,
				developerConfig: developerConfigSchema,
				preferredImageService: z.string().optional(),
			})
			.optional()
			.default({}),
	})
	.optional()
	.default({});

export type StudioCMSConfig = typeof StudioCMSOptionsSchema._output;
