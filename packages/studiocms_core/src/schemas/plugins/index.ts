import type { AstroIntegration } from 'astro';
import { z } from 'astro/zod';
import { StudioCMS_PageTypesSchema } from './pageType';
import { StudioCMS_SettingsPageSchema } from './settingsPage';

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
	 * If this exists, the plugin will have its own setting page
	 */
	settingsPage: StudioCMS_SettingsPageSchema,
	/**
	 * Page Type definition. If this is present, the plugin wants to be able to modify the page creation process
	 */
	pageTypes: StudioCMS_PageTypesSchema,
	/**
	 * Astro Integration
	 */
	integration: z.array(z.custom<AstroIntegration>()).or(z.custom<AstroIntegration>()),
	/**
	 * Navigation Links for use with the `@studiocms/frontend` package to display links in the frontend
	 */
	frontendNavigationLinks: z
		.array(
			z.object({
				label: z.string(),
				href: z.string(),
			})
		)
		.optional(),
});

export type StudioCMSPluginInput = typeof StudioCMSPluginSchema._input;
export type StudioCMSPluginOptions = typeof StudioCMSPluginSchema._output;

// Utility type for internal use
export type SafePluginListType = Omit<
	StudioCMSPluginOptions,
	'integration' | 'studiocmsMinimumVersion'
>[];
