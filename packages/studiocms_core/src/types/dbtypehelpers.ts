import { z } from 'astro/zod';

/**
 * Zod Schema for PageDataAndContent objects from Astro:DB
 * @deprecated
 */
export const PageDataAndContentSchema = z.object({
	PageData: z.object({
		id: z.string(),
		package: z.string(),
		title: z.string(),
		description: z.string(),
		showOnNav: z.boolean(),
		publishedAt: z.date(),
		updatedAt: z.date().nullable(),
		slug: z.string(),
		contentLang: z.string().nullable(),
		heroImage: z.string(),
	}),
	PageContent: z.object({
		id: z.string(),
		contentId: z.string(),
		contentLang: z.string(),
		content: z.string().nullable(),
	}),
	SiteConfig: z.object({
		id: z.number(),
		title: z.string(),
		description: z.string(),
	}),
	Permissions: z.object({
		username: z.string(),
		rank: z.string(),
	}),
	User: z.object({
		id: z.string(),
		name: z.string(),
		username: z.string(),
		url: z.string().nullable(),
		email: z.string().nullable(),
		avatar: z.string().nullable(),
		githubId: z.number().nullable(),
		githubURL: z.string().nullable(),
		discordId: z.string().nullable(),
		googleId: z.string().nullable(),
		auth0Id: z.string().nullable(),
		password: z.string().nullable(),
		updatedAt: z.date().nullable(),
		createdAt: z.date().nullable(),
	}),
});

/**
 * Type for PageDataAndContent objects from Astro:DB
 * @deprecated
 */
export type PageDataAndContent = z.infer<typeof PageDataAndContentSchema>;
