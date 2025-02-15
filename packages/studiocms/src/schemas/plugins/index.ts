import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import type { ColumnDataType } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import { SettingsFieldSchema, TransformFunction, ValidationFunction } from './shared.js';

export interface AstroIntegration {
	/** The name of the integration. */
	name: string;
	/** The different hooks available to extend. */
	hooks: {
		[K in keyof Astro.IntegrationHooks]?: Astro.IntegrationHooks[K];
	} & Partial<Record<string, unknown>>;
}

type AsDrizzleTable = SQLiteTableWithColumns<{
	name: string;
	schema: undefined;
	columns: {
		[x: string]: SQLiteColumn<
			{
				name: string;
				tableName: string;
				dataType: ColumnDataType;
				columnType: string;
				data: unknown;
				driverParam: unknown;
				notNull: false;
				hasDefault: false;
				enumValues: string[] | undefined;
				baseColumn: never;
			},
			object
		>;
	};
	dialect: 'sqlite';
}>;

const DrizzleTableSchema = z.custom<{ name: string; table: AsDrizzleTable }>();

const AstroIntegrationSchema = z.custom<AstroIntegration>();

const AstroIntegrationPossiblyArraySchema = z.union([
	AstroIntegrationSchema,
	z.array(AstroIntegrationSchema),
]);

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
			onSave: z.custom<APIRoute>(),
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

				// TODO: Figure out the best way to handle more complex plugin systems...
				// Ideally, we would want to be able to handle the following cases:
				// - Single page type per plugin
				// - Multiple page types per plugin
				// - Advanced page types with custom fields, content transforms, and page content components
				// - Page types that are stored in different tables
				// - Page types that have different content transforms
				// - Page types that have different page content components
				// - Page types that have different fields
				// - Page types that have different validation functions
				// - Page types that have different database conversion functions

				// /**
				//  * Fields that are shown in the page creation form
				//  */
				// fields: z
				// 	.object({
				// 		/**
				// 		 * Fields according to specification
				// 		 */
				// 		fields: z.array(SettingsFieldSchema),
				// 		/**
				// 		 * Database Conversion function that runs on save after validation
				// 		 */
				// 		transform: TransformFunction,
				// 		/**
				// 		 * AstroDB Table to store the data in
				// 		 *
				// 		 * @example
				// 		 * ```ts
				// 		 * import { myTable } from '../dbTables';
				// 		 *
				// 		 * {
				// 		 * table: { name: 'myTable', table: myTable },
				// 		 * }
				// 		 */
				// 		table: DrizzleTableSchema,
				// 	})
				// 	.optional(),
				// /**
				//  * A function that takes in all basic info & the page content and gets to modify it. `any` type for visualization purposes.
				//  */
				// contentTransform: z
				// 	.object({
				// 		/**
				// 		 * Content Transform function. Takes in all the values and returns the modified values to be stored in the database.
				// 		 */
				// 		transform: TransformFunction,
				// 		/**
				// 		 * AstroDB Table to store the data in
				// 		 *
				// 		 * @example
				// 		 * ```ts
				// 		 * import { myTable } from '../dbTables';
				// 		 *
				// 		 * {
				// 		 * table: { name: 'myTable', table: myTable },
				// 		 * }
				// 		 */
				// 		table: DrizzleTableSchema,
				// 	})
				// 	.optional(),
				// /**
				//  * The path to the actual component that is displayed for the page content
				//  *
				//  * @example
				//  * ```ts
				//  * import { createResolver } from 'astro-integration-kit';
				//  * const { resolve } = createResolver(import.meta.url)
				//  *
				//  * {
				//  *  pageContentComponent: resolve('./components/MyContentEditor.astro'),
				//  * }
				//  * ```
				//  *
				//  */
				// pageContentComponent: z.string().optional(),
			})
		)
		.optional(),
});

export const SafePluginListItemSchema = StudioCMSPluginSchema.omit({
	integration: true,
	studiocmsMinimumVersion: true,
});

export const SafePluginListSchema = z.array(SafePluginListItemSchema);

export type StudioCMSPluginOptions = z.infer<typeof StudioCMSPluginSchema>;
export type SafePluginListItemType = z.infer<typeof SafePluginListItemSchema>;
export type SafePluginListType = z.infer<typeof SafePluginListSchema>;
export interface StudioCMSPlugin extends StudioCMSPluginOptions {}
export type { SettingsField } from './shared.js';

/**
 * Defines a plugin for StudioCMS.
 *
 * @param options - The configuration options for the plugin.
 * @returns The plugin configuration.
 */
export function definePlugin(options: StudioCMSPluginOptions): StudioCMSPlugin {
	return options;
}
