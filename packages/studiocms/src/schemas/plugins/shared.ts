import { z } from 'astro/zod';

export const ValidationFunction = z.function().args(z.any()).returns(z.string().or(z.boolean()));

export const TransformFunction = z.function().args(z.any()).returns(z.any());

const StudioCMSColorway = z.enum(['primary', 'success', 'warning', 'danger', 'info', 'mono']);

const BaseFieldSchema = z.object({
	/**
	 * The name of the field used in the form submission data
	 */
	name: z.string(),
	/**
	 * The label of the field displayed in the form
	 */
	label: z.string(),
	/**
	 * Is the field required
	 */
	required: z.boolean().optional(),
	/**
	 * Is the field read only (disabled)
	 */
	readOnly: z.boolean().optional(),
});

const SupportsColorSchema = BaseFieldSchema.extend({
	color: StudioCMSColorway.optional(),
});

const SupportsPlaceHolderSchema = BaseFieldSchema.extend({
	placeholder: z.string().optional(),
});

const CheckboxFieldSchema = SupportsColorSchema.extend({
	input: z.literal('checkbox'),
	defaultChecked: z.boolean().optional(),
	size: z.enum(['sm', 'md', 'lg']).optional(),
});

const TextInputFieldSchema = SupportsPlaceHolderSchema.extend({
	input: z.literal('input'),
	type: z.enum(['text', 'password', 'email', 'number', 'tel', 'url', 'search']).optional(),
	defaultValue: z.string().optional(),
});

const TextAreaFieldSchema = SupportsPlaceHolderSchema.extend({
	input: z.literal('textarea'),
	defaultValue: z.string().optional(),
});

const SharedOptionsSchema = z.array(
	z.object({
		label: z.string(),
		value: z.string(),
		disabled: z.boolean().optional(),
	})
);

const RadioGroupFieldSchema = SupportsColorSchema.extend({
	input: z.literal('radio'),
	direction: z.enum(['horizontal', 'vertical']).optional(),
	defaultValue: z.string().optional(),
	options: SharedOptionsSchema,
});

const SelectFieldSchema = SupportsPlaceHolderSchema.extend({
	input: z.literal('select'),
	type: z.enum(['basic', 'search']).optional(),
	defaultValue: z.string().optional(),
	options: SharedOptionsSchema,
});

export const FieldSchema = z.union([
	CheckboxFieldSchema,
	TextInputFieldSchema,
	TextAreaFieldSchema,
	RadioGroupFieldSchema,
	SelectFieldSchema,
]);

const RowFieldSchema = BaseFieldSchema.extend({
	input: z.literal('row'),
	alignCenter: z.boolean().optional(),
	gapSize: z.enum(['sm', 'md', 'lg']).optional(),
	fields: z.lazy(() => FieldSchema.array()), // Recursive definition
});

export const SettingsFieldSchema = z.union([FieldSchema, RowFieldSchema]);

export type SettingsField = z.infer<typeof SettingsFieldSchema>;
