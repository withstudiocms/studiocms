import { defineCollection, reference } from 'astro:content';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
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

const customTranslationsSchema = z.object({
	'site-title.labels.docs': z.string().optional(),
	'site-title.labels.main-site': z.string().optional(),
	'site-title.labels.live-demo': z.string().optional(),
	'sponsors.sponsoredby': z.string().optional(),
	'package-catalog.readmore.start': z.string().optional(),
	'package-catalog.readmore.end': z.string().optional(),
	'integration-labels.changelog': z.string().optional(),
	'contributors.core-packages': z.string().optional(),
	'contributors.ui-library': z.string().optional(),
	'contributors.devapps': z.string().optional(),
	'contributors.plugins': z.string().optional(),
	'contributors.documentation': z.string().optional(),
	'contributors.website': z.string().optional(),
	'contributors.bots': z.string().optional(),
});

export const collections = {
	docs: defineCollection({
		schema: docsSchema({ extend: docsCollectionSchema }),
	}),
	i18n: defineCollection({
		type: 'data',
		schema: i18nSchema({
			extend: customTranslationsSchema,
		}),
	}),
	'package-catalog': defineCollection({
		type: 'data',
		schema: packageCatalogSchema,
	}),
};
