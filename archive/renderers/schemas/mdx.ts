import { z } from 'astro/zod';
import type { PluggableList } from 'unified';

// Assuming CommentSchema, ElementSchema, and TextSchema are already defined
const CommentSchema = z.object({
	// Define the schema for comments
	type: z.literal('comment'),
	value: z.string(),
});

const ElementSchema = z.object({
	// Define the schema for elements
	type: z.literal('element'),
	tagName: z.string(),
	properties: z.record(z.any()),
	children: z.array(z.any()),
});

const TextSchema = z.object({
	// Define the schema for text
	type: z.literal('text'),
	value: z.string(),
});

// Annotate the variable with the type
const ElementContentSchema: z.ZodUnion<
	[typeof CommentSchema, typeof ElementSchema, typeof TextSchema]
> = z.union([CommentSchema, ElementSchema, TextSchema]);

// Schema for FootnoteBackContentTemplate.
export const FootnoteBackContentTemplateSchema = z
	.function()
	.args(z.number(), z.number()) // The arguments: referenceIndex and rereferenceIndex.
	.returns(
		z.union([
			z.array(ElementContentSchema), // Array of ElementContent
			ElementContentSchema, // Single ElementContent
			z.string(), // Or a string
		])
	);

const FootnoteBackLabelTemplateSchema = z
	.function()
	.args(z.number(), z.number()) // The arguments: referenceIndex and rereferenceIndex, both numbers.
	.returns(z.string()); // The return type is a string.

const HastPropertiesSchema = z.record(
	z.union([
		z.boolean(),
		z.number(),
		z.string(),
		z.null(),
		z.undefined(),
		z.array(z.union([z.string(), z.number()])),
	])
);

const HandlersSchema = z.any(); // Replace with actual schema for Handlers

const MdastNodesSchema = z.object({ type: z.string() }); // Replace with actual schema for MdastNodes

const HandlerSchema = z.any(); // Replace with actual schema for Handler

export const OptionsSchema = z.object({
	allowDangerousHtml: z.boolean().nullable().optional(),
	clobberPrefix: z.string().nullable().optional(),
	file: z.any().nullable().optional(),
	footnoteBackContent: z
		.union([FootnoteBackContentTemplateSchema, z.string(), z.null()])
		.optional(),
	footnoteBackLabel: z.union([FootnoteBackLabelTemplateSchema, z.string(), z.null()]).optional(),
	footnoteLabel: z.string().nullable().optional(),
	footnoteLabelProperties: HastPropertiesSchema.nullable().optional(),
	footnoteLabelTagName: z.string().nullable().optional(),
	handlers: HandlersSchema.nullable().optional(),
	passThrough: z.array(MdastNodesSchema.shape.type).nullable().optional(),
	unknownHandler: HandlerSchema.nullable().optional(),
});

/**
 * MDX Configuration Schema
 *
 * Allows customization of the MDX renderer
 */
export const mdxConfigSchema = z
	.object({
		/** List of remark plugins (optional). */
		remarkPlugins: z.custom<PluggableList>().optional().default([]),
		/** List of rehype plugins (optional). */
		rehypePlugins: z.custom<PluggableList>().optional().default([]),
		/** List of recma plugins (optional); this is a new ecosystem, currently in beta, to transform esast trees (JavaScript) */
		recmaPlugins: z.custom<PluggableList>().optional().default([]),
		/** Options to pass through to remark-rehype (optional); the option allowDangerousHtml will always be set to true and the MDX nodes (see nodeTypes) are passed through; In particular, you might want to pass configuration for footnotes if your content is not in English. */
		remarkRehypeOptions: OptionsSchema.optional().default({}),
	})
	.optional()
	.default({});
