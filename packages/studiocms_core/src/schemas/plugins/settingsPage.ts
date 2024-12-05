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

export const StudioCMS_SettingsPageSchema = z
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
	})
	.optional();
