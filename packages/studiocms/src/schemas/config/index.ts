import * as Schema from 'effect/Schema';
import { RobotsTXTConfigSchema } from '../../integrations/robots/schema.js';
import { BooleanDefaultFalse, BooleanDefaultTrue, OptionalWithDefaults } from '../custom.js';
import { DateTimeFormatOptions, I18nKeySchema } from '../external-schemas.js';
import { StudioCMSPluginSchema, StudioCMSStorageManagerSchema } from '../plugins/index.js';
import { ApiConfigSchema } from './api.js';
import { AuthConfigSchema } from './auth.js';
import { DashboardConfigSchema } from './dashboard.js';
import { DbConfigSchema } from './db.js';
import { DeveloperConfigSchema } from './developer.js';
import { SDKConfigSchema } from './sdk.js';

/**
 * Schema for Locale I18n Configuration, which includes settings for the default locale used in the dashboard translations.
 */
export const LocaleI18nConfigSchema = Schema.Struct({
	defaultLocale: OptionalWithDefaults(I18nKeySchema, 'en').annotations({
		description: 'Default Locale - Set the default locale for the dashboard translations',
	}),
}).annotations({
	title: 'Locale I18n Configuration',
	description:
		'Locale I18n Configuration - Configure the internationalization settings for the dashboard',
	identifier: 'LocaleI18nConfig',
});

/**
 * Schema for the locale configuration, which includes settings for date locale, date time format, and internationalization configuration for the dashboard.
 */
export const LocaleConfigSchema = Schema.Struct({
	dateLocale: OptionalWithDefaults(Schema.String, 'en-us').annotations({
		description: 'Date Locale - Set the locale for date formatting in the dashboard',
	}),
	dateTimeFormat: OptionalWithDefaults(DateTimeFormatOptions, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).annotations({
		description: 'Date Time Format - Set the date and time formatting options for the dashboard',
	}),
	i18n: OptionalWithDefaults(LocaleI18nConfigSchema, {}).annotations({
		description:
			'I18n Configuration - Configure the internationalization settings for the dashboard',
	}),
});

/**
 * Type for the locale configuration.
 */
export type LocaleConfig = typeof LocaleConfigSchema.Encoded;

/**
 * Resolved type for the locale configuration.
 */
export type LocaleConfigResolved = typeof LocaleConfigSchema.Type;

/**
 * Schema for defining the options for the RobotsTXT integration within StudioCMS, which includes user agents, allowed and disallowed paths, crawl delay, and clean parameters for the robots.txt configuration.
 */
export const StudioCMSRobotsTXTConfigSchema = Schema.Union(Schema.Boolean, RobotsTXTConfigSchema);

/**
 * Schema for the features configuration, which includes various feature flags and settings for the dashboard, such as enabling/disabling the dashboard, authentication, SDK settings, and more.
 */
export const FeaturesConfigSchema = Schema.Struct({
	robotsTXT: OptionalWithDefaults(StudioCMSRobotsTXTConfigSchema, true).annotations({
		description:
			'Robots TXT Configuration - Configure the robots.txt settings for the dashboard, allowing for customization of the robots.txt file served by the dashboard to control how search engines and web crawlers interact with the dashboard.',
	}),
	injectQuickActionsMenu: BooleanDefaultTrue.annotations({
		description:
			'Inject Quick Actions Menu - Allows injecting a quick actions menu in the dashboard for easy access to common actions',
	}),
	sdk: OptionalWithDefaults(SDKConfigSchema, true).annotations({
		description:
			'SDK Configuration with Default - Allows configuring the SDK with cache settings, defaults to enabled with a 5 minute lifetime',
	}),
	dashboardConfig: OptionalWithDefaults(DashboardConfigSchema, {}).annotations({
		description:
			'Dashboard Configuration - Configure settings related to the dashboard, such as enabling/disabling the dashboard, customizing the favicon, and configuring security settings.',
	}),
	authConfig: OptionalWithDefaults(AuthConfigSchema, {}).annotations({
		description:
			'Authentication Configuration - Configure settings related to authentication, such as enabling/disabling authentication and configuring authentication providers.',
	}),
	developerConfig: OptionalWithDefaults(DeveloperConfigSchema, {}).annotations({
		description:
			'Developer Configuration - Configure settings related to development features, such as enabling/disabling demo mode.',
	}),
	preferredImageService: Schema.optional(Schema.String).annotations({
		description:
			'Preferred Image Service - Set the preferred image service for handling image processing tasks, such as resizing and optimization. This can be set to a specific image service provider or left undefined to use the default image service.',
	}),
	webVitals: BooleanDefaultFalse.annotations({
		description:
			'Web Vitals - Enable or disable the collection of web vitals metrics for performance monitoring and optimization.',
	}),
	api: OptionalWithDefaults(ApiConfigSchema, {}).annotations({
		description:
			'API Configuration - Configure the API settings for the dashboard, such as enabling/disabling the API documentation.',
	}),
}).annotations({
	title: 'Features Configuration',
	description:
		'Features Configuration - Configure various features for the dashboard, such as enabling/disabling the dashboard, authentication, SDK settings, and more.',
	identifier: 'FeaturesConfig',
});

/**
 * Type for the features configuration.
 */
export type FeaturesConfig = typeof FeaturesConfigSchema.Encoded;

/**
 * Resolved type for the features configuration, where all optional fields have been resolved to their default values if not provided.
 */
export type FeaturesConfigResolved = typeof FeaturesConfigSchema.Type;

/**
 * Schema for the processed SDK configuration, which is the resulting configuration after processing the input SDK configuration, including cache settings with defaults applied.
 */
export const StudioCMSOptionsSchema = Schema.Struct({
	dbStartPage: BooleanDefaultTrue.annotations({
		description: 'DB Start Page - Whether to start into setup mode',
	}),
	verbose: BooleanDefaultFalse.annotations({
		description: 'Verbose Logging - Whether to enable verbose logging for debugging purposes',
	}),
	logLevel: Schema.optionalWith(
		Schema.Literal('All', 'Fatal', 'Error', 'Warning', 'Info', 'Debug', 'Trace', 'None'),
		{
			default: () => 'Info',
		}
	).annotations({
		description: 'Log Level - Set the LogLevel for Effect based code',
	}),
	db: OptionalWithDefaults(DbConfigSchema, {}).annotations({
		description: 'Database Configuration - Configure the database settings for StudioCMS',
	}),
	plugins: Schema.optional(Schema.mutable(Schema.Array(StudioCMSPluginSchema))).annotations({
		description: 'Plugins - Add plugins to the StudioCMS to extend its functionality',
	}),
	storageManager: Schema.optional(StudioCMSStorageManagerSchema).annotations({
		description:
			'Storage Manager - Configure the storage manager for handling file uploads and storage',
	}),
	componentRegistry: Schema.optional(
		Schema.Record({
			key: Schema.String,
			value: Schema.String,
		})
	).annotations({
		description:
			'Component Registry - A record of custom components that can be used in the dashboard, where the key is the component name and the value is the path to the component',
	}),
	locale: OptionalWithDefaults(LocaleConfigSchema, {}).annotations({
		description: 'Locale Configuration - Configure locale specific settings for the dashboard',
	}),
	features: OptionalWithDefaults(FeaturesConfigSchema, {}).annotations({
		description:
			'Features Configuration - Configure various features for the dashboard, such as enabling/disabling the dashboard, authentication, SDK settings, and more.',
	}),
}).annotations({
	title: 'StudioCMS Configuration',
	description:
		'Main configuration schema for StudioCMS, including database settings, plugins, storage manager, locale settings, and feature flags.',
	identifier: 'StudioCMSConfig',
});

/**
 * Type for the main StudioCMS configuration.
 */
export type StudioCMSOptions = typeof StudioCMSOptionsSchema.Encoded;

/**
 * Resolved type for the main StudioCMS configuration, where all optional fields have been resolved to their default values if not provided.
 */
export type StudioCMSConfig = typeof StudioCMSOptionsSchema.Type;
