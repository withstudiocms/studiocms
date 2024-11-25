import { z } from 'astro/zod';

//
// IMAGE SERVICE SCHEMA
//
export const imageServiceSchema = z
	.object({
		/**
		 * If the user wants to use a custom Supported CDN Plugin, they can specify it here.
		 *
		 * Currently Supported CDN Plugins: **cloudinary-js**
		 */
		cdnPlugin: z.enum(['cloudinary-js']).optional(),
	})
	.optional()
	.default({});
