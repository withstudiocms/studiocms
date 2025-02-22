import { z } from 'astro/zod';

/**
 * Enum schema representing the possible states of an entity being either 'open', 'closed', or an empty string.
 * This schema is used to validate and enforce that the state can only be one of these three values.
 */
const OpenClosedSchema = z.enum(['open', 'closed', '']);

/**
 * Schema definition for a WordPress Page object.
 *
 * This schema validates the structure of a WordPress Page object, ensuring that
 * all required fields are present and have the correct types.
 *
 * Properties:
 * - `id`: The unique identifier for the page (number).
 * - `date`: The date the page was created (Date).
 * - `date_gmt`: The date the page was created in GMT (Date).
 * - `guid`: The globally unique identifier for the page, containing a rendered string.
 * - `modified`: The date the page was last modified (Date).
 * - `modified_gmt`: The date the page was last modified in GMT (Date).
 * - `slug`: The URL-friendly slug for the page (string).
 * - `status`: The status of the page, which can be 'publish', 'future', 'draft', 'pending', or 'private'.
 * - `type`: The type of the page (string).
 * - `title`: The title of the page, containing a rendered string.
 * - `content`: The content of the page, containing a rendered string and a boolean indicating if it is protected.
 * - `excerpt`: The excerpt of the page, containing a rendered string and a boolean indicating if it is protected.
 * - `author`: The ID of the author of the page (number).
 * - `featured_media`: The ID of the featured media for the page (number).
 * - `parent`: The ID of the parent page (number).
 * - `menu_order`: The order of the page in the menu (number).
 * - `comment_status`: The comment status of the page, which can be 'open' or 'closed'.
 * - `ping_status`: The ping status of the page, which can be 'open' or 'closed'.
 * - `template`: The template used for the page (string).
 * - `meta`: An array of metadata associated with the page, which can be any type or a record of any type.
 */
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

/**
 * Extends the PageSchema to define the schema for a WordPress Post.
 *
 * Properties:
 * - `format`: Enum representing the format of the post. Possible values are:
 *   - 'standard'
 *   - 'aside'
 *   - 'chat'
 *   - 'gallery'
 *   - 'link'
 *   - 'image'
 *   - 'quote'
 *   - 'status'
 *   - 'video'
 *   - 'audio'
 *   - ''
 * - `categories`: Array of numbers representing the categories assigned to the post.
 * - `tags`: Array of numbers representing the tags assigned to the post.
 */
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

/**
 * Schema for a WordPress Tag object.
 *
 * This schema validates the structure of a WordPress Tag object, ensuring that
 * it contains the following properties:
 *
 * - `id`: A numeric identifier for the tag.
 * - `count`: A numeric count of the number of posts associated with the tag.
 * - `description`: A string description of the tag.
 * - `link`: A URL string linking to the tag.
 * - `name`: A string name of the tag.
 * - `slug`: A string slug for the tag.
 * - `taxonomy`: A string representing the taxonomy type.
 * - `meta`: An array or record of any additional metadata associated with the tag.
 */
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

/**
 * Extends the TagSchema to create a CategorySchema.
 *
 * @property {number} parent - The ID of the parent category.
 */
export const CategorySchema = TagSchema.extend({
	parent: z.number(),
});

/**
 * Schema for site settings in the WordPress API.
 *
 * This schema defines the structure of the site settings object, which includes
 * various properties related to the site's configuration.
 *
 * Properties:
 * - `name`: The name of the site (string).
 * - `description`: A brief description of the site (string).
 * - `url`: The URL of the site (string).
 * - `home`: The home URL of the site (string).
 * - `gmt_offset`: The GMT offset for the site's timezone (number).
 * - `timezone_string`: The timezone string for the site (string).
 * - `site_logo`: The ID of the site's logo (optional number).
 * - `site_icon`: The ID of the site's icon (optional number).
 * - `site_icon_url`: The URL of the site's icon (optional string).
 */
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

/**
 * Represents the type of a Page object as defined by the PageSchema.
 * This type is derived from the output type of the PageSchema.
 */
export type Page = z.infer<typeof PageSchema>;

/**
 * Represents a WordPress post based on the PostSchema.
 *
 * This type is derived from the output type of the PostSchema.
 */
export type Post = z.infer<typeof PostSchema>;

/**
 * Represents a Tag type derived from the TagSchema's output type.
 */
export type Tag = z.infer<typeof TagSchema>;

/**
 * Represents a Category type derived from the output of the CategorySchema.
 */
export type Category = z.infer<typeof CategorySchema>;

/**
 * Represents the settings for a site.
 *
 * This type is derived from the output of the `SiteSettingsSchema`.
 */
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
