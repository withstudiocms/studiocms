import { z } from 'astro/zod';

export const overridesSchema = z
	.object({
		/**
		 * Allows the user to override the default image component used in StudioCMS for rendering images.
		 */
		CustomImageOverride: z.string().optional(),
		/**
		 * Allows the user to override the default formatted date component used in StudioCMS for rendering dates.
		 */
		FormattedDateOverride: z.string().optional(),
	})
	.optional()
	.default({});
