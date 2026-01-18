import { HttpApiSchema } from '@effect/platform';
import { StudioCMSPageDataCategories, StudioCMSPageDataTags } from '@withstudiocms/sdk/tables';
import { Schema } from 'effect';

/**
 * Select schema for category data.
 */
export const PublicV1CategorySelect = StudioCMSPageDataCategories.Select;

/**
 * Path parameter for category ID.
 */
export const PublicV1CategoryIdParam = HttpApiSchema.param('id', Schema.NumberFromString);

/**
 * GET /categories
 * Search parameters for filtering categories.
 */
export const PublicV1CategoryGetSearchParams = Schema.Struct({
	name: Schema.optional(Schema.String),
	parent: Schema.optional(Schema.NumberFromString),
});

/**
 * Select schema for tags data.
 */
export const PublicV1TagsSelect = StudioCMSPageDataTags.Select;

/**
 * Path parameter for tags ID.
 */
export const PublicV1TagsIdParam = HttpApiSchema.param('id', Schema.NumberFromString);

/**
 * GET /tags
 * Search parameters for filtering tags.
 */
export const PublicV1TagsGetSearchParams = Schema.Struct({
	name: Schema.optional(Schema.String),
	parent: Schema.optional(Schema.NumberFromString),
});

/**
 * Select schema for folder data.
 */
export const PublicV1FolderSelect = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	parent: Schema.optional(Schema.NullOr(Schema.String)),
});

/**
 * Path parameter for folder ID.
 */
export const PublicV1FolderIdParam = HttpApiSchema.param('id', Schema.String);

/**
 * GET /folders
 * Search parameters for filtering folders.
 */
export const PublicV1FolderGetSearchParams = Schema.Struct({
	name: Schema.optional(Schema.String),
	parent: Schema.optional(Schema.String),
});
