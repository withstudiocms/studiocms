import { z } from 'astro/zod';

export const AppsConfigSchema = z
	.object({
		/**
		 * libSQLViewer App Config
		 */
		libSQLViewer: z
			.object({
				/**
				 * Enable libSQLViewer app
				 * @default true
				 */
				enabled: z.boolean().optional().default(true),
				/**
				 * Endpoint path for libSQLViewer
				 * @default '/libsql-viewer'
				 */
				endpoint: z.string().optional().default('/libsql-viewer'),
			})
			.optional()
			.default({}),
		/**
		 * WP API Importer App Config
		 */
		wpApiImporter: z
			.object({
				/**
				 * Enable WP API Importer app (Requires StudioCMS Integration)
				 * @default false
				 */
				enabled: z.boolean().optional().default(false),
				/**
				 * Endpoint path for WP API Importer API endpoint
				 * @default '/wp-api-importer'
				 */
				endpoint: z.string().optional().default('/wp-api-importer'),
			})
			.optional()
			.default({}),
	})
	.optional()
	.default({});
