import { z } from 'astro/zod';

export const AstroMarkdownSchema = z.object({
	flavor: z.literal('astro').optional(),
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
