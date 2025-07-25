import { z } from 'astro/zod';
import { authConfigSchema } from './auth.js';
import { developerConfigSchema } from './developer.js';

export const dashboardConfigSchema = z
	.object({
		/**
		 * OPTIONAL - This allows the user to enable or disable the Astro StudioCMS dashboard but still provide all the helper's and utilities to those who are customizing their setup, doing so will disable the dashboard and you will need to manage your content via your database
		 *
		 * @default true
		 */
		dashboardEnabled: z.boolean().optional().default(true),
		// /**
		//  * This allows the user when in `output: "server"` mode with Astro to enable or disable the prerendering of the dashboard
		//  *
		//  * **Note: This is only applicable when using Astro in server mode in static(hybrid) mode, this will be `true`**
		//  *
		//  * @default true
		//  */
		// prerender: z.boolean().optional().default(true),
		/**
		 * OPTIONAL - This allows the user to enable or disable the default 404 route for the dashboard
		 *
		 * @default true
		 */
		inject404Route: z.boolean().optional().default(true),
		/**
		 * OPTIONAL - This allows the user to override the default Favicon URL to a custom URL
		 */
		faviconURL: z.string().optional().default('/favicon.svg'),
		/**
		 * OPTIONAL - This allows the user to override the default dashboard route to a custom route
		 *
		 * **Note: Use with caution, this is an advanced feature**
		 *
		 * @usage - The default route is `dashboard` without any `/` or `\` characters. If you want to override the route to `/admin` you would set this value to `admin`
		 *
		 * @default "dashboard"
		 */
		dashboardRouteOverride: z.string().optional(),
		/**
		 * OPTIONAL - This allows the user to enable or disable the version check for the dashboard
		 *
		 * This will check for the latest version of StudioCMS and notify the user
		 * if there is a new version available.
		 *
		 * @default true
		 */
		versionCheck: z.boolean().optional().default(true),
	})
	.optional()
	.default({});
