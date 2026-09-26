import { Schema } from 'studiocms/effect';

export const OpenClosedSchema = Schema.Union(
	Schema.Literal('open'),
	Schema.Literal('closed'),
	Schema.Literal('')
);

export const StatusSchema = Schema.Union(
	Schema.Literal('publish'),
	Schema.Literal('future'),
	Schema.Literal('draft'),
	Schema.Literal('pending'),
	Schema.Literal('private')
);

export const PostFormatSchema = Schema.Union(
	Schema.Literal('standard'),
	Schema.Literal('aside'),
	Schema.Literal('chat'),
	Schema.Literal('gallery'),
	Schema.Literal('link'),
	Schema.Literal('image'),
	Schema.Literal('quote'),
	Schema.Literal('status'),
	Schema.Literal('video'),
	Schema.Literal('audio'),
	Schema.Literal('')
);

export const MetaDataSchema = Schema.Array(
	Schema.Union(Schema.Any, Schema.Record({ key: Schema.String, value: Schema.Any }))
);

export const RenderedData = Schema.Struct({ rendered: Schema.String });

export const RenderedProtectData = Schema.Struct({
	...RenderedData.fields,
	protected: Schema.Boolean,
});

export const NumberArray = Schema.Array(Schema.Number);

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
export class Page extends Schema.Class<Page>('Page')({
	id: Schema.Number,
	date: Schema.Date,
	date_gmt: Schema.Date,
	guid: RenderedData,
	modified: Schema.Date,
	modified_gmt: Schema.Date,
	slug: Schema.String,
	status: StatusSchema,
	type: Schema.String,
	title: RenderedData,
	content: RenderedProtectData,
	excerpt: RenderedProtectData,
	author: Schema.Number,
	featured_media: Schema.Number,
	parent: Schema.Number,
	menu_order: Schema.Number,
	comment_status: OpenClosedSchema,
	ping_status: OpenClosedSchema,
	template: Schema.String,
	meta: MetaDataSchema,
}) {}

export class PagesSchema extends Schema.Class<PagesSchema>('PagesSchema')({
	pages: Schema.Array(Page),
}) {}

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
export class Post extends Schema.Class<Post>('Post')({
	...Page.fields,
	format: PostFormatSchema,
	categories: NumberArray,
	tags: NumberArray,
}) {}

export class PostsSchema extends Schema.Class<PostsSchema>('PostsSchema')({
	posts: Schema.Array(Post),
}) {}

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
export class Tag extends Schema.Class<Tag>('Tag')({
	id: Schema.Number,
	count: Schema.Number,
	description: Schema.String,
	link: Schema.String,
	name: Schema.String,
	slug: Schema.String,
	taxonomy: Schema.String,
	meta: MetaDataSchema,
}) {}

export class TagsSchema extends Schema.Class<TagsSchema>('TagsSchema')({
	tags: Schema.Array(Tag),
}) {}

/**
 * Extends the TagSchema to create a CategorySchema.
 *
 * @property {number} parent - The ID of the parent category.
 */
export class Category extends Schema.Class<Category>('Category')({
	...Tag.fields,
	parent: Schema.Number,
}) {}

export class CategoriesSchema extends Schema.Class<CategoriesSchema>('CategoriesSchema')({
	categories: Schema.Array(Category),
}) {}

export class SiteSettings extends Schema.Class<SiteSettings>('SiteSettings')({
	name: Schema.String,
	description: Schema.String,
	url: Schema.String,
	home: Schema.String,
	gmt_offset: Schema.Number,
	timezone_string: Schema.String,
	site_logo: Schema.optional(Schema.Number),
	site_icon: Schema.optional(Schema.Number),
	site_icon_url: Schema.optional(Schema.String),
}) {}
