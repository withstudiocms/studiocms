import { z } from 'astro/zod';

export interface DBConfigSchema {
	/** Database Dialect to use */
	dialect?: 'libsql' | 'postgres' | 'mysql';
}

/**
 * Database Configuration Schema
 */
export const dbConfigSchema = z
	.object({
		dialect: z.enum(['libsql', 'postgres', 'mysql']).optional().default('libsql'),
	})
	.optional()
	.default({});
