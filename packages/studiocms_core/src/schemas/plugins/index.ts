import type { AstroIntegration } from 'astro';
import { z } from 'astro/zod';
import { SettingsFieldSchema, TransformFunction, ValidationFunction } from './shared';

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
	integration: z.union([z.custom<AstroIntegration>(), z.array(z.custom<AstroIntegration>())]),
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
			 * Validation function that runs on save
			 */
			validate: ValidationFunction,
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
				 * Description that is shown below the "Page Content" header if this type is selected
				 */
				description: z.string().optional(),
				/**
				 * Fields that are shown in the page creation form
				 */
				fields: z
					.object({
						/**
						 * Fields according to specification
						 */
						fields: z.array(SettingsFieldSchema),
						/**
						 * Database Conversion function that runs on save after validation
						 */
						transform: TransformFunction,
						/**
						 * AstroDB Table to store the data in
						 *
						 * @example
						 * ```ts
						 * import { asDrizzleTable } from '@astrojs/db/utils';
						 * import { myTable } from '../dbTables';
						 *
						 * {
						 * table: asDrizzleTable('myTable', myTable),
						 * }
						 */
						// TODO: Figure out a way to type this
						table: z.any(),
					})
					.optional(),
				/**
				 * A function that takes in all basic info & the page content and gets to modify it. `any` type for visualization purposes.
				 */
				contentTransform: z
					.object({
						/**
						 * Content Transform function. Takes in all the values and returns the modified values to be stored in the database.
						 */
						transform: TransformFunction,
						/**
						 * AstroDB Table to store the data in
						 *
						 * @example
						 * ```ts
						 * import { asDrizzleTable } from '@astrojs/db/utils';
						 * import { myTable } from '../dbTables';
						 *
						 * {
						 * table: asDrizzleTable('myTable', myTable),
						 * }
						 */
						// TODO: Figure out a way to type this
						table: z.any(),
					})
					.optional(),
				/**
				 * The path to the actual component that is displayed for the page content
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
				 *
				 */
				pageContentComponent: z.string().optional(),
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
