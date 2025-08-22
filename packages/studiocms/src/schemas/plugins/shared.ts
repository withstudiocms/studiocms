import type { HeroIconName } from '@studiocms/ui/components/Icon/iconType.js';
import type { AstroIntegration } from 'astro';
import { z } from 'astro/zod';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';
import { type UiTranslationKey, uiTranslationsAvailable } from '../../virtuals/i18n/config.js';

// https://github.com/withastro/astro/blob/910eb00fe0b70ca80bd09520ae100e8c78b675b5/packages/astro/src/core/config/schema.ts#L113
export const astroIntegrationSchema = z.object({
	name: z.string(),
	hooks: z.object({}).passthrough().default({}),
}) as z.Schema<AstroIntegration>;

// export const ValidationFunction = z.function().args(z.any()).returns(z.string().or(z.boolean()));

// export const TransformFunction = z.function().args(z.any()).returns(z.any());

/**
 * Schema for a StudioCMS colorway.
 */
export const StudioCMSColorway = z.enum([
	'primary',
	'success',
	'warning',
	'danger',
	'info',
	'mono',
]);

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
 * Allowed keys for UI translations.
 */
const allowedKeys = Object.keys(uiTranslationsAvailable);

/**
 * A custom schema for i18n label translations.
 */
export const i18nLabelSchema = z.custom<Record<UiTranslationKey, string>>(
	(value: Record<UiTranslationKey, string>) => {
		const keys = Object.keys(value);

		for (const key of keys) {
			if (!allowedKeys.includes(key)) {
				return false;
			}
		}

		return true;
	},
	{
		message: `Invalid i18n label translations, currently support translations: ${allowedKeys.join(', ')}.`,
	}
);

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
	/**
	 * The title of the dashboard page
	 */
	title: i18nLabelSchema,
	/**
	 * The description of the dashboard page
	 */
	description: z.string(),
	/**
	 * The desired route of the dashboard page
	 */
	route: z.string(),
	/**
	 * The icon to display in the sidebar
	 *
	 * @default 'cube-transparent'
	 * @optional
	 */
	icon: z.custom<HeroIconName>().default('cube-transparent').optional(),
	/**
	 * The required permissions to access the page
	 */
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
	/**
	 * The component to render in the page header to display action buttons
	 */
	pageActionsComponent: z.string().optional(),
	/**
	 * The component to render in the page body
	 */
	pageBodyComponent: z.string(),
});

/**
 * Schema for a base dashboard page props.
 *
 * This schema extends the `BaseDashboardPagePropsSchema` and includes the following properties:
 * - `slug`: The slug of the dashboard page.
 */
const AvailableBaseSchema = BaseDashboardPagePropsSchema.extend({
	/**
	 * The slug of the dashboard page
	 */
	slug: z.string(),
});

/**
 * Schema for a custom Astro component.
 */
// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
const AstroComponentSchema = z.custom<(_props: any) => any>();

/**
 * Schema for a base dashboard page props.
 *
 * This schema extends the `AvailableBaseSchema` and includes the following properties:
 * - `components`: An object containing the components to render in the dashboard page.
 */
const FinalBaseSchema = AvailableBaseSchema.extend({
	components: z.object({
		PageActionsComponent: AstroComponentSchema.optional(),
		PageBodyComponent: AstroComponentSchema,
		InnerSidebarComponent: AstroComponentSchema.optional(),
	}),
});

/**
 * Schema for a single sidebar dashboard page.
 *
 * This schema extends the `BaseDashboardPagePropsSchema` and includes the following properties:
 * - `sidebar`: A literal string 'single' indicating a single sidebar layout.
 */
const SingleSidebarSchema = BaseDashboardPagePropsSchema.extend({
	/**
	 * The sidebar layout
	 */
	sidebar: z.literal('single'),
});

/**
 * Schema for a single sidebar dashboard page.
 *
 * This schema extends the `AvailableBaseSchema` and includes the following properties:
 * - `sidebar`: A literal string 'single' indicating a single sidebar layout.
 */
const AvailableSingleSchema = AvailableBaseSchema.extend({
	/**
	 * The sidebar layout
	 */
	sidebar: z.literal('single'),
});

/**
 * Schema for a single sidebar dashboard page.
 *
 * This schema extends the `FinalBaseSchema` and includes the following properties:
 * - `sidebar`: A literal string 'single' indicating a single sidebar layout.
 */
const FinalSingleSchema = FinalBaseSchema.extend({
	/**
	 * The sidebar layout
	 */
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
	/**
	 * The sidebar layout
	 */
	sidebar: z.literal('double'),
	/**
	 * The component to render in the inner sidebar
	 */
	innerSidebarComponent: z.string(),
});

/**
 * Schema for a double sidebar dashboard page.
 *
 * This schema extends the `AvailableBaseSchema` and includes the following properties:
 * - `sidebar`: A literal string 'double' indicating a double sidebar layout.
 * - `innerSidebarComponent`: The component to render in the inner sidebar.
 */
const AvailableDoubleSchema = AvailableBaseSchema.extend({
	/**
	 * The sidebar layout
	 */
	sidebar: z.literal('double'),
	/**
	 * The component to render in the inner sidebar
	 */
	innerSidebarComponent: z.string(),
});

/**
 * Schema for a double sidebar dashboard page.
 *
 * This schema extends the `FinalBaseSchema` and includes the following properties:
 * - `sidebar`: A literal string 'double' indicating a double sidebar layout.
 * - `innerSidebarComponent`: The component to render in the inner sidebar.
 */
const FinalDoubleSchema = FinalBaseSchema.extend({
	/**
	 * The sidebar layout
	 */
	sidebar: z.literal('double'),
	/**
	 * The component to render in the inner sidebar
	 */
	innerSidebarComponent: z.string(),
});

/**
 * A union schema that represents different types of dashboard page schemas.
 * This schema can be one of the following:
 * - SingleSidebarSchema
 * - DoubleSidebarSchema
 */
export const DashboardPageSchema = z.union([SingleSidebarSchema, DoubleSidebarSchema]);

/**
 * A union schema that represents different types of available dashboard base schemas.
 * This schema can be one of the following:
 * - AvailableSingleSchema
 * - AvailableDoubleSchema
 */
export const AvailableDashboardBaseSchema = z.union([AvailableSingleSchema, AvailableDoubleSchema]);

/**
 * A union schema that represents different types of final dashboard base schemas.
 * This schema can be one of the following:
 * - FinalSingleSchema
 * - FinalDoubleSchema
 */
export const FinalDashboardBaseSchema = z.union([FinalSingleSchema, FinalDoubleSchema]);

/**
 * Schema for an array of available dashboard pages.
 *
 * This schema defines an object with the following properties:
 * - `user`: An optional array of `AvailableDashboardBaseSchema` representing the available dashboard pages for users.
 * - `admin`: An optional array of `AvailableDashboardBaseSchema` representing the available dashboard pages for admins.
 */
export const AvailableDashboardPagesSchema = z.object({
	/**
	 * Available dashboard pages for users
	 */
	user: z.array(AvailableDashboardBaseSchema).optional(),
	/**
	 * Available dashboard pages for admins
	 */
	admin: z.array(AvailableDashboardBaseSchema).optional(),
});

export type PageTypeDefaultsOrStringT = 'studiocms/markdown' | 'studiocms/html';

export const PageTypeDefaultsOrString = z
	.enum(['studiocms/markdown', 'studiocms/html'])
	.or(z.string());

export const SettingsPageSchema = z
	.object({
		/**
		 * Fields according to specification
		 */
		fields: z.array(SettingsFieldSchema),

		/**
		 * The endpoint for the settings
		 *
		 * Should export a APIRoute named `onSave` that runs when the settings page is saved
		 */
		endpoint: z.string(),
	})
	.optional();

export const FrontendNavigationLinksSchema = z
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
	.optional();

export const PageTypesSchema = z
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

			/**
			 * The path to the actual component that is displayed for the page content
			 *
			 * Component should have a `content` prop that is a string to be able to display current content.
			 *
			 * **NOTE:** If you storing a single string in the database, you can use the form name `page-content` for the content output. and it will be stored in the normal `content` field in the database.
			 * You can also use the apiEndpoints to create custom endpoints for the page type.
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
			 */
			pageContentComponent: PageTypeDefaultsOrString.or(z.string()).optional(),

			/**
			 * The path to the actual component that is displayed for the page renderer
			 */
			rendererComponent: PageTypeDefaultsOrString.or(z.string()).optional(),

			/**
			 * Fields that are shown in the page metadata tab when creating or editing a page of this type
			 */
			fields: z.array(SettingsFieldSchema).optional(),

			/**
			 * API Endpoint file for the page type
			 *
			 * API endpoints are used to create, edit, and delete pages of this type,
			 * endpoints will be provided the full Astro APIContext from the Astro APIRoute.
			 *
			 * File should export at least one of the following:
			 * - `onCreate`
			 * - `onEdit`
			 * - `onDelete`
			 *
			 * @example
			 * ```ts
			 * // my-plugin.ts
			 * import { createResolver } from 'astro-integration-kit';
			 * const { resolve } = createResolver(import.meta.url)
			 *
			 * {
			 *  apiEndpoint: resolve('./api/pageTypeApi.ts'),
			 * }
			 *
			 * // api/pageTypeApi.ts
			 * import { APIRoute } from 'astro';
			 *
			 * export const onCreate: APIRoute = async (context) => {
			 *   // Custom logic here
			 *   return new Response();
			 * }
			 * ```
			 */
			apiEndpoint: z.string().optional(),
		})
	)
	.optional();

/**
 * Represents the type inferred from the `DashboardPageSchema` schema.
 *
 * This type is used to define the structure of dashboard pages within the application.
 */
export type DashboardPage = typeof DashboardPageSchema._input;

/**
 * Represents the type inferred from the `AvailableDashboardBaseSchema` schema.
 *
 * This type is used to define the structure of available dashboard pages within the application.
 */
export type AvailableDashboardPages = typeof AvailableDashboardPagesSchema._output;

/**
 * Represents the type inferred from the `FinalDashboardBaseSchema` schema.
 *
 * This type is used to define the structure of final dashboard pages within the application.
 */
export type FinalDashboardPage = typeof FinalDashboardBaseSchema._output;

/**
 * Represents the input for a grid item in the dashboard.
 */
export interface GridItemInput {
	/**
	 * The name of the grid item.
	 */
	name: string;

	/**
	 * The span of the grid item, which can be 1, 2, or 3.
	 */
	span: 1 | 2 | 3;

	/**
	 * The variant of the grid item, which can be 'default' or 'filled'.
	 */
	variant: 'default' | 'filled';

	/**
	 * The required permission level to view the grid item.
	 * Optional. Can be 'owner', 'admin', 'editor', or 'visitor'.
	 */
	requiresPermission?: 'owner' | 'admin' | 'editor' | 'visitor';

	/**
	 * The header of the grid item.
	 * Optional.
	 */
	header?: {
		/**
		 * The title of the header.
		 */
		title: string;

		/**
		 * The icon of the header.
		 * Optional.
		 */
		icon?: HeroIconName;
	};

	/**
	 * The body of the grid item.
	 * Optional.
	 */
	body?: {
		/**
		 * The HTML content of the body.
		 */
		html: string;

		/**
		 * The components within the body.
		 * Optional.
		 */
		components?: Record<string, string>;

		/**
		 * The options for sanitizing the HTML content.
		 * Optional.
		 */
		sanitizeOpts?: SanitizeOptions;
	};
}

/**
 * Represents an item that can be used in a dashboard grid.
 */
export interface GridItemUsable {
	/**
	 * The name of the grid item.
	 */
	name: string;

	/**
	 * The span of the grid item, which can be 1, 2, or 3.
	 */
	span: 1 | 2 | 3;

	/**
	 * The variant of the grid item, which can be 'default' or 'filled'.
	 */
	variant: 'default' | 'filled';

	/**
	 * Optional. The permission required to use the grid item.
	 * Can be 'owner', 'admin', 'editor', or 'visitor'.
	 */
	requiresPermission?: 'owner' | 'admin' | 'editor' | 'visitor';

	/**
	 * Optional. The header of the grid item.
	 */
	header?: {
		/**
		 * The title of the header.
		 */
		title: string;

		/**
		 * Optional. The icon of the header.
		 */
		icon?: HeroIconName;
	};

	/**
	 * Optional. The body of the grid item.
	 */
	body?: {
		/**
		 * The HTML content of the body.
		 */
		html: string;

		/**
		 * Optional. The components of the body.
		 *
		 */
		// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
		components?: Record<string, any>;

		/**
		 * Optional. The options for sanitizing the HTML content.
		 */
		sanitizeOpts?: SanitizeOptions;
	};
}

/**
 * Represents an item in the dashboard grid.
 * Extends the properties of `GridItemUsable` and adds an `enabled` flag.
 */
export interface GridItem extends GridItemUsable {
	enabled: boolean;
}
