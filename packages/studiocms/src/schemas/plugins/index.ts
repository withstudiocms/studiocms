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

/**
 * Schema for options used to sanitize HTML content in StudioCMS.
 *
 * @remarks
 * This schema defines the configuration for controlling which elements and attributes
 * are allowed, blocked, or dropped during the sanitization process. It also provides
 * options for handling components, custom elements, and comments.
 *
 * @property allowElements - An array of strings specifying elements that should not be removed. All other elements will be dropped.
 * @property blockElements - An array of strings specifying elements that should be removed, but their children will be kept.
 * @property dropElements - An array of strings specifying elements (including nested elements) that should be removed entirely.
 * @property allowAttributes - An object mapping attribute names to arrays of allowed tag names. Only matching attributes will be retained.
 * @property dropAttributes - An object mapping attribute names to arrays of tag names for which the attribute should be dropped.
 * @property allowComponents - If true, components will be checked against built-in and custom configuration to determine retention. Default is false.
 * @property allowCustomElements - If true, custom elements will be checked against built-in and custom configuration to determine retention. Default is false.
 * @property allowComments - If true, HTML comments will be retained. Default is false.
 */
export const StudioCMSSanitizeOptionsSchema = z
	.object({
		/** An Array of strings indicating elements that the sanitizer should not remove. All elements not in the array will be dropped. */
		allowElements: z.array(z.string()).optional(),
		/** An Array of strings indicating elements that the sanitizer should remove. Children will be kept. */
		blockElements: z.array(z.string()).optional(),
		/** An Array of strings indicating elements (including nested elements) that the sanitizer should remove. */
		dropElements: z.array(z.string()).optional(),
		/** An object where each key is the attribute name and the value is an array of allowed tag names. Matching attributes will not be removed. All attributes that are not in the array will be dropped. */
		allowAttributes: z.record(z.array(z.string())).optional(),
		/** An object where each key is the attribute name and the value is an array of dropped tag names. Matching attributes will be removed. */
		dropAttributes: z.record(z.array(z.string())).optional(),
		/** A boolean value to remove components and their children. If set to true, components will be subject to built-in and custom configuration checks (and will be retained or dropped based on those checks). Default is `false`. */
		allowComponents: z.boolean().optional(),
		/** A boolean value to remove custom elements and their children. If set to true, custom elements will be subject to built-in and custom configuration checks (and will be retained or dropped based on those checks). Default is `false` */
		allowCustomElements: z.boolean().optional(),
		/** A boolean value to remove HTML comments. Set to true in order to keep comments. Default is `false`. */
		allowComments: z.boolean().optional(),
	})
	.optional();

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

const ImageServiceConfigSchema = z.object({
	imageService: z
		.object({
			/**
			 * Identifier used for the `preferredImageService` setting on StudioCMS
			 */
			identifier: z.string(),
			/**
			 * The Service Path to the file that contains your service, the service must be exported as a default export.
			 *
			 * For an example of a service, checkout `/src/imageServices/cloudinary-js-service.ts` and its plugin `/src/imageServices/cloudinary-js.ts` within the StudioCMS package on GitHub.
			 */
			servicePath: z.string().or(z.instanceof(URL)),
		})
		.optional(),
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
const setImageServiceFn = z.function(z.tuple([ImageServiceConfigSchema]), z.void());

type StudioCMSConfigHookSchema = BaseHookSchema & {
	setSitemap: typeof setSitemapFn;
	setDashboard: typeof setDashboardFn;
	setFrontend: typeof setFrontendFn;
	setRendering: typeof setRenderingFn;
	setImageService: typeof setImageServiceFn;
};

const studiocmsConfigHookSchema: z.ZodObject<StudioCMSConfigHookSchema> = baseHookSchema.extend({
	setSitemap: setSitemapFn,
	setDashboard: setDashboardFn,
	setFrontend: setFrontendFn,
	setRendering: setRenderingFn,
	setImageService: setImageServiceFn,
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
	/**
	 * The identifier of the plugin, usually the package name.
	 */
	identifier: string;
	/**
	 * The name of the plugin, displayed in the StudioCMS Dashboard.
	 */
	name: string;
	/**
	 * The minimum version of StudioCMS required for this plugin to function correctly.
	 * This is used to ensure compatibility between the plugin and the StudioCMS core.
	 * It should be a semantic version string (e.g., "1.0.0").
	 * If the plugin is not compatible with the current version of StudioCMS, it should not be loaded.
	 * This is a required field.
	 * @example "1.0.0"
	 */
	studiocmsMinimumVersion: string;
	/**
	 * List of plugins that this plugin requires to function correctly.
	 * This is used to ensure that all required plugins are loaded before this plugin.
	 * If any required plugin is not found, this plugin will not be loaded.
	 * This is an optional field.
	 * @example ["@studiocms/plugin-example", "@studiocms/plugin-another-example"]
	 */
	requires?: string[];
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

export type ImageServiceExtraProps = {
	alt: string;
	width: number;
	height: number;
};

export type StudioCMSImageService = (
	src: string,
	props: ImageServiceExtraProps
) => string | Promise<string>;