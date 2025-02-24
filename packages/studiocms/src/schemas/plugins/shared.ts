import { z } from 'astro/zod';

export const ValidationFunction = z.function().args(z.any()).returns(z.string().or(z.boolean()));

export const TransformFunction = z.function().args(z.any()).returns(z.any());

const StudioCMSColorway = z.enum(['primary', 'success', 'warning', 'danger', 'info', 'mono']);

/**
 * Schema for a base field.
 *
 * This schema includes the following properties:
 * - `name`: The name of the field used in the form submission data.
 * - `label`: The label of the field displayed in the form.
 * - `required`: A boolean indicating whether the field is required.
 * - `readOnly`: A boolean indicating whether the field is read-only (disabled).
 */
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

/**
 * Schema for a field that supports a colorway.
 *
 * This schema extends the `BaseFieldSchema` and includes the following properties:
 * - `color`: An optional enum specifying the colorway of the field. Possible values are 'primary', 'success', 'warning', 'danger', 'info', and 'mono'.
 */
const SupportsColorSchema = BaseFieldSchema.extend({
	color: StudioCMSColorway.optional(),
});

/**
 * Schema for a field that supports a placeholder.
 *
 * This schema extends the `BaseFieldSchema` and includes the following properties:
 * - `placeholder`: An optional string representing the placeholder text for the field.
 */
const SupportsPlaceHolderSchema = BaseFieldSchema.extend({
	placeholder: z.string().optional(),
});

/**
 * Schema for a checkbox field.
 *
 * This schema extends the `SupportsColorSchema` and includes the following properties:
 * - `input`: A literal string 'checkbox' indicating the type of input field.
 * - `defaultChecked`: An optional boolean indicating whether the checkbox is checked by default.
 * - `size`: An optional enum specifying the size of the checkbox. Possible values are 'sm', 'md', and 'lg'.
 */
const CheckboxFieldSchema = SupportsColorSchema.extend({
	input: z.literal('checkbox'),
	defaultChecked: z.boolean().optional(),
	size: z.enum(['sm', 'md', 'lg']).optional(),
});

/**
 * Schema for a text input field.
 *
 * This schema extends the `SupportsPlaceHolderSchema` and includes the following properties:
 * - `input`: A literal string 'input' indicating the type of input field.
 * - `type`: An optional enum specifying the type of the input field. Possible values are 'text', 'password', 'email', 'number', 'tel', 'url', and 'search'.
 * - `defaultValue`: An optional string representing the default value of the input field.
 */
const TextInputFieldSchema = SupportsPlaceHolderSchema.extend({
	input: z.literal('input'),
	type: z.enum(['text', 'password', 'email', 'number', 'tel', 'url', 'search']).optional(),
	defaultValue: z.string().optional(),
});

/**
 * Schema for a text area field.
 *
 * This schema extends the `SupportsPlaceHolderSchema` and includes the following properties:
 * - `input`: A literal string 'textarea' indicating the type of input field.
 * - `defaultValue`: An optional string representing the default value of the text area.
 */
const TextAreaFieldSchema = SupportsPlaceHolderSchema.extend({
	input: z.literal('textarea'),
	defaultValue: z.string().optional(),
});

/**
 * Schema for shared options.
 *
 * This schema defines an array of objects, where each object represents an option with the following properties:
 * - `label`: A string representing the label of the option.
 * - `value`: A string representing the value of the option.
 * - `disabled`: An optional boolean indicating whether the option is disabled.
 */
const SharedOptionsSchema = z.array(
	z.object({
		label: z.string(),
		value: z.string(),
		disabled: z.boolean().optional(),
	})
);

/**
 * Schema for a radio group field.
 *
 * This schema extends the SupportsColorSchema and includes additional properties
 * specific to a radio group field.
 *
 * @property {string} input - Must be the literal string 'radio'.
 * @property {'horizontal' | 'vertical'} [direction] - Optional direction of the radio group, can be either 'horizontal' or 'vertical'.
 * @property {string} [defaultValue] - Optional default value for the radio group.
 * @property {SharedOptionsSchema} options - Options for the radio group, defined by the SharedOptionsSchema.
 */
const RadioGroupFieldSchema = SupportsColorSchema.extend({
	input: z.literal('radio'),
	direction: z.enum(['horizontal', 'vertical']).optional(),
	defaultValue: z.string().optional(),
	options: SharedOptionsSchema,
});

/**
 * Schema for a select field, extending the SupportsPlaceHolderSchema.
 *
 * @extends SupportsPlaceHolderSchema
 *
 * @property {z.Literal<'select'>} input - Specifies that the input type is 'select'.
 * @property {z.ZodOptional<z.ZodEnum<['basic', 'search']>>} type - Optional type of the select field, can be 'basic' or 'search'.
 * @property {z.ZodOptional<z.ZodString>} defaultValue - Optional default value for the select field.
 * @property {SharedOptionsSchema} options - Schema for the options available in the select field.
 */
const SelectFieldSchema = SupportsPlaceHolderSchema.extend({
	input: z.literal('select'),
	type: z.enum(['basic', 'search']).optional(),
	defaultValue: z.string().optional(),
	options: SharedOptionsSchema,
});

/**
 * A union schema that represents different types of field schemas.
 * This schema can be one of the following:
 * - CheckboxFieldSchema
 * - TextInputFieldSchema
 * - TextAreaFieldSchema
 * - RadioGroupFieldSchema
 * - SelectFieldSchema
 */
export const FieldSchema = z.union([
	CheckboxFieldSchema,
	TextInputFieldSchema,
	TextAreaFieldSchema,
	RadioGroupFieldSchema,
	SelectFieldSchema,
]);

/**
 * Schema definition for a row field.
 *
 * This schema extends the BaseFieldSchema and includes additional properties specific to a row field.
 *
 * Properties:
 * - `input`: A literal type with the value 'row'.
 * - `alignCenter`: An optional boolean indicating whether the row should be center-aligned.
 * - `gapSize`: An optional enum specifying the gap size between fields. Possible values are 'sm', 'md', and 'lg'.
 * - `fields`: A lazy-loaded array of FieldSchema, allowing for recursive field definitions.
 */
const RowFieldSchema = BaseFieldSchema.extend({
	input: z.literal('row'),
	alignCenter: z.boolean().optional(),
	gapSize: z.enum(['sm', 'md', 'lg']).optional(),
	fields: z.lazy(() => FieldSchema.array()), // Recursive definition
});

/**
 * A schema that represents the settings field.
 * It is a union of `FieldSchema` and `RowFieldSchema`.
 */
export const SettingsFieldSchema = z.union([FieldSchema, RowFieldSchema]);

/**
 * Represents the type inferred from the `SettingsFieldSchema` schema.
 *
 * This type is used to define the structure of settings fields within the application.
 */
export type SettingsField = z.infer<typeof SettingsFieldSchema>;

/**
 * Schema for a base dashboard page props.
 *
 * This schema includes the following properties:
 * - `title`: The title of the dashboard page.
 * - `description`: The description of the dashboard page.
 * - `requiredPermissions`: A string literal representing the required permissions to access the page.
 * - `pageHeaderComponent`: The component to render in the page header.
 * - `pageBodyComponent`: The component to render in the page body.
 */
const BaseDashboardPagePropsSchema = z.object({
	title: z.string(),
	description: z.string(),
	requiredPermissions: z
		.union([
			z.literal('owner'),
			z.literal('admin'),
			z.literal('editor'),
			z.literal('visitor'),
			z.literal('none'),
		])
		.default('none')
		.optional(),
	pageHeaderComponent: z.string(),
	pageBodyComponent: z.string(),
});

const AvailableBaseSchema = BaseDashboardPagePropsSchema.extend({
	slug: z.string(),
});

const FinalBaseSchema = AvailableBaseSchema.extend({
	components: z.object({
		PageHeaderComponent: z.any(),
		PageBodyComponent: z.any(),
		InnerSidebarComponent: z.any().optional(),
	}),
});

/**
 * Schema for a single sidebar dashboard page.
 *
 * This schema extends the `BaseDashboardPagePropsSchema` and includes the following properties:
 * - `sidebar`: A literal string 'single' indicating a single sidebar layout.
 */
const SingleSidebarSchema = BaseDashboardPagePropsSchema.extend({
	sidebar: z.literal('single'),
});

const AvailableSingleSchema = AvailableBaseSchema.extend({
	sidebar: z.literal('single'),
});

const FinalSingleSchema = FinalBaseSchema.extend({
	sidebar: z.literal('single'),
});

/**
 * Schema for a double sidebar dashboard page.
 *
 * This schema extends the `BaseDashboardPagePropsSchema` and includes the following properties:
 * - `sidebar`: A literal string 'double' indicating a double sidebar layout.
 * - `innerSidebarComponent`: The component to render in the inner sidebar.
 */
const DoubleSidebarSchema = BaseDashboardPagePropsSchema.extend({
	sidebar: z.literal('double'),
	innerSidebarComponent: z.string(),
});

const AvailableDoubleSchema = AvailableBaseSchema.extend({
	sidebar: z.literal('double'),
	innerSidebarComponent: z.string(),
});

const FinalDoubleSchema = FinalBaseSchema.extend({
	sidebar: z.literal('double'),
	innerSidebarComponent: z.string(),
});

/**
 * A union schema that represents different types of dashboard page schemas.
 * This schema can be one of the following:
 * - SingleSidebarSchema
 * - DoubleSidebarSchema
 */
export const DashboardPageSchema = z.union([SingleSidebarSchema, DoubleSidebarSchema]);

export const AvailableDashboardBaseSchema = z.union([AvailableSingleSchema, AvailableDoubleSchema]);

export const FinalDashboardBaseSchema = z.union([FinalSingleSchema, FinalDoubleSchema]);

export const AvailableDashboardPagesSchema = z.object({
	user: z.array(AvailableDashboardBaseSchema).optional(),
	admin: z.array(AvailableDashboardBaseSchema).optional(),
});

/**
 * Represents the type inferred from the `DashboardPageSchema` schema.
 *
 * This type is used to define the structure of dashboard pages within the application.
 */
export type DashboardPage = z.infer<typeof DashboardPageSchema>;

export type AvailableDashboardPages = z.infer<typeof AvailableDashboardPagesSchema>;

export type FinalDashboardPage = z.infer<typeof FinalDashboardBaseSchema>;
