import { defineCollection, reference } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

const packageCatalogSchema = z.object({
	name: z.string(),
	description: z.string(),
	docsLink: z.string(),
	githubURL: z.string(),
	catalog: z
		.union([z.literal('studiocms'), z.literal('community')])
		.optional()
		.default('studiocms'),
	isPlugin: z.boolean().optional().default(false),
	publiclyUsable: z.boolean().optional().default(false),
	released: z.boolean().optional().default(true),
});

const baseSchema = z.object({
	type: z.literal('base').optional().default('base'),
});

const integrationSchema = baseSchema.extend({
	type: z.literal('integration'),
	catalogEntry: reference('package-catalog'),
});

const redirectSchema = baseSchema.extend({
	type: z.literal('redirect'),
	redirect: z.string(),
});

const docsCollectionSchema = z.union([baseSchema, integrationSchema, redirectSchema]);

export const collections = {
	docs: defineCollection({
		schema: docsSchema({ extend: docsCollectionSchema }),
	}),
	'package-catalog': defineCollection({
		type: 'data',
		schema: packageCatalogSchema,
	}),
};
