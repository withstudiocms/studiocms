import { z } from 'astro/zod';

export const developerConfigSchema = z
	.object({
		/**
		 * Zero-JavaScript View Transitions
		 *
		 * Chrome 126 (released last week) and Microsoft Edge 126 (releasing this week) both support “cross-document view transitions” unlocking zero-JavaScript view transitions in Astro.
		 *
		 * @see https://astro.build/blog/future-of-astro-zero-js-view-transitions/
		 */
		viewTransitionAPI: z.boolean().optional().default(false),
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
