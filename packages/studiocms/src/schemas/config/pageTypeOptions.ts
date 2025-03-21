import { z } from 'astro/zod';

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

export const AstroMarkdownSchema = z.object({
	flavor: z.literal('astro').optional(),
	sanitize: StudioCMSSanitizeOptionsSchema,
});

export const StudioCMSMarkdownSchema = AstroMarkdownSchema.extend({
	flavor: z.literal('studiocms').optional().default('studiocms'),
	callouts: z
		.union([z.literal('github'), z.literal('obsidian'), z.literal('vitepress'), z.literal(false)])
		.optional()
		.default('obsidian'),
	autoLinkHeadings: z.boolean().optional().default(true),
	discordSubtext: z.boolean().optional().default(true),
});

export const MarkdownSchema = z
	.union([AstroMarkdownSchema, StudioCMSMarkdownSchema])
	.optional()
	.default({ flavor: 'studiocms' });

export const BuiltInPageTypeOptionsSchema = z
	.object({
		/** Options for the `studiocms/markdown` pageType */
		markdown: MarkdownSchema,
	})
	.optional()
	.default({});

export type StudioCMSMarkdownOptions = z.infer<typeof StudioCMSMarkdownSchema>;
export type MarkdownSchemaOptions = z.infer<typeof MarkdownSchema>;
