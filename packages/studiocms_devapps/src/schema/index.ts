import { z } from 'astro/zod';

/**
 * Schema for the configuration of StudioCMS development applications.
 *
 * This schema defines the configuration options for the following applications:
 *
 * - **Astro DB LibSQL Viewer App**: Controlled by the `libSQLViewer` property.
 * - **StudioCMS WP API Importer App**: Controlled by the `wpImporter` property.
 *
 * The schema provides default values and transformation logic to ensure the configuration
 * is in the expected format.
 *
 * @property libSQLViewer - Configuration for the Astro DB LibSQL Viewer App.
 * - `boolean` - Indicates whether the app is enabled. Defaults to `true`.
 *
 * @property wpImporter - Configuration for the StudioCMS WP API Importer App.
 * - `boolean` - Indicates whether the app is enabled.
 * - `object` - Contains additional configuration options:
 *   - `endpoint` - The API endpoint for the importer. Defaults to `'wp-api-importer'`.
 *
 * @returns An object with the transformed configuration:
 * - `libSQLViewer` - An object with an `enabled` property indicating the app's status.
 * - `wpImporter` - An object with `enabled` and `endpoint` properties for the app's configuration.
 */
export const AppsConfigSchema = z
	.object({
		/**
		 * Astro DB LibSQL Viewer App Config
		 */
		libSQLViewer: z.union([
			z.boolean(),
			z.object({
				endpoint: z.string().optional().default('outerbase'),
			}),
		]),
		/**
		 * StudioCMS WP API Importer App Config
		 */
		wpImporter: z.union([
			z.boolean(),
			z.object({
				endpoint: z.string().optional().default('wp-api-importer'),
			}),
		]),
	})
	.optional()
	.default({
		wpImporter: { endpoint: 'wp-api-importer' },
		libSQLViewer: { endpoint: 'outerbase' },
	})
	.transform((val) => {
		let libSQL: { enabled: boolean; endpoint: string };
		let wpAPI: { enabled: boolean; endpoint: string };

		if (typeof val.libSQLViewer === 'boolean') {
			libSQL = { enabled: val.libSQLViewer, endpoint: 'outerbase' };
		} else {
			libSQL = { enabled: true, endpoint: val.libSQLViewer.endpoint };
		}

		if (typeof val.wpImporter === 'boolean') {
			wpAPI = { enabled: val.wpImporter, endpoint: 'wp-api-importer' };
		} else {
			wpAPI = { enabled: true, endpoint: val.wpImporter.endpoint };
		}

		return {
			libSQLViewer: libSQL,
			wpImporter: wpAPI,
		};
	});

/**
 * Schema definition for StudioCMS development applications configuration.
 *
 * This schema defines the structure of the configuration object for StudioCMS
 * development applications. It includes the following properties:
 *
 * - `endpoint` (optional): A string representing the endpoint for the dev apps.
 *   Defaults to '_studiocms-devapps'.
 * - `verbose` (optional): A boolean indicating whether verbose logging is enabled.
 *   Defaults to `false`.
 * - `appsConfig`: The configuration schema for the applications.
 *
 * The entire schema is optional and defaults to an empty object if not provided.
 */
export const StudioCMSDevAppsSchema = z
	.object({
		endpoint: z.string().optional().default('_studiocms-devapps'),
		verbose: z.boolean().optional().default(false),
		appsConfig: AppsConfigSchema,
	})
	.optional()
	.default({});

/**
 * Represents the options for StudioCMS development applications.
 *
 * This type is derived from the `_input` property of the `StudioCMSDevAppsSchema` object.
 */
export type StudioCMSDevAppsOptions = typeof StudioCMSDevAppsSchema._input;

/**
 * Represents the configuration type for StudioCMS development applications.
 * This type is derived from the output of the `StudioCMSDevAppsSchema`.
 */
export type StudioCMSDevAppsConfig = z.infer<typeof StudioCMSDevAppsSchema>;
