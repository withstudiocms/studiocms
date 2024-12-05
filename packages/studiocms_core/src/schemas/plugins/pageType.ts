import { z } from 'astro/zod';

// Common options for all fields
export const DefaultSettingsFieldOptionsSchema = z.object({
	name: z.string(),
	label: z.string(),
	required: z.boolean().optional(),
	readOnly: z.boolean().optional(),
});

// Individual field types
export const CheckboxSettingsFieldSchema = z.object({
	input: z.literal('checkbox'),
	description: z.string(),
});

export const NumberSettingsFieldSchema = z.object({
	input: z.literal('number'),
	description: z.string(),
});

export const RadioGroupSettingsFieldSchema = z.object({
	input: z.literal('radio'),
	options: z.array(
		z.object({
			label: z.string(),
			value: z.string(),
		})
	),
});

export const SelectSettingsFieldSchema = z.object({
	input: z.literal('select'),
	options: z.array(
		z.object({
			label: z.string(),
			value: z.string(),
		})
	),
	hasMany: z.boolean().optional(),
});

export const TextSettingsFieldSchema = z.object({
	input: z.literal('text'),
});

export const SettingsFieldPreSchema = z.union([
	CheckboxSettingsFieldSchema,
	NumberSettingsFieldSchema,
	RadioGroupSettingsFieldSchema,
	SelectSettingsFieldSchema,
	TextSettingsFieldSchema,
]);

export const RowSettingsFieldSchema = z.object({
	input: z.literal('row'),
	fields: z.lazy(() => SettingsFieldPreSchema.array()), // Recursive definition
});

export const SettingsFieldSchema = z
	.union([SettingsFieldPreSchema, RowSettingsFieldSchema])
	.and(DefaultSettingsFieldOptionsSchema);

export const StudioCMS_PageTypeFieldSchema = z
	.object({
		/**
		 * Fields according to specification
		 */
		fields: z.array(SettingsFieldSchema),
		/**
		 * Validation function that runs on save
		 */
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		validate: z.custom<(values: any) => string | true>(),
		/**
		 * Database Conversion function that runs on save after validation
		 */
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		transform: z.custom<(values: any) => any>(),
		/**
		 * AstroDB Table to store the data in
		 *
		 * @example
		 * ```ts
		 * import { asDrizzleTable } from '@astrojs/db/utils';
		 * import { myTable } from '../dbtables';
		 *
		 * {
		 * table: asDrizzleTable('myTable', myTable),
		 * }
		 */
		// TODO: Figure out a way to type this
		table: z.any(),
	})
	.optional();

export const StudioCMS_ContentTransformSchema = z
	.object({
		/**
		 * Content Transform function. Takes in all the values and returns the modified values to be stored in the database.
		 */
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		transform: z.custom<(values: any) => any>(),
		/**
		 * AstroDB Table to store the data in
		 *
		 * @example
		 * ```ts
		 * import { asDrizzleTable } from '@astrojs/db/utils';
		 * import { myTable } from '../dbtables';
		 *
		 * {
		 * table: asDrizzleTable('myTable', myTable),
		 * }
		 */
		// TODO: Figure out a way to type this
		table: z.any(),
	})
	.optional();

export const StudioCMS_PageTypesSchema = z
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
			fields: StudioCMS_PageTypeFieldSchema,
			/**
			 * A function that takes in all basic info & the page content and gets to modify it. `any` type for visualization purposes.
			 */
			contentTransform: StudioCMS_ContentTransformSchema,
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
	.optional();
