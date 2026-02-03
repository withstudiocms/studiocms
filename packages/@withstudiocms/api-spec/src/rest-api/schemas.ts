import {
	StudioCMSOAuthAccounts,
	StudioCMSPageContent,
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPermissions,
	StudioCMSUsersTable,
} from '@withstudiocms/sdk/tables';
import * as Schema from 'effect/Schema';

/**
 * Standard error response schema for the StudioCMS APIs.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export const errorResponseSchema = Schema.Struct({
	error: Schema.String,
});

/**
 * Select schema for category data.
 */
export const PublicV1CategorySelect = StudioCMSPageDataCategories.Select;

/**
 * Path parameter for ID as number.
 */
export const IdParamNumber = Schema.Struct({
	id: Schema.NumberFromString,
});

/**
 * Path parameter for ID as string.
 */
export const IdParamString = Schema.Struct({
	id: Schema.String,
});

/**
 * Path parameter for diff ID.
 */
export const IdAndDiffIdParam = Schema.Struct({
	...IdParamString.fields,
	diffId: Schema.String,
});

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
 * Secure GET /pages
 * Search parameters for filtering pages with additional secure options.
 */
export const SecureV1GetPagesSearchParams = Schema.Struct({
	...PublicV1GetPagesSearchParams.fields,
	draft: Schema.optional(Schema.BooleanFromString),
	published: Schema.optional(Schema.BooleanFromString),
});

/**
 * Partial schema for category data.
 */
export const PartialCategories = Schema.partial(StudioCMSPageDataCategories.Select);

/**
 * Partial schema for tags data.
 */
export const PartialTags = Schema.partial(StudioCMSPageDataTags.Select);

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

/**
 * Partial schema for page data.
 */
export const RestPageDataPartial = Schema.partial(StudioCMSPageData.Select);

/**
 * Partial schema for page content.
 */
export const RestPageContentPartial = Schema.partial(StudioCMSPageContent.Select);

/**
 * Combined schema for page JSON data including data and content.
 */
export const RestPageJsonData = Schema.Struct({
	data: Schema.optional(RestPageDataPartial),
	content: Schema.optional(RestPageContentPartial),
});

/**
 * Base schema for diff tracking data.
 */
export const DiffTrackingBase = Schema.Struct({
	id: Schema.String,
	userId: Schema.String,
	pageId: Schema.String,
	timestamp: Schema.NullOr(Schema.Date),
	pageContentStart: Schema.String,
	diff: Schema.NullOr(Schema.String),
	pageMetaData: Schema.Unknown,
});

/**
 * Schema for diff tracking return data with selected page metadata.
 */
export const DiffTrackingReturn = Schema.Struct({
	...DiffTrackingBase.omit('pageMetaData').fields,
	pageMetaData: Schema.Struct({
		start: StudioCMSPageData.Select,
		end: StudioCMSPageData.Select,
	}),
});
