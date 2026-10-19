import { ParseResult, Schema } from 'effect';

/**
 * Represents the input configuration for the WP Importer application within StudioCMS.
 */
export const WPImporterInputSchema = Schema.Union(
	Schema.Boolean,
	Schema.Struct({
		endpoint: Schema.String,
	})
).annotations({
	title: 'WP Importer Input Configuration',
	identifier: 'WPImporterInputConfig',
	description:
		'The input configuration for the StudioCMS WP API Importer App. Can be a boolean to enable/disable or an object to specify the endpoint.',
});

/**
 * Represents the configuration for the WP Importer application within StudioCMS.
 */
export const WPImporterOutputSchema = Schema.Struct({
	enabled: Schema.Boolean,
	endpoint: Schema.String,
}).annotations({
	title: 'WP Importer Output Configuration',
	identifier: 'WPImporterOutputConfig',
	description:
		'The output configuration for the StudioCMS WP API Importer App, including enabled status and endpoint.',
});

/**
 * Default configuration for the WP Importer application within StudioCMS.
 */
const wpImporterDefaults = {
	enabled: true,
	endpoint: 'wp-api-importer',
};

/**
 * A schema for validating the configuration of the WP Importer application within StudioCMS.
 */
export const WPImporterSchema = Schema.transformOrFail(
	WPImporterInputSchema,
	WPImporterOutputSchema,
	{
		strict: true,
		decode: (input, _options, ast) => {
			if (typeof input !== 'boolean' && typeof input !== 'object') {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						input,
						'Expected boolean or object for WP Importer configuration'
					)
				);
			}
			if (typeof input === 'boolean') {
				return ParseResult.succeed({
					...wpImporterDefaults,
					enabled: input,
				});
			}
			if (typeof input === 'object' && typeof input.endpoint === 'string') {
				return ParseResult.succeed({
					...wpImporterDefaults,
					endpoint: input.endpoint,
				});
			}
			return ParseResult.fail(
				new ParseResult.Type(ast, input, 'Invalid type for WP Importer configuration')
			);
		},
		encode: (input) => {
			if (input.enabled === false) {
				return ParseResult.succeed(false);
			}
			if (input.endpoint !== wpImporterDefaults.endpoint) {
				return ParseResult.succeed({
					endpoint: input.endpoint,
				});
			}
			return ParseResult.succeed(true);
		},
	}
).annotations({
	title: 'WP Importer Configuration',
	identifier: 'WPImporterConfig',
	description:
		'Configuration for the StudioCMS WP API Importer App. Can be a boolean to enable/disable or a string to specify the endpoint.',
});

/**
 * Represents the configuration for the WP Importer application within StudioCMS.
 */
export const AppsConfigSchema = Schema.Struct({
	wpImporter: Schema.optionalWith(WPImporterSchema, {
		default: () => wpImporterDefaults,
	}).annotations({
		description:
			'Configuration for the StudioCMS WP API Importer App. Can be a boolean to enable/disable or a string to specify the endpoint.',
	}),
}).annotations({
	title: 'StudioCMS Apps Configuration',
	identifier: 'StudioCMSAppsConfig',
	description: 'Configuration for the StudioCMS development applications.',
});

/**
 * Represents the configuration for StudioCMS development applications.
 */
export const StudioCMSDevAppsSchema = Schema.Struct({
	endpoint: Schema.optionalWith(Schema.String, {
		default: () => '_studiocms-devapps',
	}).annotations({
		description: 'The endpoint for the StudioCMS development applications.',
	}),
	verbose: Schema.optionalWith(Schema.Boolean, {
		default: () => false,
	}).annotations({
		description: 'Enable verbose logging for StudioCMS development applications.',
	}),
	appsConfig: Schema.optionalWith(AppsConfigSchema, {
		default: () => AppsConfigSchema.make({}),
	}).annotations({
		description: 'Configuration for the StudioCMS development applications.',
	}),
}).annotations({
	title: 'StudioCMS DevApps Configuration',
	identifier: 'StudioCMSDevAppsConfig',
	description:
		'Configuration schema for StudioCMS development applications, including endpoint settings and individual app configurations.',
});

/**
 * Represents the input configuration for StudioCMS development applications.
 */
export type StudioCMSDevAppsOptions = typeof StudioCMSDevAppsSchema.Encoded;

/**
 * Represents the fully parsed configuration for StudioCMS development applications.
 */
export type StudioCMSDevAppsConfig = typeof StudioCMSDevAppsSchema.Type;
