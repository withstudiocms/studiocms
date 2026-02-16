import { Schema } from 'effect';
import { SanitizeOptionsSchema } from 'studiocms/schemas';

/**
 * Base schema for Markdown options, containing common properties shared between different Markdown configurations.
 */
export class BaseMarkdownOptionsSchema extends Schema.Class<BaseMarkdownOptionsSchema>(
	'BaseMarkdownOptionsSchema'
)(
	{
		sanitize: Schema.optionalWith(SanitizeOptionsSchema, {
			default: () => ({}),
		}).annotations({
			description:
				'Sanitization options for Markdown content, validated against `SanitizeOptionsSchema`.',
		}),
	},
	{
		title: 'BaseMarkdownOptionsSchema',
		identifier: 'BaseMarkdownOptionsSchema',
		description:
			'Base schema for Markdown options, containing common properties shared between different Markdown configurations.',
	}
) {}

/**
 * Schema for Markdown options specific to the Astro flavor, extending the base Markdown options schema.
 */
export class AstroMarkdownOptionsSchema extends BaseMarkdownOptionsSchema.extend<AstroMarkdownOptionsSchema>(
	'AstroMarkdownOptionsSchema'
)(
	{
		flavor: Schema.Literal('astro').annotations({
			description:
				'Specifies the Markdown flavor, fixed to "astro". This property is used to differentiate between different Markdown configurations.',
		}),
	},
	{
		title: 'AstroMarkdownOptionsSchema',
		identifier: 'AstroMarkdownOptionsSchema',
		description: 'Schema for Markdown options specific to the Astro flavor.',
	}
) {}

/**
 * A boolean schema that only accepts the value false. This schema is used to validate options that should only allow false as a valid value, such as disabling certain features or styles in Markdown configurations.
 */
const FalseOnlyBoolean = Schema.declare((input: unknown): input is false => input === false, {
	title: 'FalseOnlyBoolean',
	description: 'A boolean schema that only accepts the value false.',
	identifier: 'FalseOnlyBoolean',
	jsonSchema: {
		type: 'boolean',
		enum: [false],
	},
});

/**
 * Schema for Markdown options specific to the StudioCMS flavor, extending the base Markdown options schema.
 */
export class StudioCMSMarkdownOptionsSchema extends BaseMarkdownOptionsSchema.extend<StudioCMSMarkdownOptionsSchema>(
	'StudioCMSMarkdownOptionsSchema'
)(
	{
		flavor: Schema.Literal('studiocms').annotations({
			description:
				'Specifies the markdown flavor, fixed to "studiocms". This property is used to differentiate between different Markdown configurations.',
		}),
		callouts: Schema.optionalWith(
			Schema.Union(FalseOnlyBoolean, Schema.Literal('github', 'obsidian', 'vitepress')),
			{
				default: () => 'obsidian',
			}
		).annotations({
			description:
				'Optional callouts style, can be set to "github", "obsidian", "vitepress", or false. This property allows users to choose a specific callout theme for Markdown content.',
		}),
		autoLinkHeadings: Schema.optionalWith(Schema.Boolean, {
			default: () => true,
		}).annotations({
			description:
				'Optionally enables automatic linking of headings, defaults to true. This property allows users to automatically create links for headings in Markdown content.',
		}),
		discordSubtext: Schema.optionalWith(Schema.Boolean, {
			default: () => true,
		}).annotations({
			description:
				'Optionally enables Discord subtext, defaults to true. This property allows users to include Discord-style subtext in Markdown content.',
		}),
	},
	{
		title: 'StudioCMSMarkdownOptionsSchema',
		identifier: 'StudioCMSMarkdownOptionsSchema',
		description: 'Schema for Markdown options specific to the StudioCMS flavor.',
	}
) {}

/**
 * Union schema for Markdown options, allowing for either Astro or StudioCMS specific configurations. This schema is used to validate the options provided for Markdown support in StudioCMS.
 */
export const MarkdownOptionsSchema = Schema.Union(
	AstroMarkdownOptionsSchema,
	StudioCMSMarkdownOptionsSchema
).annotations({
	title: 'MarkdownOptionsSchema',
	identifier: 'MarkdownOptionsSchema',
	description:
		'Union schema for Markdown options, allowing for either Astro or StudioCMS specific configurations. This schema is used to validate the options provided for Markdown support in StudioCMS.',
});

/**
 * Type representing the options for configuring Markdown support in StudioCMS when using the Astro flavor. This type is derived from the `AstroMarkdownOptionsSchema` and includes properties specific to the Astro configuration of Markdown support.
 */
export type AstroMarkdownOptions = typeof AstroMarkdownOptionsSchema.Encoded;

/**
 * Type representing the options for configuring Markdown support in StudioCMS when using the Astro flavor. This type is derived from the `AstroMarkdownOptionsSchema` and includes properties specific to the Astro configuration of Markdown support.
 */
export type StudioCMSMarkdownOptions = typeof StudioCMSMarkdownOptionsSchema.Encoded;

/**
 * Type representing the options for configuring Markdown support in StudioCMS. This type is derived from the `MarkdownOptionsSchema` and can represent either Astro or StudioCMS specific configurations.
 */
export type MarkdownSchemaOptions = typeof MarkdownOptionsSchema.Encoded;
