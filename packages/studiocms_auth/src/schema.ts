import { dashboardConfigSchema } from '@studiocms/core/schemas';
import { z } from 'astro/zod';

/**
 * StudioCMS Auth Integration Options Schema
 */
export const StudioCMSAuthOptionsSchema = z.object({
	verbose: z.boolean().optional().default(false),
	dbStartPage: z.boolean().optional().default(true),
	dashboardConfig: dashboardConfigSchema,
});

/**
 * StudioCMS Auth Integration Options Type
 */
export type StudioCMSAuthOptions = typeof StudioCMSAuthOptionsSchema._output;
