import type { AstroIntegration } from 'astro';
import { z } from 'astro/zod';
import type { GridItemInput } from '../../lib/dashboardGrid.js';
import {
	DashboardPageSchema,
	FrontendNavigationLinksSchema,
	PageTypesSchema,
	SettingsPageSchema,
} from './shared.js';

export const SitemapConfigSchema = z.object({
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
});

export const DashboardConfigSchema = z.object({
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
	settingsPage: SettingsPageSchema,
});

export const FrontendConfigSchema = z.object({
	/**
	 * Navigation Links for use with the `@studiocms/frontend` package to display links in the frontend
	 */
	frontendNavigationLinks: FrontendNavigationLinksSchema,
});

export const RenderingConfigSchema = z.object({
	/**
	 * Page Type definition. If this is present, the plugin wants to be able to modify the page creation process
	 */
	pageTypes: PageTypesSchema,
});

export type SitemapConfig = z.infer<typeof SitemapConfigSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type FrontendConfig = z.infer<typeof FrontendConfigSchema>;
export type RenderingConfig = z.infer<typeof RenderingConfigSchema>;

export type HookParameters<
	Hook extends keyof StudioCMSPlugin['hooks'],
	Fn = StudioCMSPlugin['hooks'][Hook],
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
> = Fn extends (...args: any) => any ? Parameters<Fn>[0] : never;

export interface BasePluginHooks {
	'studiocms:astro:config': (options: {
		addIntegrations: (integration: AstroIntegration | AstroIntegration[]) => void;
	}) => void | Promise<void>;
	'studiocms:config:setup': (options: {
		setSitemap: (opts: SitemapConfig) => void;
		setDashboard: (opts: DashboardConfig) => void;
		setFrontend: (opts: FrontendConfig) => void;
		setRendering: (opts: RenderingConfig) => void;
	}) => void | Promise<void>;
}

export interface StudioCMSPlugin {
	identifier: string;
	name: string;
	studiocmsMinimumVersion: string;
	hooks: {
		[K in keyof StudioCMS.PluginHooks]?: StudioCMS.PluginHooks[K];
	} & Partial<Record<string, unknown>>;
}

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
export const SafePluginListItemSchema = z.object({
	/**
	 * Identifier of the plugin from the package.json
	 */
	identifier: z.string(),

	/**
	 * Label of the plugin to be displayed in the StudioCMS Dashboard
	 */
	name: z.string(),

	/**
	 * If this exists, the plugin will have its own setting page
	 */
	settingsPage: SettingsPageSchema,

	/**
	 * Navigation Links for use with the `@studiocms/frontend` package to display links in the frontend
	 */
	frontendNavigationLinks: FrontendNavigationLinksSchema,

	/**
	 * Page Type definition. If this is present, the plugin wants to be able to modify the page creation process
	 */
	pageTypes: PageTypesSchema,
});

export const SafePluginListSchema = z.array(SafePluginListItemSchema);

export type SafePluginListItemType = z.infer<typeof SafePluginListItemSchema>;
export type SafePluginListType = z.infer<typeof SafePluginListSchema>;
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
export function definePlugin(options: StudioCMSPlugin): StudioCMSPlugin {
	return options;
}
