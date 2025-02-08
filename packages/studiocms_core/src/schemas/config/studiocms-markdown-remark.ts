import type { StudioCMSConfigOptions } from '@studiocms/markdown-remark-processor';
import { z } from 'astro/zod';

export const StudioCMSSanitizeOptionsSchema = z
	.object({
		/** An Array of strings indicating elements that the sanitizer should not remove. All elements not in the array will be dropped. */
		allowElements: z.array(z.string()).optional(),
		/** An Array of strings indicating elements that the sanitizer should remove, but keeping their child elements. */
		blockElements: z.array(z.string()).optional(),
		/** An Array of strings indicating elements (including nested elements) that the sanitizer should remove. */
		dropElements: z.array(z.string()).optional(),
		/** An Object where each key is the attribute name and the value is an Array of allowed tag names. Matching attributes will not be removed. All attributes that are not in the array will be dropped. */
		allowAttributes: z.record(z.array(z.string())).optional(),
		/** An Object where each key is the attribute name and the value is an Array of dropped tag names. Matching attributes will be removed. */
		dropAttributes: z.record(z.array(z.string())).optional(),
		/** A Boolean value set to false (default) to remove components and their children. If set to true, components will be subject to built-in and custom configuration checks (and will be retained or dropped based on those checks). */
		allowComponents: z.boolean().optional(),
		/** A Boolean value set to false (default) to remove custom elements and their children. If set to true, custom elements will be subject to built-in and custom configuration checks (and will be retained or dropped based on those checks). */
		allowCustomElements: z.boolean().optional(),
		/** A Boolean value set to false (default) to remove HTML comments. Set to true in order to keep comments. */
		allowComments: z.boolean().optional(),
	})
	.optional();

export const StudioCMSMarkdownExtendedSchema = z
	.union([
		z.literal(false),
		z.object({
			callouts: z
				.union([
					z.literal(false),
					z.object({
						theme: z
							.union([z.literal('github'), z.literal('obsidian'), z.literal('vitepress')])
							.optional()
							.default('obsidian'),
					}),
				])
				.optional()
				.default({})
				.transform((value) => {
					if (value === false) {
						return { theme: 'obsidian' as const, enabled: false };
					}
					return { ...value, enabled: true };
				}),

			autoLinkHeadings: z.boolean().optional().default(true),

			discordSubtext: z.boolean().optional().default(true),

			sanitize: StudioCMSSanitizeOptionsSchema,
		}),
	])
	.optional()
	.default({})
	.transform((value) => {
		if (value === false) {
			return {
				callouts: { enabled: false, theme: 'obsidian' as const },
				autoLinkHeadings: false,
				discordSubtext: false,
			};
		}
		return value;
	});

export const TransformToProcessor = StudioCMSMarkdownExtendedSchema.transform(
	({ autoLinkHeadings, callouts, discordSubtext, sanitize }) => {
		return {
			studiocms: {
				callouts: callouts.enabled ? { theme: callouts.theme } : false,
				autolink: autoLinkHeadings,
				discordSubtext,
				sanitize,
			},
		} as { studiocms: StudioCMSConfigOptions };
	}
);
