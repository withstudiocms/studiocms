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
