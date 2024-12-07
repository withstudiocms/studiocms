import type { RobotsConfig } from '@studiocms/robotstxt';
import { z } from 'astro/zod';

const RobotsConfigSchema = z.union([z.custom<RobotsConfig>(), z.boolean()]).optional().default({});

//
// INTEGRATIONS CONFIG SCHEMA
//
export const includedIntegrationsSchema = z
	.object({
		/**
		 * Allows the user to enable/disable the use of the StudioCMS Custom `astro-robots-txt` Integration
		 */
		robotsTXT: RobotsConfigSchema,
	})
	.optional()
	.default({});
