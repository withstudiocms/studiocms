import type { AstroIntegration } from 'astro';
import { z } from 'astro/zod';

// Common options for all fields
const DefaultSettingsFieldOptionsSchema = z.object({
	name: z.string(),
	label: z.string(),
	required: z.boolean().optional(),
	readOnly: z.boolean().optional(),
});

// Individual field types
const CheckboxSettingsFieldSchema = z.object({
	input: z.literal('checkbox'),
	description: z.string(),
});

const NumberSettingsFieldSchema = z.object({
	input: z.literal('number'),
	description: z.string(),
});

const RadioGroupSettingsFieldSchema = z.object({
	input: z.literal('radio'),
	options: z.array(
		z.object({
			label: z.string(),
			value: z.string(),
		})
	),
});

const SelectSettingsFieldSchema = z.object({
	input: z.literal('select'),
	options: z.array(
		z.object({
			label: z.string(),
			value: z.string(),
		})
	),
	hasMany: z.boolean().optional(),
});

const TextSettingsFieldSchema = z.object({
	input: z.literal('text'),
});

const SettingsFieldPreSchema = z.union([
	CheckboxSettingsFieldSchema,
	NumberSettingsFieldSchema,
	RadioGroupSettingsFieldSchema,
	SelectSettingsFieldSchema,
	TextSettingsFieldSchema,
]);

const RowSettingsFieldSchema = z.object({
	input: z.literal('row'),
	fields: z.lazy(() => SettingsFieldPreSchema.array()), // Recursive definition
});

const SettingsFieldSchema = z
	.union([SettingsFieldPreSchema, RowSettingsFieldSchema])
	.and(DefaultSettingsFieldOptionsSchema);

/**
 * Validation function. Takes in all the values and returns a string on error or true on success.
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ValidationFunction = (values: any) => string | true;

/**
 * Content Transform function. Takes in all the values and returns the modified values.
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ContentTransformFunction = (values: any) => any;

const StudioCMS_SettingsPageSchema = z
	.object({
		/**
		 * Fields according to specification
		 */
		fields: z.array(SettingsFieldSchema),
		/**
		 * Validation function that runs on save
		 */
		validate: z.custom<ValidationFunction>(),
	})
	.optional();

const StudioCMS_PageTypeSchema = z
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
			 * A function that takes in all basic info & the page content and gets to modify it. `any` type for visualization purposes.
			 */
			contentTransform: z.custom<ContentTransformFunction>(),
			/**
			 * The path to the actual component that is displayed for the page content
			 */
			pageContent: z.string(),
		})
	)
	.optional();

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
	 * If this exists, the plugin will have its own setting page
	 */
	settingsPage: StudioCMS_SettingsPageSchema,
	/**
	 * Page Type definition. If this is present, the plugin wants to be able to modify the page creation process
	 */
	pageType: StudioCMS_PageTypeSchema,
	/**
	 * Astro Integration
	 */
	integration: z.array(z.custom<AstroIntegration>()).or(z.custom<AstroIntegration>()),
	/**
	 * Navigation Links for the frontend
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

export type SafePluginListType = Omit<StudioCMSPluginOptions, 'integration'>[];
