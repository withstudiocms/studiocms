import { z } from 'astro/zod';
import type { RobotsConfig } from '../../robots/types.js';

//
// INTEGRATIONS CONFIG SCHEMA
//
export const includedIntegrationsSchema = z
	.object({
		/**
		 * Allows the user to enable/disable the use of the StudioCMS Custom `astro-robots-txt` Integration
		 *
		 * @default robotsTXT: { policy: [ { userAgent: ['*'], allow: ['/'], disallow: ['/dashboard/'] } ] }
		 */
		robotsTXT: z.union([z.custom<RobotsConfig>(), z.boolean()]).optional().default(true),
	})
	.optional()
	.default({});
