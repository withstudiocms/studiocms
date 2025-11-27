import { z } from 'astro/zod';

/**
 * Database Configuration Schema
 */
export const dbConfigSchema = z
	.object({
		/** Database Dialect to use */
		dialect: z.enum(['libsql', 'postgres', 'mysql']).optional().default('libsql'),
	})
	.optional()
	.default({});
