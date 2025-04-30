import type { AstroIntegrationLogger } from 'astro';
import { z } from 'astro/zod';
import type { GridItemInput } from '../../lib/dashboardGrid.js';
import {
	DashboardPageSchema,
	FrontendNavigationLinksSchema,
	PageTypesSchema,
	SettingsPageSchema,
	astroIntegrationSchema,
} from './shared.js';

const dashboardPagesArray = z.array(DashboardPageSchema).optional();

const astroIntegrationLoggerSchema = z.custom<AstroIntegrationLogger>();

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
	settingsPage: SettingsPageSchema.optional(),

	/**
	 * Navigation Links for use with the `@studiocms/frontend` package to display links in the frontend
	 */
	frontendNavigationLinks: FrontendNavigationLinksSchema.optional(),

	/**
	 * Page Type definition. If this is present, the plugin wants to be able to modify the page creation process
	 */
	pageTypes: PageTypesSchema.optional(),
});

export const SafePluginListSchema = z.array(SafePluginListItemSchema);

const SitemapConfigSchema = z.object({
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

const DashboardConfigSchema = z.object({
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
			user: dashboardPagesArray,

			/**
			 * Pages for the editor role
			 *
			 * These are shown in the "Admin" section of the dashboard sidebar
			 */
			admin: dashboardPagesArray,
		})
		.optional(),

	/**
	 * If this exists, the plugin will have its own setting page
	 */
	settingsPage: SettingsPageSchema,
});

const FrontendConfigSchema = z.object({
	/**
	 * Navigation Links for use with the `@studiocms/frontend` package to display links in the frontend
	 */
	frontendNavigationLinks: FrontendNavigationLinksSchema,
});

const RenderingConfigSchema = z.object({
	/**
	 * Page Type definition. If this is present, the plugin wants to be able to modify the page creation process
	 */
	pageTypes: PageTypesSchema,
});

type BaseHookSchema = {
	logger: typeof astroIntegrationLoggerSchema;
};

const baseHookSchema: z.ZodObject<BaseHookSchema> = z.object({
	logger: astroIntegrationLoggerSchema,
});

const astroConfigHookSchema = baseHookSchema.extend({
	addIntegrations: z.function(
		z.tuple([z.union([astroIntegrationSchema, z.array(astroIntegrationSchema)])]),
		z.void()
	),
});

const setSitemapFn = z.function(z.tuple([SitemapConfigSchema]), z.void());
const setDashboardFn = z.function(z.tuple([DashboardConfigSchema]), z.void());
const setFrontendFn = z.function(z.tuple([FrontendConfigSchema]), z.void());
const setRenderingFn = z.function(z.tuple([RenderingConfigSchema]), z.void());

type StudioCMSConfigHookSchema = BaseHookSchema & {
	setSitemap: typeof setSitemapFn;
	setDashboard: typeof setDashboardFn;
	setFrontend: typeof setFrontendFn;
	setRendering: typeof setRenderingFn;
};

const studiocmsConfigHookSchema: z.ZodObject<StudioCMSConfigHookSchema> = baseHookSchema.extend({
	setSitemap: setSitemapFn,
	setDashboard: setDashboardFn,
	setFrontend: setFrontendFn,
	setRendering: setRenderingFn,
});

type SCMSAstroConfigHook = z.infer<typeof astroConfigHookSchema>;
type SCMSConfigSetupHook = z.infer<typeof studiocmsConfigHookSchema>;

type PluginHook<OPT> = (options: OPT) => void | Promise<void>;

const StudioCMSPluginSchemaInternal = z.array(z.custom<StudioCMSPlugin>());

const exposePluginsFn = z.function(z.tuple([StudioCMSPluginSchemaInternal.optional()]), z.void());

const studiocmsPluginAstroHook = z.object({
	exposePlugins: exposePluginsFn,
});

type SCMSPluginAstroHook = z.infer<typeof studiocmsPluginAstroHook>;

export interface StudioCMSPluginHook {
	'studiocms:plugins'?: PluginHook<SCMSPluginAstroHook>;
}

/**
 * Interface representing the base hooks for plugins in the StudioCMS system.
 */
export interface BasePluginHooks {
	'studiocms:astro:config': PluginHook<SCMSAstroConfigHook>;
	'studiocms:config:setup': PluginHook<SCMSConfigSetupHook>;
}

export interface StudioCMSPlugin {
	identifier: string;
	name: string;
	studiocmsMinimumVersion: string;
	hooks: {
		[K in keyof StudioCMS.PluginHooks]?: StudioCMS.PluginHooks[K];
	} & Partial<Record<string, unknown>>;
}

export type HookParameters<
	Hook extends keyof StudioCMSPlugin['hooks'],
	Fn = StudioCMSPlugin['hooks'][Hook],
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
> = Fn extends (...args: any) => any ? Parameters<Fn>[0] : never;

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
