import { z } from 'astro/zod';
import { overridesSchema } from './componentoverrides';
import { dashboardConfigSchema } from './dashboard';
import { DefaultFrontEndConfigSchema } from './defaultFrontend';
import { imageServiceSchema } from './imageService';
import { includedIntegrationsSchema } from './integrations';
import {
	type CustomRenderer,
	type Renderer,
	type StudioCMSRendererConfig,
	StudioCMSRendererConfigSchema,
} from './rendererConfig';

//
// Exported Schemas for use in other internal packages
//
export {
	StudioCMSRendererConfigSchema,
	type StudioCMSRendererConfig,
	type CustomRenderer,
	type Renderer,
};
export { dashboardConfigSchema, DefaultFrontEndConfigSchema, imageServiceSchema, overridesSchema };

//
// MAIN SCHEMA
//
export const StudioCMSOptionsSchema = z
	.object({
		/**
		 * Project Initialization Page - Used during First Time Setup to initialize the database
		 *
		 * @default true
		 */
		dbStartPage: z.boolean().optional().default(true),
		/**
		 * Renderer Configuration
		 *
		 * Allows customization of the current renderer being used
		 */
		rendererConfig: StudioCMSRendererConfigSchema,
		/**
		 * Allows customization of the Image Service Options
		 */
		imageService: imageServiceSchema,
		/**
		 * Default Frontend Configuration
		 */
		defaultFrontEndConfig: DefaultFrontEndConfigSchema,
		/**
		 * Allows customization of the Dashboard Configuration
		 *
		 * Coming soon....
		 */
		dashboardConfig: dashboardConfigSchema,
		/**
		 * Allows enabling and disabling of the included integrations
		 */
		includedIntegrations: includedIntegrationsSchema,
		/**
		 * Date Locale used for formatting dates
		 */
		dateLocale: z.string().optional().default('en-us'),
		/**
		 * Component Overrides - Allows for customizing the components used in StudioCMS
		 */
		overrides: overridesSchema,
		/**
		 * Whether to show verbose output
		 * @default false
		 */
		verbose: z.boolean().optional().default(false),
	})
	.optional()
	.default({});

export type StudioCMSOptions = typeof StudioCMSOptionsSchema._input;
export type StudioCMSConfig = typeof StudioCMSOptionsSchema._output;
