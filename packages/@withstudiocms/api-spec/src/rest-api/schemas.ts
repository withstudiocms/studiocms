import { HttpApiSchema } from '@effect/platform';
import {
	StudioCMSOAuthAccounts,
	StudioCMSPageContent,
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPermissions,
	StudioCMSUsersTable,
} from '@withstudiocms/sdk/tables';
import { Schema } from 'effect';
import { buildPartialSchema } from '../util/build-partial-schema.js';

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

export const UsersV1GetSearchParams = Schema.Struct({
	username: Schema.optional(Schema.String),
	name: Schema.optional(Schema.String),
	rank: Schema.optional(Schema.String),
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

const PageDataStrippedBase = StudioCMSPageData.Select.omit('categories', 'tags', 'contributorIds');
const UsersTableBase = StudioCMSUsersTable.omit('email', 'password');

/**
 * Combined schema for page data with related information.
 */
export const PublicV1GetPagesSelect = Schema.Struct({
	...PageDataStrippedBase.fields,
	contributorIds: Schema.Array(Schema.String),
	categories: Schema.Array(PublicV1CategorySelect),
	tags: Schema.Array(PublicV1TagsSelect),
	multiLangContent: Schema.Array(StudioCMSPageContent.Select),
	defaultContent: Schema.UndefinedOr(StudioCMSPageContent.Select),
	urlRoute: Schema.String,
	authorData: Schema.UndefinedOr(UsersTableBase),
	contributorsData: Schema.Array(UsersTableBase),
});

/**
 * Path parameter for page ID.
 */
export const PublicV1GetPagesIdParam = HttpApiSchema.param('id', Schema.String);

export const StringIdParam = HttpApiSchema.param('id', Schema.String);

/**
 * GET /pages
 * Search parameters for filtering pages.
 */
export const PublicV1GetPagesSearchParams = Schema.Struct({
	title: Schema.optional(Schema.String),
	slug: Schema.optional(Schema.String),
	author: Schema.optional(Schema.String),
	parentFolder: Schema.optional(Schema.String),
});

/**
 * Partial schema for category data.
 */
export const PartialCategories = buildPartialSchema(StudioCMSPageDataCategories.Select);

/**
 * Partial schema for tags data.
 */
export const PartialTags = buildPartialSchema(StudioCMSPageDataTags.Select);

/**
 * Deletion success response schema.
 */
export const DeletionSuccess = Schema.Struct({
	success: Schema.Boolean,
});

/**
 * Success response schema.
 */
export const SuccessResponse = Schema.Struct({
	message: Schema.String,
});

/**
 * Base schema for folder data.
 */
export class FolderBase extends Schema.Class<FolderBase>('FolderBase')({
	folderName: Schema.String,
	parentFolder: Schema.Union(Schema.String, Schema.Null),
}) {}

/**
 * Schema for dynamic site configuration data.
 */
export const StudioCMSDynamicSiteConfigData = Schema.Struct({
	_config_version: Schema.String,
	title: Schema.String,
	description: Schema.String,
	defaultOgImage: Schema.optional(Schema.NullishOr(Schema.String)),
	siteIcon: Schema.optional(Schema.NullishOr(Schema.String)),
	loginPageBackground: Schema.optional(Schema.UndefinedOr(Schema.String)),
	loginPageCustomImage: Schema.optional(Schema.NullishOr(Schema.String)),
	enableDiffs: Schema.optional(Schema.UndefinedOr(Schema.Boolean)),
	diffPerPage: Schema.optional(Schema.UndefinedOr(Schema.Number)),
	gridItems: Schema.optional(Schema.Array(Schema.String)),
	enableMailer: Schema.optional(Schema.UndefinedOr(Schema.Boolean)),
});

/**
 * Schema for dynamic site configuration.
 */
export const StudioCMSDynamicSiteConfigComplete = Schema.Struct({
	id: Schema.String,
	data: StudioCMSDynamicSiteConfigData,
});

/**
 * Base Permission ranks for users.
 */
const UsersPermissionRanksBase = Schema.Literal('owner', 'admin', 'editor', 'visitor');

/**
 * Schema for user data in index.
 */
export class RestUsersIndexJSONData extends Schema.Class<RestUsersIndexJSONData>(
	'RestUsersIndexJSONData'
)({
	username: Schema.Union(Schema.String, Schema.Undefined),
	password: Schema.Union(Schema.String, Schema.Undefined),
	email: Schema.Union(Schema.String, Schema.Undefined),
	displayname: Schema.Union(Schema.String, Schema.Undefined),
	rank: Schema.Union(UsersPermissionRanksBase, Schema.Undefined),
}) {}

/**
 * Schema for user data by ID.
 */
export class RestUsersIdJSONData extends Schema.Class<RestUsersIdJSONData>('RestUsersIdJSONData')({
	rank: Schema.Union(UsersPermissionRanksBase, Schema.Literal('unknown')),
}) {}

/**
 * API-safe user fields, omitting sensitive information.
 */
export const APISafeUserFields = StudioCMSUsersTable.Select.omit(
	'password',
	'emailVerified',
	'notifications'
);

/**
 * Combined schema for user data with OAuth and permissions information.
 */
export const CombinedUserDataSchema = Schema.Struct({
	...APISafeUserFields.fields,
	oAuthData: Schema.UndefinedOr(Schema.Array(StudioCMSOAuthAccounts.Select)),
	permissionsData: Schema.UndefinedOr(StudioCMSPermissions.Select),
});
