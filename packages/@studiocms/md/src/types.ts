import { z } from 'astro/zod';
import { StudioCMSSanitizeOptionsSchema } from 'studiocms/schemas';

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
