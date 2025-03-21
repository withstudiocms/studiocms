import { z } from 'astro/zod';

const PrimitiveSchema = z.union([z.null(), z.boolean(), z.number(), z.string()]);
const ScalarSchema = z.union([
	PrimitiveSchema,
	z.array(PrimitiveSchema),
	z.record(PrimitiveSchema),
]);

export const TagSchema = z.object({
	$$mdtype: z.literal('Tag'), // The constant readonly property
	name: z.string().default('div'), // Default to 'div'
	attributes: z.record(z.any()).default({}), // Allow any key-value pairs
	children: z.array(z.any()).default([]), // Array of RenderableTreeNode, default is empty array
});

const RenderableTreeNodeSchema = z.union([TagSchema, ScalarSchema]);
const RenderableTreeNodesSchema = z.union([
	z.array(RenderableTreeNodeSchema),
	RenderableTreeNodeSchema,
]);

type CustomMarkDocRendererNodes = z.infer<typeof RenderableTreeNodesSchema>;

export type markdocRenderer = (nodes: CustomMarkDocRendererNodes) => Promise<string>;

const MarkdocRendererSchema = z.object({
	name: z.string(),
	renderer: z.custom<markdocRenderer>(),
});

export interface MarkdocRenderer extends z.infer<typeof MarkdocRendererSchema> {}

const ParserArgsSchema = z.object({
	file: z.string().optional(),
	slots: z.boolean().optional(),
	location: z.boolean().optional(),
});

const ConfigTypeSchema = z
	.object({
		nodes: z
			.record(
				z
					.object({})
					.partial() // Apply partial on the object inside the record
			)
			.optional(),
		tags: z.record(z.object({})).optional(),
		variables: z.record(z.any()).optional(),
		functions: z.record(z.any()).optional(),
		partials: z.record(z.any()).optional(),
		validation: z
			.object({
				parents: z.array(z.any()).optional(),
				validateFunctions: z.boolean().optional(),
				environment: z.string().optional(),
			})
			.optional(),
	})
	.partial();

//
// MARKDOC CONFIG SCHEMA
//
export const markdocConfigSchema = z
	.object({
		/**
		 * The MarkDoc Content Renderer to use for rendering pages and posts
		 *
		 * Can be one of the following: `html`, `react-static`, or a custom renderer
		 */
		renderType: z
			.union([z.literal('html'), z.literal('react-static'), z.custom<MarkdocRenderer>()])
			.optional()
			.default('html'),
		/**
		 * The MarkDoc Arg Parse to use for rendering pages and posts
		 */
		argParse: ParserArgsSchema.optional(),
		/**
		 * The MarkDoc Transform Config to use for rendering pages and posts
		 *
		 * @see https://markdoc.dev/docs/config
		 */
		transformConfig: ConfigTypeSchema.optional(),
	})
	.optional()
	.default({});

export type MarkDocConfig = z.infer<typeof markdocConfigSchema>;
