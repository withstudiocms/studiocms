import { defineCollection, reference, z } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { topicSchema } from 'starlight-sidebar-topics/schema';

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

const baseSchema = topicSchema.extend({
	type: z.literal('base').optional().default('base'),
	i18nReady: z.boolean().optional().default(false),
});

const integrationSchema = baseSchema.extend({
	type: z.literal('integration'),
	catalogEntry: reference('package-catalog'),
});

const redirectSchema = baseSchema.extend({
	type: z.literal('redirect'),
	redirect: z.string(),
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({ extend: z.union([baseSchema, integrationSchema, redirectSchema]) }),
	}),
	i18n: defineCollection({
		loader: i18nLoader(),
		schema: i18nSchema({
			extend: z.object({
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
			}),
		}),
	}),
	'package-catalog': defineCollection({
		loader: glob({ pattern: '*.json', base: 'src/content/package-catalog' }),
		schema: packageCatalogSchema,
	}),
};
