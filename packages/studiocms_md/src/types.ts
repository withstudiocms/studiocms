import { z } from 'astro/zod';

/**
 * Schema for configuring HTML sanitization options in StudioCMS.
 *
 * @remarks
 * This schema defines the structure for options used to control the behavior of the HTML sanitizer.
 * Each property allows fine-grained control over which elements and attributes are allowed, blocked, or dropped,
 * as well as handling of components, custom elements, and comments.
 *
 * @property allowElements - An array of strings specifying elements that should be retained. All other elements will be removed.
 * @property blockElements - An array of strings specifying elements to remove, but keep their children.
 * @property dropElements - An array of strings specifying elements (including nested elements) to remove entirely.
 * @property allowAttributes - An object mapping attribute names to arrays of allowed tag names. Only matching attributes will be retained.
 * @property dropAttributes - An object mapping attribute names to arrays of tag names for which the attribute should be removed.
 * @property allowComponents - If true, components will be checked against built-in and custom configuration and may be retained or dropped. Default is false.
 * @property allowCustomElements - If true, custom elements will be checked against built-in and custom configuration and may be retained or dropped. Default is false.
 * @property allowComments - If true, HTML comments will be retained. Default is false.
 */
export const StudioCMSSanitizeOptionsSchema = z
	.object({
		/** An Array of strings indicating elements that the sanitizer should not remove. All elements not in the array will be dropped. */
		allowElements: z.array(z.string()).optional(),
		/** An Array of strings indicating elements that the sanitizer should remove. Children will be kept. */
		blockElements: z.array(z.string()).optional(),
		/** An Array of strings indicating elements (including nested elements) that the sanitizer should remove. */
		dropElements: z.array(z.string()).optional(),
		/** An object where each key is the attribute name and the value is an array of allowed tag names. Matching attributes will not be removed. All attributes that are not in the array will be dropped. */
		allowAttributes: z.record(z.array(z.string())).optional(),
		/** An object where each key is the attribute name and the value is an array of dropped tag names. Matching attributes will be removed. */
		dropAttributes: z.record(z.array(z.string())).optional(),
		/** A boolean value to remove components and their children. If set to true, components will be subject to built-in and custom configuration checks (and will be retained or dropped based on those checks). Default is `false`. */
		allowComponents: z.boolean().optional(),
		/** A boolean value to remove custom elements and their children. If set to true, custom elements will be subject to built-in and custom configuration checks (and will be retained or dropped based on those checks). Default is `false` */
		allowCustomElements: z.boolean().optional(),
		/** A boolean value to remove HTML comments. Set to true in order to keep comments. Default is `false`. */
		allowComments: z.boolean().optional(),
	})
	.optional();

/**
 * Schema definition for Astro-flavored Markdown content.
 *
 * @remarks
 * This schema is used to validate Markdown objects that are specifically
 * intended for use with the Astro flavor. It ensures that the `flavor`
 * property is set to `'astro'` and that the `sanitize` property conforms
 * to the `StudioCMSSanitizeOptionsSchema`.
 *
 * @property flavor - Specifies the Markdown flavor, must be `'astro'`.
 * @property sanitize - Sanitization options for Markdown content, validated
 *                      against `StudioCMSSanitizeOptionsSchema`.
 */
export const AstroMarkdownSchema = z.object({
	/**
	 * Specifies the Markdown flavor, fixed to 'astro'.
	 * This property is used to differentiate between different Markdown configurations.
	 */
	flavor: z.literal('astro'),
	/**
	 * Schema for options used to sanitize Markdown content in StudioCMS.
	 *
	 * @remarks
	 * This schema defines the configuration for controlling which elements and attributes
	 * are allowed, blocked, or dropped during the sanitization process. It also provides
	 * options for handling components, custom elements, and comments.
	 */
	sanitize: StudioCMSSanitizeOptionsSchema,
});

/**
 * Schema definition for StudioCMS Markdown configuration.
 *
 * @extends AstroMarkdownSchema
 * @property {'studiocms'} flavor - Specifies the markdown flavor, fixed to 'studiocms'.
 * @property {'github' | 'obsidian' | 'vitepress' | false} [callouts='obsidian'] - Optional callouts style, defaults to 'obsidian'.
 * @property {boolean} [autoLinkHeadings=true] - Optionally enables automatic linking of headings, defaults to true.
 * @property {boolean} [discordSubtext=true] - Optionally enables Discord subtext, defaults to true.
 */
export const StudioCMSMarkdownSchema = AstroMarkdownSchema.extend({
	/**
	 * Specifies the markdown flavor, fixed to 'studiocms'.
	 * This property is used to differentiate between different Markdown configurations.
	 */
	flavor: z.literal('studiocms'),
	/**
	 * Optional callouts style, defaults to 'obsidian'.
	 * This property allows users to choose a specific callout theme for Markdown content.
	 */
	callouts: z
		.union([z.literal('github'), z.literal('obsidian'), z.literal('vitepress'), z.literal(false)])
		.optional()
		.default('obsidian'),
	/**
	 * Optionally enables automatic linking of headings, defaults to true.
	 * This property allows users to automatically create links for headings in Markdown content.
	 */
	autoLinkHeadings: z.boolean().optional().default(true),
	/**
	 * Optionally enables Discord subtext, defaults to true.
	 * This property allows users to include Discord-style subtext in Markdown content.
	 */
	discordSubtext: z.boolean().optional().default(true),
});

/**
 * Defines a Zod schema for Markdown content, allowing either `AstroMarkdownSchema` or `StudioCMSMarkdownSchema`.
 * The schema is optional and defaults to an object with the flavor set to 'studiocms'.
 *
 * @remarks
 * This schema is useful for validating Markdown data that may conform to different formats,
 * providing flexibility in content handling within the application.
 */
export const MarkdownSchema = z
	.union([AstroMarkdownSchema, StudioCMSMarkdownSchema])
	.optional()
	.default({ flavor: 'studiocms' });

export type StudioCMSMarkdownOptions = z.infer<typeof StudioCMSMarkdownSchema>;
export type MarkdownSchemaOptions = z.infer<typeof MarkdownSchema>;