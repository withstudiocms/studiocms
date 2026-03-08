import * as Schema from 'effect/Schema';
import { FunctionSchema, SyncFunctionSchema } from 'effectify/schemas';
import { AstroIntegrationLoggerSchema, AstroIntegrationSchema } from '../external-schemas.js';
import { PluginTranslationsSchema } from './i18n.js';
import {
	DashboardPageSchema,
	FrontendNavigationLinksSchema,
	GridItemInputSchema,
	PageTypesSchema,
	SettingsPageSchema,
} from './shared.js';

export type {
	AvailableDashboardPages,
	DashboardPage,
	FinalDashboardPage,
	SettingsField,
	StudioCMSColorwaySchema,
} from './shared.js';

/**
 * Post Processor Schema for validating the structure of post-processors that plugins can implement to modify the rendered content within the StudioCMS system.
 *
 * - id: A unique identifier for the post-processor, allowing it to be referenced and applied to the rendered content.
 * - postProcessor: A string with the path to the post-processor module, which should export a function that takes the rendered content as input and returns the modified content. This allows plugins to implement custom logic for modifying the rendered output, such as adding additional HTML, transforming the content in specific ways, or integrating with other systems to enhance the rendering process.
 */
export class PostProcessorSchema extends Schema.Class<PostProcessorSchema>('PostProcessorSchema')({
	id: Schema.String,
	postProcessor: Schema.String,
}) {}

/**
 * This module defines schemas for rendering augmentations in the StudioCMS plugin system.
 */
export class RenderAugmentBaseSchema extends Schema.Class<RenderAugmentBaseSchema>(
	'RenderAugmentBaseSchema'
)({
	id: Schema.String,
	components: Schema.Record({
		key: Schema.String,
		value: Schema.String,
	}),
}) {}

/**
 * Represents an augmentation to the rendering process that adds a component with specified properties.
 */
export class ComponentRenderAugmentSchema extends RenderAugmentBaseSchema.extend<ComponentRenderAugmentSchema>(
	'ComponentRenderAugmentSchema'
)({
	type: Schema.Literal('component'),
}) {}

/**
 * Represents an augmentation to the rendering process that adds HTML content before the main content (prefix).
 */
export class PrefixRenderAugmentSchema extends RenderAugmentBaseSchema.extend<PrefixRenderAugmentSchema>(
	'PrefixRenderAugmentSchema'
)({
	type: Schema.Literal('prefix'),
	html: Schema.String,
}) {}

/**
 * Represents an augmentation to the rendering process that adds HTML content after the main content (suffix).
 */
export class SuffixRenderAugmentSchema extends RenderAugmentBaseSchema.extend<SuffixRenderAugmentSchema>(
	'SuffixRenderAugmentSchema'
)({
	type: Schema.Literal('suffix'),
	html: Schema.String,
}) {}

/**
 * Represents an augmentation to the rendering process that applies a post-processing function to the rendered content.
 */
export class PostProcessorAugmentSchema extends PostProcessorSchema.extend<PostProcessorAugmentSchema>(
	'PostProcessorAugmentSchema'
)({
	type: Schema.Literal('post-processor'),
}) {}

/**
 * Represents an augmentation to the rendering process, which can be of three types:
 * - Component: Augments the rendering by adding a component with specified properties.
 * - Prefix: Augments the rendering by adding HTML content before the main content.
 * - Suffix: Augments the rendering by adding HTML content after the main content.
 * - Post-Processor: Augments the rendering by applying a post-processing function to the rendered content.
 */
export const RenderAugmentSchema = Schema.Union(
	ComponentRenderAugmentSchema,
	PrefixRenderAugmentSchema,
	SuffixRenderAugmentSchema,
	PostProcessorAugmentSchema
);

/**
 * Represents an array of rendering augmentations, allowing for multiple augmentations to be applied to the rendering process.
 */
export const RenderAugmentsSchema = Schema.Array(RenderAugmentSchema);

/**
 * Represents an array of dashboard pages, allowing for multiple pages to be added to the StudioCMS dashboard through plugins.
 */
export const dashboardPagesArray = Schema.Array(DashboardPageSchema);

/**
 * Safe Plugin List Item Schema for validating plugin information without including potentially unsafe or complex properties such as render functions or integration loggers. This schema focuses on validating basic plugin metadata and configuration pages, ensuring that the essential information about the plugin is correctly structured while omitting properties that may require more complex validation or could pose security risks if not handled properly.
 */
export const SafePluginListItemSchema = Schema.Struct({
	identifier: Schema.String,
	name: Schema.String,
	settingsPage: SettingsPageSchema,
	frontendNavigationLinks: FrontendNavigationLinksSchema,
	pageTypes: PageTypesSchema,
});

/**
 * Safe Plugin List Schema for validating an array of plugins, where each plugin is validated against the SafePluginListItemSchema. This schema ensures that the list of plugins provided to the StudioCMS system adheres to the expected structure and contains valid metadata and configuration pages for each plugin, while excluding properties that may require more complex validation or could pose security risks if not handled properly.
 */
export const SafePluginListSchema = Schema.mutable(Schema.Array(SafePluginListItemSchema));

/**
 * Schema for StudioCMS Sitemap configuration, allowing plugins to specify whether they trigger sitemap generation and to define custom sitemaps with their corresponding XML endpoint paths. This schema ensures that the sitemap configuration provided by plugins adheres to the expected structure, enabling seamless integration of sitemap generation into the StudioCMS system while providing flexibility for plugins to define their own sitemaps as needed.
 */
export const SitemapConfigSchema = Schema.mutable(
	Schema.Struct({
		triggerSitemap: Schema.optional(Schema.Boolean),
		sitemaps: Schema.optional(
			Schema.Array(
				Schema.Struct({
					pluginName: Schema.String,
					sitemapXMLEndpointPath: Schema.Union(Schema.String, Schema.URL),
				})
			)
		),
	})
);

export type SCMSSiteMapFnOpts = typeof SitemapConfigSchema.Type;

/**
 * Schema for validating the dashboard configuration provided by plugins, including translations, dashboard grid items, and dashboard pages for both user and admin interfaces. This schema ensures that the dashboard configuration adheres to the expected structure, allowing plugins to seamlessly integrate their custom dashboard components and pages into the StudioCMS system while providing necessary translations for internationalization support.
 */
export const DashboardConfigSchema = Schema.mutable(
	Schema.Struct({
		translations: PluginTranslationsSchema,
		dashboardGridItems: Schema.optional(Schema.Array(GridItemInputSchema)),
		dashboardPages: Schema.optional(
			Schema.Struct({
				user: Schema.optional(dashboardPagesArray),
				admin: Schema.optional(dashboardPagesArray),
			})
		),
		settingsPage: SettingsPageSchema,
	})
);

export type SCMSDashboardFnOpts = typeof DashboardConfigSchema.Type;

/**
 * Schema for validating dashboard augmentations provided by plugins, allowing for the addition of custom components or HTML content to the StudioCMS dashboard. This schema ensures that the dashboard augmentations adhere to the expected structure, enabling plugins to enhance the dashboard experience with their own customizations while maintaining compatibility with the overall StudioCMS system.
 */
export const DashboardAugmentSchema = Schema.mutable(
	Schema.Struct({
		scripts: Schema.optional(Schema.Array(Schema.String)),
		components: Schema.optional(
			Schema.Record({
				key: Schema.String,
				value: Schema.String,
			})
		),
	})
);

export type SCMSDashboardAugmentFnOpts = typeof DashboardAugmentSchema.Type;

/**
 * Schema for validating the frontend configuration provided by plugins, specifically focusing on the frontend navigation links that plugins can add to the StudioCMS interface. This schema ensures that the frontend configuration adheres to the expected structure, allowing plugins to seamlessly integrate their custom navigation links into the StudioCMS system while providing a consistent user experience across different plugins.
 */
export const FrontendConfigSchema = Schema.mutable(
	Schema.Struct({
		frontendNavigationLinks: FrontendNavigationLinksSchema,
	})
);

export type SCMSFrontendFnOpts = typeof FrontendConfigSchema.Type;

/**
 * Schema for validating the rendering configuration provided by plugins, including the page types that the plugin can render and any augmentations to the rendering process. This schema ensures that the rendering configuration adheres to the expected structure, allowing plugins to define how they integrate with the rendering system of StudioCMS while providing necessary information about the page types they support and any customizations they apply to the rendering process.
 */
export const RenderingConfigSchema = Schema.mutable(
	Schema.Struct({
		pageTypes: PageTypesSchema,
		augments: Schema.optional(RenderAugmentsSchema),
		postProcessor: Schema.optional(PostProcessorSchema),
	})
);

export type SCMSRenderingFnOpts = typeof RenderingConfigSchema.Type;

/**
 * Schema for validating the image service configuration provided by plugins, allowing plugins to specify an image service with its identifier and service path. This schema ensures that the image service configuration adheres to the expected structure, enabling plugins to integrate their custom image services into the StudioCMS system while providing necessary information about the service for proper functionality.
 */
export const ImageServiceConfigSchema = Schema.mutable(
	Schema.Struct({
		imageService: Schema.optional(
			Schema.Struct({
				identifier: Schema.String,
				servicePath: Schema.Union(Schema.String, Schema.URL),
			})
		),
	})
);

export type SCMSImageServiceFnOpts = typeof ImageServiceConfigSchema.Type;

/**
 * Schema for validating the authentication service configuration provided by plugins, allowing plugins to specify an authentication service with its OAuth provider details. This schema ensures that the authentication service configuration adheres to the expected structure, enabling plugins to integrate their custom authentication services into the StudioCMS system while providing necessary information about the OAuth provider for proper functionality.
 */
export const AuthServiceConfigSchema = Schema.mutable(
	Schema.Struct({
		oAuthProvider: Schema.Struct({
			name: Schema.String,
			formattedName: Schema.String,
			svg: Schema.String,
			endpointPath: Schema.String,
			requiredEnvVariables: Schema.optional(Schema.Array(Schema.String)),
		}),
	})
);

export type SCMSAuthServiceFnOpts = typeof AuthServiceConfigSchema.Type;

/**
 * Schema for validating the storage manager configuration provided by plugins, allowing plugins to specify a storage manager with its identifier and manager path. This schema ensures that the storage manager configuration adheres to the expected structure, enabling plugins to integrate their custom storage managers into the StudioCMS system while providing necessary information about the manager for proper functionality.
 */
export const StorageManagerConfigSchema = Schema.Struct({
	managerPath: Schema.String,
});

/**
 * Base Hook Schema for validating the structure of hooks provided by plugins, including the integration logger that hooks can use to log messages within the StudioCMS system. This schema ensures that the hooks adhere to the expected structure, allowing plugins to implement their custom logic while providing necessary tools for logging and debugging through the integration logger.
 */
export class BaseHookSchema extends Schema.Class<BaseHookSchema>('BaseHookSchema')({
	logger: AstroIntegrationLoggerSchema,
}) {}

/**
 * Schema for validating the structure of the astroConfig hook provided by plugins, allowing plugins to add custom integrations to the Astro configuration within the StudioCMS system. This schema extends the BaseHookSchema to include a specific function for adding integrations, ensuring that the astroConfig hook adheres to the expected structure and provides necessary functionality for integrating with Astro while maintaining compatibility with the overall StudioCMS system.
 */
export class astroConfigHookSchema extends BaseHookSchema.extend<astroConfigHookSchema>(
	'astroConfigHookSchema'
)({
	addIntegrations: FunctionSchema(
		Schema.Union(AstroIntegrationSchema, Schema.mutable(Schema.Array(AstroIntegrationSchema))),
		Schema.Void
	),
}) {}

/**
 * Type definition for the astroConfig hook, representing the expected structure of the hook function that plugins can implement to add custom integrations to the Astro configuration within the StudioCMS system. This type definition ensures that any implementation of the astroConfig hook adheres to the expected structure and provides necessary functionality for integrating with Astro while maintaining compatibility with the overall StudioCMS system.
 */
export type SCMSAstroConfigHook = typeof astroConfigHookSchema.Type;

/**
 * Schema for validating the structure of the sitemap hook provided by plugins, allowing plugins to specify custom sitemap configurations and trigger sitemap generation within the StudioCMS system. This schema extends the BaseHookSchema to include a specific function for setting the sitemap configuration, ensuring that the sitemap hook adheres to the expected structure and provides necessary functionality for managing sitemaps while maintaining compatibility with the overall StudioCMS system.
 */
export class SitemapHookSchema extends BaseHookSchema.extend<SitemapHookSchema>(
	'SitemapHookSchema'
)({
	setSitemap: FunctionSchema(SitemapConfigSchema, Schema.Void),
}) {}

/**
 * Type definition for the sitemap hook, representing the expected structure of the hook function that plugins can implement to specify custom sitemap configurations and trigger sitemap generation within the StudioCMS system. This type definition ensures that any implementation of the sitemap hook adheres to the expected structure and provides necessary functionality for managing sitemaps while maintaining compatibility with the overall StudioCMS system.
 */
export type SCMSSitemapHook = typeof SitemapHookSchema.Type;

/**
 * Schema for validating the structure of the dashboard hook provided by plugins, allowing plugins to specify custom dashboard configurations and augmentations within the StudioCMS system. This schema extends the BaseHookSchema to include specific functions for setting the dashboard configuration and augmenting the dashboard, ensuring that the dashboard hook adheres to the expected structure and provides necessary functionality for managing and customizing the dashboard while maintaining compatibility with the overall StudioCMS system.
 */
export class DashboardHookSchema extends BaseHookSchema.extend<DashboardHookSchema>(
	'DashboardHookSchema'
)({
	setDashboard: FunctionSchema(DashboardConfigSchema, Schema.Void),
	augmentDashboard: FunctionSchema(DashboardAugmentSchema, Schema.Void),
}) {}

/**
 * Type definition for the dashboard hook, representing the expected structure of the hook function that plugins can implement to specify custom dashboard configurations and augmentations within the StudioCMS system. This type definition ensures that any implementation of the dashboard hook adheres to the expected structure and provides necessary functionality for managing and customizing the dashboard while maintaining compatibility with the overall StudioCMS system.
 */
export type SCMSDashboardHook = typeof DashboardHookSchema.Type;

/**
 * Schema for validating the structure of the frontend hook provided by plugins, allowing plugins to specify custom frontend configurations and navigation links within the StudioCMS system. This schema extends the BaseHookSchema to include a specific function for setting the frontend configuration, ensuring that the frontend hook adheres to the expected structure and provides necessary functionality for managing frontend navigation while maintaining compatibility with the overall StudioCMS system.
 */
export class FrontendHookSchema extends BaseHookSchema.extend<FrontendHookSchema>(
	'FrontendHookSchema'
)({
	setFrontend: FunctionSchema(FrontendConfigSchema, Schema.Void),
}) {}

/**
 * Type definition for the frontend hook, representing the expected structure of the hook function that plugins can implement to specify custom frontend configurations and navigation links within the StudioCMS system. This type definition ensures that any implementation of the frontend hook adheres to the expected structure and provides necessary functionality for managing frontend navigation while maintaining compatibility with the overall StudioCMS system.
 */
export type SCMSFrontendHook = typeof FrontendHookSchema.Type;

/**
 * Schema for validating the structure of the rendering hook provided by plugins, allowing plugins to specify custom rendering configurations and augmentations within the StudioCMS system. This schema extends the BaseHookSchema to include a specific function for setting the rendering configuration, ensuring that the rendering hook adheres to the expected structure and provides necessary functionality for managing rendering behavior while maintaining compatibility with the overall StudioCMS system.
 */
export class RenderingHookSchema extends BaseHookSchema.extend<RenderingHookSchema>(
	'RenderingHookSchema'
)({
	setRendering: FunctionSchema(RenderingConfigSchema, Schema.Void),
}) {}

/**
 * Type definition for the rendering hook, representing the expected structure of the hook function that plugins can implement to specify custom rendering configurations and augmentations within the StudioCMS system. This type definition ensures that any implementation of the rendering hook adheres to the expected structure and provides necessary functionality for managing rendering behavior while maintaining compatibility with the overall StudioCMS system.
 */
export type SCMSRenderingHook = typeof RenderingHookSchema.Type;

/**
 * Schema for validating the structure of the image service hook provided by plugins, allowing plugins to specify custom image service configurations within the StudioCMS system. This schema extends the BaseHookSchema to include a specific function for setting the image service configuration, ensuring that the image service hook adheres to the expected structure and provides necessary functionality for managing image services while maintaining compatibility with the overall StudioCMS system.
 */
export class ImageServiceHookSchema extends BaseHookSchema.extend<ImageServiceHookSchema>(
	'ImageServiceHookSchema'
)({
	setImageService: FunctionSchema(ImageServiceConfigSchema, Schema.Void),
}) {}

/**
 * Type definition for the image service hook, representing the expected structure of the hook function that plugins can implement to specify custom image service configurations within the StudioCMS system. This type definition ensures that any implementation of the image service hook adheres to the expected structure and provides necessary functionality for managing image services while maintaining compatibility with the overall StudioCMS system.
 */
export type SCMSImageServiceHook = typeof ImageServiceHookSchema.Type;

/**
 * Schema for validating the structure of the authentication service hook provided by plugins, allowing plugins to specify custom authentication service configurations within the StudioCMS system. This schema extends the BaseHookSchema to include a specific function for setting the authentication service configuration, ensuring that the authentication service hook adheres to the expected structure and provides necessary functionality for managing authentication services while maintaining compatibility with the overall StudioCMS system.
 */
export class AuthServiceHookSchema extends BaseHookSchema.extend<AuthServiceHookSchema>(
	'AuthServiceHookSchema'
)({
	setAuthService: FunctionSchema(AuthServiceConfigSchema, Schema.Void),
}) {}

/**
 * Type definition for the authentication service hook, representing the expected structure of the hook function that plugins can implement to specify custom authentication service configurations within the StudioCMS system. This type definition ensures that any implementation of the authentication service hook adheres to the expected structure and provides necessary functionality for managing authentication services while maintaining compatibility with the overall StudioCMS system.
 */
export type SCMSAuthServiceHook = typeof AuthServiceHookSchema.Type;

/**
 * Schema for validating the structure of the storage manager hook provided by plugins, allowing plugins to specify custom storage manager configurations within the StudioCMS system. This schema extends the BaseHookSchema to include a specific function for setting the storage manager configuration, ensuring that the storage manager hook adheres to the expected structure and provides necessary functionality for managing storage managers while maintaining compatibility with the overall StudioCMS system.
 */
export class StorageManagerHookSchema extends BaseHookSchema.extend<StorageManagerHookSchema>(
	'StorageManagerHookSchema'
)({
	setStorageManager: FunctionSchema(StorageManagerConfigSchema, Schema.Void),
}) {}

/**
 * Type definition for the storage manager hook, representing the expected structure of the hook function that plugins can implement to specify custom storage manager configurations within the StudioCMS system. This type definition ensures that any implementation of the storage manager hook adheres to the expected structure and provides necessary functionality for managing storage managers while maintaining compatibility with the overall StudioCMS system.
 */
export type SCMSStorageManagerHook = typeof StorageManagerHookSchema.Type;

/**
 * Helper function to create a hook schema for a given set of arguments, allowing for the validation of hooks that plugins can implement to integrate with various aspects of the StudioCMS system. This function takes an argument schema and returns a function schema that validates the structure of the hook function, ensuring that it adheres to the expected format and provides necessary functionality for integrating with the StudioCMS system while maintaining compatibility and security.
 */
const makeHookSchema = <A, I, R = never>(argsSchema: Schema.Schema<A, I, R>) =>
	Schema.optional(
		Schema.Union(
			FunctionSchema(argsSchema, Schema.Void),
			SyncFunctionSchema(argsSchema, Schema.Void)
		)
	).annotations({
		description:
			'A hook schema for validating the structure of hooks that plugins can implement to integrate with various aspects of the StudioCMS system.',
	});

/**
 * Internal Shared Plugin hooks schema for validating the structure of hooks that are shared across different plugin types within the StudioCMS system, including hooks for Astro configuration, authentication service, dashboard configuration, frontend configuration, rendering configuration, image service configuration, and sitemap configuration. This schema ensures that the shared hooks adhere to the expected structure, allowing for seamless integration of plugin functionality into the StudioCMS system while providing necessary tools for logging and debugging through the integration logger.
 *
 * Note: This schema is intended for internal use within the plugin system and may not include all possible hooks or configurations that plugins can implement, but rather focuses on the common hooks that are shared across different plugin types.
 */
export const InternalPluginHooksSchema = Schema.Struct({
	'studiocms:astro-config': makeHookSchema(astroConfigHookSchema),
	'studiocms:auth': makeHookSchema(AuthServiceHookSchema),
	'studiocms:dashboard': makeHookSchema(DashboardHookSchema),
	'studiocms:frontend': makeHookSchema(FrontendHookSchema),
	'studiocms:rendering': makeHookSchema(RenderingHookSchema),
	'studiocms:image-service': makeHookSchema(ImageServiceHookSchema),
	'studiocms:sitemap': makeHookSchema(SitemapHookSchema),
});

/**
 * Base Plugin Hooks Schema for validating the structure of hooks provided by plugins, including hooks for Astro configuration, authentication service, dashboard configuration, frontend configuration, rendering configuration, image service configuration, and sitemap configuration. This schema ensures that the hooks provided by plugins adhere to the expected structure, allowing for seamless integration of plugin functionality into the StudioCMS system while providing necessary tools for logging and debugging through the integration logger.
 */
export const BasePluginHooksSchema = Schema.mutable(InternalPluginHooksSchema);

/**
 * Type definition for the base plugin hooks, representing the expected structure of the hooks that plugins can implement to integrate with various aspects of the StudioCMS system. This type definition ensures that any implementation of the base plugin hooks adheres to the expected structure and provides necessary functionality for integrating with the StudioCMS system while maintaining compatibility and security.
 */
export type BasePluginHooks = typeof BasePluginHooksSchema.Type;

/**
 * Schema for validating the structure of storage manager hooks provided by plugins, allowing plugins to specify custom storage manager configurations within the StudioCMS system. This schema extends the BasePluginHooksSchema to include a specific hook for setting the storage manager configuration, ensuring that any implementation of the storage manager hook adheres to the expected structure and provides necessary functionality for managing storage managers while maintaining compatibility with the overall StudioCMS system.
 */
export const StorageManagerPluginHooksSchema = Schema.mutable(
	Schema.Struct({
		...InternalPluginHooksSchema.fields,
		'studiocms:storage-manager': makeHookSchema(StorageManagerHookSchema),
	})
);

/**
 * Type definition for the storage manager plugin hooks, representing the expected structure of the hooks that plugins can implement to specify custom storage manager configurations within the StudioCMS system. This type definition ensures that any implementation of the storage manager plugin hooks adheres to the expected structure and provides necessary functionality for managing storage managers while maintaining compatibility with the overall StudioCMS system.
 */
export type StorageManagerPluginHooks = typeof StorageManagerPluginHooksSchema.Type;

// TODO: Remove `studiocmsMinimumVersion` in a future release.

/**
 * Schema for validating the structure of the base plugin configuration, including essential metadata such as identifier, name, minimum required version of StudioCMS, and dependencies on other plugins. This schema ensures that the basic information about the plugin is correctly structured, allowing for seamless integration of plugins into the StudioCMS system while providing necessary information about the plugin and its functionality.
 */
export class StudioCMSPluginBaseSchema extends Schema.Class<StudioCMSPluginBaseSchema>(
	'StudioCMSPluginBaseSchema'
)({
	identifier: Schema.String,
	name: Schema.String,
	/**
	 * @deprecated The `studiocmsMinimumVersion` property is deprecated and will be removed in a future release. Please ensure that your plugin is compatible with the latest version of StudioCMS and remove this property from your plugin configuration. It is recommended to use `peerDependencies` in your plugin's package.json to specify the compatible versions of StudioCMS instead of relying on this property for version compatibility checks.
	 */
	studiocmsMinimumVersion: Schema.optional(Schema.String),
	requires: Schema.optional(Schema.Array(Schema.String)),
}) {}

/**
 * Schema for validating the structure of the entire plugin configuration, including metadata such as identifier, name, minimum required version of StudioCMS, dependencies on other plugins, and the hooks that the plugin implements. This schema ensures that the plugin configuration adheres to the expected structure, allowing for seamless integration of plugins into the StudioCMS system while providing necessary information about the plugin and its functionality.
 */
export class StudioCMSPluginSchema extends StudioCMSPluginBaseSchema.extend<StudioCMSPluginSchema>(
	'StudioCMSPluginSchema'
)({
	hooks: BasePluginHooksSchema,
}) {}

/**
 * Type definition for the StudioCMS plugin, representing the expected structure of the plugin configuration that plugins must adhere to in order to integrate with the StudioCMS system. This type definition ensures that any plugin implementation adheres to the expected structure and provides necessary information about the plugin and its functionality while maintaining compatibility with the overall StudioCMS system.
 */
export type StudioCMSPlugin = typeof StudioCMSPluginSchema.Type;

export type StudioCMSPluginDef = typeof StudioCMSPluginSchema.Encoded;

/**
 * Type definition for the parameters of a given plugin hook, allowing for the extraction of the expected parameters for a specific hook function that plugins can implement to integrate with various aspects of the StudioCMS system. This type definition ensures that any implementation of a plugin hook adheres to the expected structure and provides necessary functionality for integrating with the StudioCMS system while maintaining compatibility and security.
 *
 * @template Hook - The specific hook for which to extract parameters, defined as a key of the StudioCMSPlugin's hooks.
 * @template Fn - The type of the hook function, inferred from the StudioCMSPlugin's hooks based on the provided Hook key.
 */
export type PluginHookParameters<
	Hook extends keyof StudioCMSPlugin['hooks'],
	Fn = StudioCMSPlugin['hooks'][Hook],
	// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
> = Fn extends (...args: any) => any ? Parameters<Fn>[0] : never;

/**
 * Schema for validating the structure of the storage manager plugin configuration, including metadata such as identifier, name, minimum required version of StudioCMS, dependencies on other plugins, and the specific hooks related to storage management that the plugin implements. This schema extends the base plugin schema to include storage manager-specific hooks, ensuring that any implementation of a storage manager plugin adheres to the expected structure and provides necessary functionality for managing storage within the StudioCMS system while maintaining compatibility with the overall system.
 */
export class StudioCMSStorageManagerSchema extends StudioCMSPluginBaseSchema.extend<StudioCMSStorageManagerSchema>(
	'StudioCMSStorageManagerSchema'
)({
	hooks: StorageManagerPluginHooksSchema,
}) {}

/**
 * Type definition for the StudioCMS storage manager plugin, representing the expected structure of the plugin configuration that storage manager plugins must adhere to in order to integrate with the StudioCMS system. This type definition ensures that any implementation of a storage manager plugin adheres to the expected structure and provides necessary information about the plugin and its functionality while maintaining compatibility with the overall StudioCMS system.
 */
export type StudioCMSStorageManager = typeof StudioCMSStorageManagerSchema.Type;

export type StudioCMSStorageManagerDef = typeof StudioCMSStorageManagerSchema.Encoded;

/**
 * Type definition for the parameters of a given storage manager plugin hook, allowing for the extraction of the expected parameters for a specific storage manager hook function that plugins can implement to integrate with the storage management aspect of the StudioCMS system. This type definition ensures that any implementation of a storage manager plugin hook adheres to the expected structure and provides necessary functionality for integrating with the storage management system while maintaining compatibility and security.
 *
 * @template Hook - The specific storage manager hook for which to extract parameters, defined as a key of the StudioCMSStorageManagerPlugin's hooks.
 * @template Fn - The type of the hook function, inferred from the StudioCMSStorageManagerPlugin's hooks based on the provided Hook key.
 */
export type StorageManagerHookParameters<
	Hook extends keyof StudioCMSStorageManager['hooks'],
	Fn = StudioCMSStorageManager['hooks'][Hook],
	// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
> = Fn extends (...args: any) => any ? Parameters<Fn>[0] : never;

export type SafePluginListItemType = typeof SafePluginListItemSchema.Type;
export type SafePluginListType = typeof SafePluginListSchema.Type;

/**
 * Defines a plugin for StudioCMS.
 *
 * @param options - The configuration options for the plugin.
 * @returns The plugin configuration.
 */
export function definePlugin(options: StudioCMSPluginDef): StudioCMSPluginDef {
	return options;
}

/**
 * Defines a storage manager plugin for StudioCMS.
 *
 * @param options - The configuration options for the storage manager plugin.
 * @returns The storage manager plugin configuration.
 */
export function defineStorageManager(
	options: StudioCMSStorageManagerDef
): StudioCMSStorageManagerDef {
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
