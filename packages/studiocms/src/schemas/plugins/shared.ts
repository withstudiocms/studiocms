import { ParseResult } from 'effect';
import * as Schema from 'effect/Schema';
import { availableTranslationFileKeys } from '../../virtuals/i18n/v-files.js';
import {
	AstroComponentSchema,
	SanitizeOptionsSchema,
	UIIconListSchema,
} from '../external-schemas.js';

/**
 * Available Translation File Keys for plugin translations.
 */
export const I18nLabelSchema = Schema.transformOrFail(
	Schema.Record({
		key: Schema.String,
		value: Schema.String,
	}),
	Schema.Record({
		key: Schema.String,
		value: Schema.String,
	}),
	{
		strict: true,
		decode: (input, _options, ast) => {
			if (typeof input !== 'object' || input === null) {
				return ParseResult.fail(new ParseResult.Type(ast, input, 'Expected an object'));
			}
			const result: Record<string, string> = {};
			for (const key in input) {
				if (typeof input[key] !== 'string') {
					return ParseResult.fail(
						new ParseResult.Type(ast, input[key], `Expected value for key '${key}' to be a string`)
					);
				}
				result[key] = input[key];
			}
			const unknown = Object.keys(result).filter((k) => !availableTranslationFileKeys.includes(k));
			if (unknown.length > 0) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						input,
						`Unknown/Unsupported translation keys: ${unknown.join(', ')}\n\nSupported keys are: ${availableTranslationFileKeys.join(', ')}`
					)
				);
			}
			return ParseResult.succeed(result);
		},
		encode: (input) => ParseResult.succeed(input),
	}
);

/**
 * StudioCMS Colorway Schema
 */
export const StudioCMSColorwaySchema = Schema.Literal(
	'primary',
	'success',
	'warning',
	'danger',
	'info',
	'mono'
);

/**
 * StudioCMS Size Schema
 */
export const StudioCMSSizeSchema = Schema.Literal('sm', 'md', 'lg');

/**
 * Shared Options Schema for select fields in plugins.
 *
 * This schema defines the structure of options that can be shared across different select fields, including a label, value, and an optional disabled property.
 */
export const SharedOptionsSchemaItem = Schema.Struct({
	label: Schema.String,
	value: Schema.String,
	disabled: Schema.optional(Schema.Boolean),
});

/**
 * Shared Options Schema for select fields in plugins.
 *
 * This schema defines an array of options that can be shared across different select fields, where each option follows the structure defined in SharedOptionsSchemaItem.
 */
export const SharedOptionsSchema = Schema.mutable(Schema.Array(SharedOptionsSchemaItem));

/**
 * Schema for validating StudioCMS permissions.
 *
 * This schema ensures that the provided permission value is one of the predefined permission levels in StudioCMS, such as 'owner', 'admin', 'editor', 'visitor', or 'none'.
 */
export const StudioCMSPermissionsSchema = Schema.Literal(
	'owner',
	'admin',
	'editor',
	'visitor',
	'none'
);

/**
 * Base Field Schema for plugin fields.
 *
 * This schema defines the common properties for all plugin fields, such as name, label, and optional properties like required and readOnly.
 */
export class BaseFieldSchema extends Schema.Class<BaseFieldSchema>('BaseFieldSchema')({
	name: Schema.String,
	label: Schema.String,
	required: Schema.optional(Schema.Boolean),
	readOnly: Schema.optional(Schema.Boolean),
}) {}

/**
 * Supports Colorway Schema for plugin fields that support colorways.
 *
 * This schema extends the BaseFieldSchema and adds an optional colorway property, which can be one of the predefined colorways in the StudioCMSColorwaySchema.
 */
export class SupportsColorwaySchema extends BaseFieldSchema.extend<SupportsColorwaySchema>(
	'SupportsColorwaySchema'
)({
	color: Schema.optional(StudioCMSColorwaySchema),
}) {}

/**
 * Supports PlaceHolder Schema for plugin fields that support placeholders.
 *
 * This schema extends the BaseFieldSchema and adds an optional placeholder property, which is a string that can be used as a placeholder in input fields.
 */
export class SupportsPlaceHolderSchema extends BaseFieldSchema.extend<SupportsPlaceHolderSchema>(
	'SupportsPlaceHolderSchema'
)({
	placeholder: Schema.optional(Schema.String),
}) {}

/**
 * Checkbox Field Schema for checkbox input fields in plugins.
 *
 * This schema extends the SupportsColorwaySchema and adds specific properties for checkbox fields, such as defaultChecked and size.
 */
export class CheckboxFieldSchema extends SupportsColorwaySchema.extend<CheckboxFieldSchema>(
	'CheckboxFieldSchema'
)({
	input: Schema.Literal('checkbox'),
	defaultChecked: Schema.optional(Schema.Boolean),
	size: Schema.optional(StudioCMSSizeSchema),
}) {}

/**
 * Text Input Field Schema for text input fields in plugins.
 *
 * This schema extends the SupportsPlaceHolderSchema and adds specific properties for text input fields, such as type and defaultValue.
 */
export class TextInputFieldSchema extends SupportsPlaceHolderSchema.extend<TextInputFieldSchema>(
	'TextInputFieldSchema'
)({
	input: Schema.Literal('input'),
	type: Schema.optional(
		Schema.Literal('text', 'password', 'email', 'number', 'tel', 'url', 'search')
	),
	defaultValue: Schema.optional(Schema.String),
}) {}

/**
 * Text Area Field Schema for textarea input fields in plugins.
 *
 * This schema extends the SupportsPlaceHolderSchema and adds specific properties for textarea fields, such as defaultValue.
 */
export class TextAreaFieldSchema extends SupportsPlaceHolderSchema.extend<TextAreaFieldSchema>(
	'TextAreaFieldSchema'
)({
	input: Schema.Literal('textarea'),
	defaultValue: Schema.optional(Schema.String),
}) {}

/**
 * Radio Group Field Schema for radio group input fields in plugins.
 *
 * This schema extends the SupportsColorwaySchema and adds specific properties for radio group fields, such as direction, defaultValue, and options.
 */
export class RadioGroupFieldSchema extends SupportsColorwaySchema.extend<RadioGroupFieldSchema>(
	'RadioGroupFieldSchema'
)({
	input: Schema.Literal('radio'),
	direction: Schema.optional(Schema.Literal('horizontal', 'vertical')),
	defaultValue: Schema.optional(Schema.String),
	options: SharedOptionsSchema,
}) {}

/**
 * Select Field Schema for select input fields in plugins.
 *
 * This schema extends the SupportsColorwaySchema and adds specific properties for select fields, such as type, defaultValue, and options.
 */
export class SelectFieldSchema extends SupportsColorwaySchema.extend<SelectFieldSchema>(
	'SelectFieldSchema'
)({
	input: Schema.Literal('select'),
	type: Schema.optional(Schema.Literal('basic', 'search')),
	defaultValue: Schema.optional(Schema.String),
	options: SharedOptionsSchema,
}) {}

/**
 * Field Schema for plugin fields in StudioCMS.
 */
export const FieldSchema = Schema.Union(
	CheckboxFieldSchema,
	TextInputFieldSchema,
	TextAreaFieldSchema,
	RadioGroupFieldSchema,
	SelectFieldSchema
);

/**
 * Row Field Schema for grouping multiple fields in a row within plugin settings.
 *
 * This schema extends the BaseFieldSchema and adds specific properties for row fields, such as alignCenter, gapSize, and an array of fields that can be included in the row.
 */
export class RowFieldSchema extends BaseFieldSchema.extend<RowFieldSchema>('RowFieldSchema')({
	input: Schema.Literal('row'),
	alignCenter: Schema.optional(Schema.Boolean),
	gapSize: Schema.optional(StudioCMSSizeSchema),
	fields: Schema.Array(FieldSchema),
}) {}

/**
 * Settings Field Schema for defining the structure of fields used in plugin settings.
 *
 * This schema is a union of all the individual field schemas, allowing for flexibility in defining various types of fields within plugin settings.
 */
export const SettingsFieldSchema = Schema.Union(FieldSchema, RowFieldSchema);

/**
 * Type for the Settings Field, which can be any of the defined field types in the SettingsFieldSchema.
 */
export type SettingsField = typeof SettingsFieldSchema.Type;

/**
 * Base Dashboard Page Props Schema for defining the properties of a dashboard page in StudioCMS.
 *
 * This schema includes properties such as title, description, route, icon, required permissions, and optional components for page actions and body content, providing a structured way to define the configuration of dashboard pages in plugins.
 */
export class BaseDashboardPagePropsSchema extends Schema.Class<BaseDashboardPagePropsSchema>(
	'BaseDashboardPagePropsSchema'
)({
	title: I18nLabelSchema,
	description: Schema.String,
	route: Schema.String,
	icon: Schema.optionalWith(UIIconListSchema, {
		default: () => 'heroicons:cube-transparent',
	}),
	requiredPermissions: Schema.optionalWith(StudioCMSPermissionsSchema, {
		default: () => 'none',
	}),
	pageActionsComponent: Schema.optional(Schema.String),
	pageBodyComponent: Schema.String,
}) {}

/**
 * Available Base Schema for defining the properties of an available plugin in StudioCMS.
 *
 * This schema extends the BaseDashboardPagePropsSchema and adds a slug property, which is a string that serves as a unique identifier for the plugin, allowing for structured configuration of available plugins in the system.
 */
export class AvailableBaseSchema extends BaseDashboardPagePropsSchema.extend<AvailableBaseSchema>(
	'AvailableBaseSchema'
)({
	slug: Schema.String,
}) {}

/**
 * Final Base Schema for defining the properties of a final plugin in StudioCMS.
 *
 * This schema extends the AvailableBaseSchema and adds a components property, which is an object that can include optional PageActionsComponent, a required PageBodyComponent, and an optional InnerSidebarComponent, all of which are validated as Astro components, providing a structured way to define the final configuration of plugins in the system.
 */
export class FinalBaseSchema extends AvailableBaseSchema.extend<FinalBaseSchema>('FinalBaseSchema')(
	{
		components: Schema.Struct({
			PageActionsComponent: Schema.optional(AstroComponentSchema),
			PageBodyComponent: AstroComponentSchema,
			InnerSidebarComponent: Schema.optional(AstroComponentSchema),
		}),
	}
) {}

/**
 * Single Sidebar Schema for defining the properties of a plugin with a single sidebar layout in StudioCMS.
 */
export class SingleSidebarSchema extends BaseDashboardPagePropsSchema.extend<SingleSidebarSchema>(
	'SingleSidebarSchema'
)({
	sidebar: Schema.Literal('single'),
}) {}

/**
 * Available Final Schema for defining the properties of a final plugin with a single sidebar layout in StudioCMS.
 */
export class AvailableSingleSchema extends AvailableBaseSchema.extend<AvailableSingleSchema>(
	'AvailableSingleSchema'
)({
	sidebar: Schema.Literal('single'),
}) {}

/**
 * Final Single Schema for defining the properties of a final plugin with a single sidebar layout in StudioCMS.
 */
export class FinalSingleSchema extends FinalBaseSchema.extend<FinalSingleSchema>(
	'FinalSingleSchema'
)({
	sidebar: Schema.Literal('single'),
}) {}

/**
 * Double Sidebar Schema for defining the properties of a plugin with a double sidebar layout in StudioCMS.
 */
export class DoubleSidebarSchema extends BaseDashboardPagePropsSchema.extend<DoubleSidebarSchema>(
	'DoubleSidebarSchema'
)({
	sidebar: Schema.Literal('double'),
	innerSidebarComponent: Schema.String,
}) {}

/**
 * Available Double Schema for defining the properties of a final plugin with a double sidebar layout in StudioCMS.
 */
export class AvailableDoubleSchema extends AvailableBaseSchema.extend<AvailableDoubleSchema>(
	'AvailableDoubleSchema'
)({
	sidebar: Schema.Literal('double'),
	innerSidebarComponent: Schema.String,
}) {}

/**
 * Final Double Schema for defining the properties of a final plugin with a double sidebar layout in StudioCMS.
 */
export class FinalDoubleSchema extends FinalBaseSchema.extend<FinalDoubleSchema>(
	'FinalDoubleSchema'
)({
	sidebar: Schema.Literal('double'),
	innerSidebarComponent: Schema.String,
}) {}

/**
 * Dashboard Page Schema for defining the properties of a dashboard page in StudioCMS, which can have either a single or double sidebar layout.
 */
export const DashboardPageSchema = Schema.Union(SingleSidebarSchema, DoubleSidebarSchema);

/**
 * Available Dashboard Base Schema for defining the properties of an available plugin in StudioCMS, which can have either a single or double sidebar layout.
 */
export const AvailableDashboardBaseSchema = Schema.Union(
	AvailableSingleSchema,
	AvailableDoubleSchema
);

/**
 * Final Dashboard Base Schema for defining the properties of a final plugin in StudioCMS, which can have either a single or double sidebar layout.
 */
export const FinalDashboardBaseSchema = Schema.Union(FinalSingleSchema, FinalDoubleSchema);

/**
 * Available Dashboard Pages Schema for defining the properties of available dashboard pages in StudioCMS, categorized by user and admin access levels.
 *
 * This schema defines an object with optional user and admin properties, each of which is an array of AvailableDashboardBaseSchema, allowing for structured configuration of available dashboard pages based on access levels in the system.
 */
export const AvailableDashboardPagesSchema = Schema.mutable(
	Schema.Struct({
		user: Schema.optional(Schema.mutable(Schema.Array(AvailableDashboardBaseSchema))),
		admin: Schema.optional(Schema.mutable(Schema.Array(AvailableDashboardBaseSchema))),
	})
);

/**
 * Settings Page Schema for defining the properties of a settings page in StudioCMS plugins.
 *
 * This schema defines an object with an array of fields and an endpoint string, allowing for structured configuration of settings pages within plugins, where each field follows the structure defined in the SettingsFieldSchema.
 */
export const SettingsPageSchema = Schema.optional(
	Schema.Struct({
		fields: Schema.Array(SettingsFieldSchema),
		endpoint: Schema.String,
	})
);

/**
 * Frontend Navigation Links Schema for defining the structure of frontend navigation links in StudioCMS plugins.
 *
 * This schema defines an optional array of navigation link objects, where each object contains a label and an href string, allowing for structured configuration of frontend navigation links within plugins.
 */
export const FrontendNavigationLinksSchema = Schema.optional(
	Schema.Array(
		Schema.Struct({
			label: Schema.String,
			href: Schema.String,
		})
	)
);

/**
 * Page Types Schema for defining the structure of page types in StudioCMS plugins.
 *
 * This schema defines an optional array of page type objects, where each object contains properties such as label, identifier, description, pageContentComponent, rendererComponent, fields, and apiEndpoint, allowing for structured configuration of different page types within plugins.
 */
export const PageTypesSchema = Schema.optional(
	Schema.Array(
		Schema.Struct({
			label: Schema.String,
			identifier: Schema.String,
			description: Schema.optional(Schema.String),
			pageContentComponent: Schema.optional(Schema.String),
			rendererComponent: Schema.optional(Schema.String),
			fields: Schema.optional(Schema.Array(SettingsFieldSchema)),
			apiEndpoint: Schema.optional(Schema.String),
		})
	)
);

/**
 * Type for a Dashboard Page, which can be either a SingleSidebarSchema or a DoubleSidebarSchema, defining the properties and layout of a dashboard page in StudioCMS.
 */
export type DashboardPage = typeof DashboardPageSchema.Type;

/**
 * Type for Available Dashboard Pages, which includes optional user and admin properties, each containing an array of AvailableDashboardBaseSchema, defining the structure of available dashboard pages based on access levels in StudioCMS.
 */
export type AvailableDashboardPages = typeof AvailableDashboardPagesSchema.Type;

/**
 * Type for a Final Dashboard Page, which can be either a FinalSingleSchema or a FinalDoubleSchema, defining the properties and layout of a final dashboard page in StudioCMS.
 */
export type FinalDashboardPage = typeof FinalDashboardBaseSchema.Type;

/**
 * Schema for defining the structure of a grid item used in plugins, which includes properties such as name, span, variant, required permissions, header information, and body content with optional sanitization options, allowing for structured configuration of grid items within plugins in StudioCMS.
 */
export class GridItemInputBaseSchema extends Schema.Class<GridItemInputBaseSchema>(
	'GridItemInputBaseSchema'
)({
	name: Schema.String,
	span: Schema.Literal(1, 2, 3),
	variant: Schema.Literal('default', 'filled'),
	requiresPermission: Schema.optional(Schema.Literal('owner', 'admin', 'editor', 'visitor')),
	header: Schema.optional(
		Schema.Struct({
			title: Schema.String,
			icon: Schema.optional(UIIconListSchema),
		})
	),
}) {}

/**
 * Schema for a usable grid item, which extends the GridItemInputBaseSchema and includes an optional body property that can contain HTML content, component references, and sanitization options, allowing for structured configuration of usable grid items within plugins in StudioCMS.
 */
export class GridItemInputSchema extends GridItemInputBaseSchema.extend<GridItemInputSchema>(
	'GridItemInputSchema'
)({
	body: Schema.optional(
		Schema.Struct({
			html: Schema.String,
			components: Schema.optional(
				Schema.Record({
					key: Schema.String,
					value: Schema.String,
				})
			),
			sanitizeOpts: Schema.optional(SanitizeOptionsSchema),
		})
	),
}) {}

/**
 * Schema for a grid item, which extends the GridItemInputSchema and adds an enabled property to indicate whether the grid item is active or not, allowing for structured configuration of grid items with enabled state within plugins in StudioCMS.
 */
export class GridItemUsableSchema extends GridItemInputBaseSchema.extend<GridItemUsableSchema>(
	'GridItemUsableSchema'
)({
	body: Schema.optional(
		Schema.Struct({
			html: Schema.String,
			components: Schema.optional(
				Schema.Record({
					key: Schema.String,
					value: Schema.Any,
				})
			),
			sanitizeOpts: Schema.optional(SanitizeOptionsSchema),
		})
	),
}) {}

/**
 * Schema for a grid item, which extends the GridItemUsableSchema and adds an enabled property to indicate whether the grid item is active or not, allowing for structured configuration of grid items with enabled state within plugins in StudioCMS.
 */
export class GridItemSchema extends GridItemUsableSchema.extend<GridItemSchema>('GridItemSchema')({
	enabled: Schema.Boolean,
}) {}

/**
 * Type for a Grid Item Input, which includes properties such as name, span, variant, required permissions, header information, and body content with optional sanitization options, defining the structure of a grid item input used in plugins within StudioCMS.
 */
export type GridItemInput = typeof GridItemInputSchema.Type;

/**
 * Type for a usable Grid Item, which includes properties such as name, span, variant, required permissions, header information, body content with optional sanitization options, and an enabled state, defining the structure of a usable grid item used in plugins within StudioCMS.
 */
export type GridItemUsable = typeof GridItemUsableSchema.Type;

/**
 * Type for a Grid Item, which includes properties such as name, span, variant, required permissions, header information, body content with optional sanitization options, and an enabled state, defining the structure of a grid item used in plugins within StudioCMS.
 */
export type GridItem = typeof GridItemSchema.Type;
