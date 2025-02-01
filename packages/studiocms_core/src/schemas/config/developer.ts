import { z } from 'astro/zod';

export const developerConfigSchema = z
	.object({
		/**
		 * Enable Testing and Demo Mode
		 *
		 * This will enable the testing and demo mode for the Astro StudioCMS dashboard, this will allow you to test the dashboard without having to authenticate. This is useful for testing and demo purposes as it will allow you to see how the dashboard works and looks but disable any changes to the database.
		 *
		 * @default false
		 */
		testingAndDemoMode: z.boolean().optional().default(false),
	})
	.optional()
	.default({});
