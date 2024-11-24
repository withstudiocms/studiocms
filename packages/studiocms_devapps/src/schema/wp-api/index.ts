import { z } from 'astro/zod';

const OpenClosedSchema = z.enum(['open', 'closed', '']);

export const PageSchema = z.object({
	id: z.number(),
	date: z.coerce.date(),
	date_gmt: z.coerce.date(),
	guid: z.object({ rendered: z.string() }),
	modified: z.coerce.date(),
	modified_gmt: z.coerce.date(),
	slug: z.string(),
	status: z.enum(['publish', 'future', 'draft', 'pending', 'private']),
	type: z.string(),
	title: z.object({ rendered: z.string() }),
	content: z.object({ rendered: z.string(), protected: z.boolean() }),
	excerpt: z.object({ rendered: z.string(), protected: z.boolean() }),
	author: z.number(),
	featured_media: z.number(),
	parent: z.number(),
	menu_order: z.number(),
	comment_status: OpenClosedSchema,
	ping_status: OpenClosedSchema,
	template: z.string(),
	meta: z.array(z.any().or(z.record(z.any()))),
});

export const PostSchema = PageSchema.extend({
	format: z.enum([
		'standard',
		'aside',
		'chat',
		'gallery',
		'link',
		'image',
		'quote',
		'status',
		'video',
		'audio',
		'',
	]),
	categories: z.array(z.number()),
	tags: z.array(z.number()),
});

export const TagSchema = z.object({
	id: z.number(),
	count: z.number(),
	description: z.string(),
	link: z.string().url(),
	name: z.string(),
	slug: z.string(),
	taxonomy: z.string(),
	meta: z.array(z.any()).or(z.record(z.any())),
});

export const CategorySchema = TagSchema.extend({
	parent: z.number(),
});

export const SiteSettingsSchema = z.object({
	name: z.string(),
	description: z.string(),
	url: z.string(),
	home: z.string(),
	gmt_offset: z.coerce.number(),
	timezone_string: z.string(),
	site_logo: z.number().optional(),
	site_icon: z.number().optional(),
	site_icon_url: z.string().optional(),
});

export type Page = typeof PageSchema._output;
export type Post = typeof PostSchema._output;
export type Tag = typeof TagSchema._output;
export type Category = typeof CategorySchema._output;
export type SiteSettings = typeof SiteSettingsSchema._output;
