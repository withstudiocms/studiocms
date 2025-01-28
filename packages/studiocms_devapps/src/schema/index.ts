import { z } from 'astro/zod';
import { AppsConfigSchema } from './appsConfig';

export const optionsSchema = z
	.object({
		/** Apps Config */
		appsConfig: AppsConfigSchema,
		/**
		 * Endpoint Path for apps that use endpoints
		 * @default '/_studiocms-devapps'
		 */
		endpointPath: z.string().optional().default('/_studiocms-devapps'),
		/**
		 * Verbose logging mode
		 * @default false
		 */
		verbose: z.boolean().optional().default(false),
	})
	.optional()
	.default({});

export const StudioCMSDevAppsSchema = z.object({
	/**
	 * Endpoint path for apps that require endpoints
	 *
	 * @default '_studiocms-devapps'
	 * @example '_my/custom/path'
	 */
	endpointPath: z.string().optional().default('_studiocms-devapps'),
	/**
	 * Apps Config
	 */
	apps: z
		.object({
			/**
			 * Astro DB LibSQL Viewer App Config
			 */
			libSQLViewer: z
				.union([
					z.boolean(),
					z.object({
						endpoint: z.string().optional().default('libsql-viewer'),
					}),
				])
				.default({ endpoint: 'libsql-viewer' }),
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
			libSQLViewer: { endpoint: 'libsql-viewer' },
		})
		.transform((val) => {
			let libSQL: { enabled: boolean; endpoint: string };
			let wpAPI: { enabled: boolean; endpoint: string };

			if (typeof val.libSQLViewer === 'boolean') {
				libSQL = { enabled: val.libSQLViewer, endpoint: 'libsql-viewer' };
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
		}),
	/**
	 * Verbose logging mode
	 * @default false
	 */
	verbose: z.boolean().optional().default(false),
});

export type StudioCMSDevAppsOptions = typeof StudioCMSDevAppsSchema._input;
export type StudioCMSDevAppsConfig = typeof StudioCMSDevAppsSchema._output;
