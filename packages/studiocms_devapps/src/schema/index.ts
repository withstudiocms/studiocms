import { z } from 'astro/zod';

export const AppsConfigSchema = z
	.object({
		/**
		 * Astro DB LibSQL Viewer App Config
		 */
		libSQLViewer: z.boolean().default(true),
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
		libSQLViewer: true,
	})
	.transform((val) => {
		let libSQL: { enabled: boolean };
		let wpAPI: { enabled: boolean; endpoint: string };

		if (typeof val.libSQLViewer === 'boolean') {
			libSQL = { enabled: val.libSQLViewer };
		} else {
			libSQL = { enabled: true };
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

export const StudioCMSDevAppsSchema = z
	.object({
		endpoint: z.string().optional().default('_studiocms-devapps'),
		verbose: z.boolean().optional().default(false),
		appsConfig: AppsConfigSchema,
	})
	.optional()
	.default({});

export type StudioCMSDevAppsOptions = typeof StudioCMSDevAppsSchema._input;
export type StudioCMSDevAppsConfig = typeof StudioCMSDevAppsSchema._output;
