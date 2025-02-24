import type { APIRoute, AstroIntegration } from 'astro';
import { z } from 'astro/zod';
import type { GridItemInput } from '../../lib/dashboardGrid.js';
import { DashboardPageSchema, SettingsFieldSchema } from './shared.js';

/**
 * Schema for Astro Integration.
 *
 * Converts the AstroIntegration type to a Zod schema.
 */
const AstroIntegrationSchema = z.custom<AstroIntegration>();

/**
 * Schema for Astro API Route.
 */
const AstroAPIRouteSchema = z.custom<APIRoute>();

/**
 * Schema for Astro Integration, which can be an array of Astro Integrations.
 */
const AstroIntegrationPossiblyArraySchema = z.union([
	AstroIntegrationSchema,
	z.array(AstroIntegrationSchema),
]);

/**
 * Schema for StudioCMS Plugin configuration.
 */
export const StudioCMSPluginSchema = z.object({
	/**
	 * Identifier of the plugin from the package.json
	 */
	identifier: z.string(),
	/**
	 * Label of the plugin to be displayed in the StudioCMS Dashboard
	 */
	name: z.string(),
	/**
	 * Minimum version of StudioCMS required for the plugin to work
	 */
	studiocmsMinimumVersion: z.string(),
	/**
	 * Astro Integration(s) for the plugin
	 */
	integration: AstroIntegrationPossiblyArraySchema.optional(),
	/**
	 * If this is true, the plugin will enable the Sitemap
	 */
	triggerSitemap: z.boolean().optional(),
	/**
	 * Allows the plugin to add sitemap endpoints
	 */
	sitemaps: z
		.array(
			z.object({
				/**
				 * The name of the plugin
				 */
				pluginName: z.string(),
				/**
				 * The path to the sitemap XML file
				 */
				sitemapXMLEndpointPath: z.string().or(z.instanceof(URL)),
			})
		)
		.optional(),
	/**
	 * Allows the plugin to add custom dashboard grid items
	 */
	dashboardGridItems: z.custom<GridItemInput[]>().optional(),
	/**
	 * Dashboard Pages for the plugin
	 */
	dashboardPages: z
		.object({
			/**
			 * Pages for the user role
			 *
			 * These are shown in the "Dashboard" section of the dashboard sidebar
			 */
			user: z.array(DashboardPageSchema).default([]).optional(),
			/**
			 * Pages for the editor role
			 *
			 * These are shown in the "Admin" section of the dashboard sidebar
			 */
			admin: z.array(DashboardPageSchema).default([]).optional(),
		})
		.optional(),
	/**
	 * If this exists, the plugin will have its own setting page
	 */
	settingsPage: z
		.object({
			/**
			 * Fields according to specification
			 */
			fields: z.array(SettingsFieldSchema),
			/**
			 * Function that runs on when the settings page is saved
			 *
			 * Should return a string if there is an error,
			 * otherwise return boolean true to indicate success
			 */
			onSave: AstroAPIRouteSchema,
		})
		.optional(),
	/**
	 * Navigation Links for use with the `@studiocms/frontend` package to display links in the frontend
	 */
	frontendNavigationLinks: z
		.array(
			z.object({
				/**
				 * Display label for the link
				 */
				label: z.string(),
				/**
				 * URL to link to
				 */
				href: z.string(),
			})
		)
		.optional(),
	/**
	 * Page Type definition. If this is present, the plugin wants to be able to modify the page creation process
	 */
	pageTypes: z
		.array(
			z.object({
				/**
				 * Label that is shown in the select input
				 */
				label: z.string(),
				/**
				 * Identifier that is saved in the database
				 * @example
				 * // Single page type per plugin
				 * 'studiocms'
				 * '@studiocms/blog'
				 * // Multiple page types per plugin (Use unique identifiers for each type to avoid conflicts)
				 * '@mystudiocms/plugin:pageType1'
				 * '@mystudiocms/plugin:pageType2'
				 * '@mystudiocms/plugin:pageType3'
				 * '@mystudiocms/plugin:pageType4'
				 */
				identifier: z.string(),
				/**
				 * Description that is shown below the "Page Content" header if this type is selected
				 */
				description: z.string().optional(),
				/**
				 * The path to the actual component that is displayed for the page content
				 *
				 * Component should have a `content` prop that is a string to be able to display current content.
				 *
				 * **NOTE:** If you storing a single string in the database, you can use the form name `page-content` for the content output. and it will be stored in the normal `content` field in the database.
				 * You can also use the apiEndpoints to create custom endpoints for the page type.
				 *
				 * @example
				 * ```ts
				 * import { createResolver } from 'astro-integration-kit';
				 * const { resolve } = createResolver(import.meta.url)
				 *
				 * {
				 *  pageContentComponent: resolve('./components/MyContentEditor.astro'),
				 * }
				 * ```
				 */
				pageContentComponent: z.string().optional(),

				// TODO: Add support for custom fields

				/**
				 * API Endpoints for the page type
				 *
				 * API endpoints are used to create, edit, and delete pages of this type,
				 * endpoints will be provided the full Astro APIContext from the Astro APIRoute.
				 */
				apiEndpoints: z
					.object({
						/**
						 * POST
						 *
						 * API endpoint will be provided the full Astro APIContext from the Astro APIRoute.
						 */
						onCreate: AstroAPIRouteSchema.optional(),
						/**
						 * PATCH
						 *
						 * API endpoint will be provided the full Astro APIContext from the Astro APIRoute.
						 */
						onEdit: AstroAPIRouteSchema.optional(),
						/**
						 * DELETE
						 *
						 * API endpoint will be provided the full Astro APIContext from the Astro APIRoute.
						 */
						onDelete: AstroAPIRouteSchema.optional(),
					})
					.optional(),
			})
		)
		.optional(),
});

/**
 * A schema for a safe plugin list item in StudioCMS.
 * This schema omits certain properties from the `StudioCMSPluginSchema`:
 * - `integration`
 * - `studiocmsMinimumVersion`
 * - `sitemaps`
 * - `dashboardGridItems`
 * - `triggerSitemap`
 *
 * These properties are excluded to ensure that the plugin list item schema
 * only includes the necessary and safe properties for use in the application.
 */
export const SafePluginListItemSchema = StudioCMSPluginSchema.omit({
	integration: true,
	studiocmsMinimumVersion: true,
	sitemaps: true,
	dashboardGridItems: true,
	triggerSitemap: true,
	dashboardPages: true,
});

export const SafePluginListSchema = z.array(SafePluginListItemSchema);

export type StudioCMSPluginOptions = typeof StudioCMSPluginSchema._input;
export type SafePluginListItemType = z.infer<typeof SafePluginListItemSchema>;
export type SafePluginListType = z.infer<typeof SafePluginListSchema>;
export interface StudioCMSPlugin extends StudioCMSPluginOptions {}
export type {
	SettingsField,
	DashboardPage,
	AvailableDashboardPages,
	FinalDashboardPage,
	StudioCMSColorway,
} from './shared.js';

/**
 * Defines a plugin for StudioCMS.
 *
 * @param options - The configuration options for the plugin.
 * @returns The plugin configuration.
 */
export function definePlugin(options: StudioCMSPluginOptions): StudioCMSPlugin {
	return options;
}
