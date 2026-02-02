import {
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSUsersTable,
} from '@withstudiocms/sdk/tables';
import * as Schema from 'effect/Schema';
import { StudioCMSDynamicSiteConfigData } from '../rest-api/schemas.js';

/**
 * Standard error response schema for the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export const errorResponseSchema = Schema.Struct({
	error: Schema.String,
}).annotations({
	title: 'Error Response',
	description: 'Standard error response schema for the StudioCMS Dashboard API.',
});

/**
 * Standard success response schema for the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema defines the structure of success responses returned by the API.
 * It includes a single property:
 * - `message`: A string message confirming the success of the operation.
 */
export const successResponseSchema = Schema.Struct({
	message: Schema.String,
}).annotations({
	title: 'Success Response',
	description: 'Standard success response schema for the StudioCMS Dashboard API.',
});

/**
 * Partial schema for StudioCMS Page Data used in create and update operations.
 *
 * @remarks
 * This schema includes optional fields from the StudioCMSPageData schema,
 * allowing for partial updates and creation of new pages.
 *
 * > Note: This exists because of limitations with Effect's Schema.partial and Schema.Struct spreading.
 */
export const PartialStudioCMSPageData = Schema.Struct({
	id: Schema.String,
	package: Schema.optional(Schema.String),
	title: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	showOnNav: Schema.optional(Schema.Boolean),
	publishedAt: Schema.optional(Schema.Date),
	updatedAt: Schema.optional(Schema.Date),
	slug: Schema.optional(Schema.String),
	contentLang: Schema.optional(Schema.String),
	heroImage: Schema.optional(Schema.NullOr(Schema.String)),
	categories: Schema.optional(Schema.Array(Schema.String)),
	tags: Schema.optional(Schema.Array(Schema.String)),
	authorId: Schema.optional(Schema.String),
	contributorIds: Schema.optional(Schema.Array(Schema.String)),
	showAuthor: Schema.optional(Schema.Boolean),
	showContributors: Schema.optional(Schema.Boolean),
	parentFolder: Schema.optional(Schema.NullOr(Schema.String)),
	draft: Schema.optional(Schema.Boolean),
	augments: Schema.optional(Schema.Array(Schema.String)),
});

/**
 * Payload schema for creating a new content page in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when creating a new content page.
 */
export const CreatePagePayload = Schema.partial(StudioCMSPageData.Select.omit('id')).annotations({
	title: 'Create Page Payload',
	description: 'Payload schema for creating a new content page in the StudioCMS Dashboard API.',
});

/**
 * Schema representing a single entry in FormData, which can be either a string or a File.
 */
export const FormDataEntry = Schema.declare(
	(input: unknown): input is FormDataEntryValue =>
		input instanceof File || typeof input === 'string',
	{
		identifier: 'FormDataEntry',
		description: 'The `FormDataEntryValue` type in JavaScript',
	}
);

/**
 * Update Page Payload schema for updating an existing content page in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema extends the CreatePagePayload schema and includes additional fields
 * required for updating an existing content page.
 */
export const UpdatePagePayload = Schema.Struct({
	...PartialStudioCMSPageData.fields,
	contentId: Schema.String,
	content: Schema.String,
	pluginFields: Schema.Record({
		key: Schema.String,
		value: Schema.NullOr(FormDataEntry),
	}).annotations({
		title: 'Plugin Fields',
		description:
			'A record of plugin-specific fields for the content page, where each key is a string and the value can be a string or a File.',
		jsonSchema: {
			type: 'File or String',
		},
	}),
	augments: Schema.optional(Schema.Array(Schema.String)),
}).annotations({
	title: 'Update Page Payload',
	description:
		'Payload schema for updating an existing content page in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for deleting an existing content page in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when deleting an existing content page.
 */
export const DeletePagePayload = Schema.Struct({
	id: Schema.String,
	slug: Schema.optional(Schema.String),
}).annotations({
	title: 'Delete Page Payload',
	description:
		'Payload schema for deleting an existing content page in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for creating a new folder in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when creating a new folder.
 */
export const CreateFolderPayload = Schema.Struct({
	folderName: Schema.String,
	parentFolder: Schema.NullOr(Schema.String),
}).annotations({
	title: 'Create Folder Payload',
	description: 'Payload schema for creating a new folder in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for deleting an existing folder in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when deleting an existing folder.
 */
export const DeleteFolderPayload = Schema.Struct({
	id: Schema.String,
}).annotations({
	title: 'Delete Folder Payload',
	description: 'Payload schema for deleting an existing folder in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for updating an existing folder in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema combines the fields from CreateFolderPayload and DeleteFolderPayload
 * to be used as the request payload when updating an existing folder.
 */
export const UpdateFolderPayload = Schema.Struct({
	...CreateFolderPayload.fields,
	...DeleteFolderPayload.fields,
}).annotations({
	title: 'Update Folder Payload',
	description: 'Payload schema for updating an existing folder in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for requesting a content diff in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when requesting a content diff.
 */
export const contentDiffPostPayload = Schema.Struct({
	id: Schema.String,
	type: Schema.Literal('data', 'content', 'both'),
}).annotations({
	title: 'Content Diff Post Payload',
	description: 'Payload schema for requesting a content diff in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for sending a test email to verify the mailer service in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when sending a test email.
 */
export const MailerTestEmailPayload = Schema.Struct({
	test_email: Schema.String,
}).annotations({
	title: 'Mailer Test Email Payload',
	description:
		'Payload schema for sending a test email to verify the mailer service is functioning correctly in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for SMTP configuration in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when setting up or updating SMTP configuration.
 */
export const MailerSmtpConfigPayload = Schema.Struct({
	port: Schema.Number,
	host: Schema.String,
	secure: Schema.Boolean,
	proxy: Schema.NullOr(Schema.String),
	auth_user: Schema.NullOr(Schema.String),
	auth_pass: Schema.NullOr(Schema.String),
	tls_rejectUnauthorized: Schema.NullOr(Schema.Boolean),
	tls_servername: Schema.NullOr(Schema.String),
	default_sender: Schema.String,
}).annotations({
	title: 'Mailer SMTP Configuration Payload',
	description:
		'Payload schema for setting up or updating SMTP configuration in the StudioCMS Dashboard API.',
});

/**
 * Path parameter schema for plugin routes in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema defines the structure of the path parameters used in plugin-related API routes.
 */
export const PluginPathParamSchema = Schema.Struct({
	plugin: Schema.String,
}).annotations({
	title: 'Plugin Path Parameter Schema',
	description: 'Schema for the plugin path parameter in StudioCMS Dashboard API routes.',
});

/**
 * Payload schema for plugin settings in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when saving plugin settings.
 */
export const PluginSettingsPayload = Schema.Record({
	key: Schema.String,
	value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean, Schema.Null),
}).annotations({
	title: 'Plugin Settings Payload',
	description:
		'Schema for the plugin settings payload in StudioCMS Dashboard API routes. Plugin settings are represented as key-value pairs where the value can be a string, number, boolean, or null. This flexible structure allows for various types of settings to be stored and managed for different plugins.',
});

/**
 * Payload schema for creating a new API token in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when creating a new API token.
 */
export const CreateApiTokenPayload = Schema.Struct({
	name: Schema.String,
	description: Schema.String,
}).annotations({
	title: 'Create API Token Payload',
	description: 'Payload schema for creating a new API token in the StudioCMS Dashboard API.',
});

/**
 * Response schema for creating a new API token in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema defines the structure of the response returned when a new API token is created.
 */
export const CreateApiTokenResponse = Schema.Struct({
	token: Schema.String,
}).annotations({
	title: 'Create API Token Response',
	description: 'Response schema for creating a new API token in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for deleting an existing API token in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when deleting an existing API token.
 */
export const DeleteApiTokenPayload = Schema.Struct({
	tokenID: Schema.String,
	userID: Schema.String,
}).annotations({
	title: 'Delete API Token Payload',
	description: 'Payload schema for deleting an existing API token in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for updating the dynamic site configuration in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when updating the dynamic site configuration.
 */
export const UpdateConfigPayload = StudioCMSDynamicSiteConfigData.omit(
	'_config_version'
).annotations({
	title: 'Update Dynamic Site Configuration Payload',
	description:
		'Payload schema for updating the dynamic site configuration in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for creating a password reset link in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when creating a password reset link for a user.
 */
export const CreateResetLinkPayload = Schema.Struct({
	userId: Schema.String,
}).annotations({
	title: 'Create Password Reset Link Payload',
	description:
		'Payload schema for creating a password reset link for a user in the StudioCMS Dashboard API.',
});

/**
 * Base schema for creating a user or user invite in the StudioCMS Dashboard API.
 */
export const CreateUserBaseSchema = Schema.Struct({
	username: Schema.String,
	email: Schema.String,
	displayname: Schema.String,
	rank: Schema.Literal('editor', 'admin', 'owner', 'unknown', 'visitor'),
	originalUrl: Schema.String,
});

/**
 * Payload schema for creating a user invite in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when creating a user invite.
 */
export const CreateUserInvitePayload = CreateUserBaseSchema.annotations({
	title: 'Create User Invite Payload',
	description: 'Payload schema for creating a user invite in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for creating a user in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when creating a new user.
 */
export const CreateUserPayload = CreateUserBaseSchema.annotations({
	title: 'Create User Payload',
	description: 'Payload schema for creating a user in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for updating email notification settings in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when updating email notification settings.
 */
export const EmailNotificationSettingsPayload = Schema.Struct({
	emailVerification: Schema.optional(Schema.Boolean),
	requireAdminVerification: Schema.optional(Schema.Boolean),
	requireEditorVerification: Schema.optional(Schema.Boolean),
	oAuthBypassVerification: Schema.optional(Schema.Boolean),
}).annotations({
	title: 'Email Notification Settings Payload',
	description:
		'Payload schema for updating email notification settings in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for updating user profile information in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when updating user profile information.
 */
export const BasicUserProfileUpdate = Schema.Struct({
	mode: Schema.Literal('basic'),
	data: StudioCMSUsersTable.Update.omit('id'),
}).annotations({
	title: 'Basic User Profile Update Payload',
	description:
		'Payload schema for updating basic user profile information in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for updating user password in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when updating a user's password.
 */
export const PasswordProfileUpdate = Schema.Struct({
	mode: Schema.Literal('password'),
	data: Schema.Struct({
		currentPassword: Schema.NullOr(Schema.String),
		newPassword: Schema.String,
		confirmNewPassword: Schema.String,
	}),
}).annotations({
	title: 'Password User Profile Update Payload',
	description: 'Payload schema for updating user password in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for updating user avatar in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when updating a user's avatar.
 */
export const AvatarProfileUpdate = Schema.Struct({
	mode: Schema.Literal('avatar'),
}).annotations({
	title: 'Avatar User Profile Update Payload',
	description: 'Payload schema for updating user avatar in the StudioCMS Dashboard API.',
});

/**
 * Combined payload schema for updating user profile information in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is a union of the different user profile update payloads,
 * allowing for various types of profile updates.
 */
export const UpdateUserProfilePayload = Schema.Union(
	BasicUserProfileUpdate,
	PasswordProfileUpdate,
	AvatarProfileUpdate
).annotations({
	title: 'User Profile Update Payload',
	description: 'Payload schema for updating user profile in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for resending the verification email in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when resending a verification email to a user.
 */
export const ResendVerifyEmailPayload = Schema.Struct({
	userId: Schema.String,
}).annotations({
	title: 'Resend Verify Email Payload',
	description:
		'Payload schema for resending the verification email to a user in the StudioCMS Dashboard API.',
});

/**
 * URL parameters schema for verifying user email in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema defines the structure of the URL parameters used when verifying a user's email.
 */
export const verifyEmailParams = Schema.Struct({
	token: Schema.String,
	userId: Schema.String,
}).annotations({
	title: 'Verify Email URL Parameters',
	description: 'URL parameters schema for verifying user email in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for resetting a user password in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema is used as the request payload when resetting a user's password.
 */
export const ResetPasswordPayload = Schema.Struct({
	token: Schema.String,
	id: Schema.String,
	userid: Schema.String,
	password: Schema.String,
	confirm_password: Schema.String,
}).annotations({
	title: 'Reset Password Payload',
	description: 'Payload schema for resetting a user password in the StudioCMS Dashboard API.',
});

/**
 * Schema representing a single item in the search results list.
 */
export const SearchListItem = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	slug: Schema.optional(Schema.String),
	type: Schema.Literal('folder', 'page'),
	isDraft: Schema.optional(Schema.NullOr(Schema.Boolean)),
}).annotations({
	title: 'Search List Item',
	description:
		'Schema representing a single item in the search results list, which can be either a folder or a page.',
});

/**
 * Response schema for the search list endpoint in the StudioCMS Dashboard API.
 *
 * @remarks
 * This schema defines the structure of the response returned by the search list endpoint,
 * which is an array of search list items.
 */
export const SearchListResponse = Schema.Array(SearchListItem).annotations({
	title: 'Search List Response',
	description:
		'Response schema for the search list endpoint, returning an array of search list items.',
});

/**
 * Payload schema for creating or editing taxonomy entries (tags or categories) in the StudioCMS Dashboard API.
 */
const modeSelectorSchema = Schema.Struct({
	mode: Schema.Literal('create', 'edit'),
});

/**
 * Payload schema for taxonomy tag data in the StudioCMS Dashboard API.
 */
const TaxonomyTagData = Schema.Struct({
	...modeSelectorSchema.fields,
	...StudioCMSPageDataTags.Select.fields,
	type: Schema.Literal('tags'),
}).annotations({
	title: 'Taxonomy Tag Data',
	description:
		'Schema representing taxonomy tag data for creating or editing tags in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for taxonomy category data in the StudioCMS Dashboard API.
 */
const TaxonomyCategoryData = Schema.Struct({
	...modeSelectorSchema.fields,
	...StudioCMSPageDataCategories.Select.fields,
	type: Schema.Literal('categories'),
}).annotations({
	title: 'Taxonomy Category Data',
	description:
		'Schema representing taxonomy category data for creating or editing categories in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for creating or editing taxonomy entries (tags or categories) in the StudioCMS Dashboard API.
 */
export const TaxonomyPostPayload = Schema.Union(TaxonomyTagData, TaxonomyCategoryData).annotations({
	title: 'Taxonomy Post Payload',
	description:
		'Payload schema for creating or editing taxonomy entries (tags or categories) in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for deleting taxonomy entries (tags or categories) in the StudioCMS Dashboard API.
 */
export const TaxonomyDeletePayload = Schema.Struct({
	type: Schema.Literal('tags', 'categories'),
	id: Schema.Number,
}).annotations({
	title: 'Taxonomy Delete Payload',
	description:
		'Payload schema for deleting taxonomy entries (tags or categories) in the StudioCMS Dashboard API.',
});

/**
 * Fields schema for a taxonomy node in the StudioCMS Dashboard API.
 */
export const taxonomyNodeFields = {
	id: Schema.Number,
	name: Schema.String,
	slug: Schema.String,
	description: Schema.String,
	meta: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	parent: Schema.NullishOr(Schema.Number),
	type: Schema.Literal('tag', 'category'),
};

/**
 * Schema representing a taxonomy node, which can be a tag or category, including its hierarchical structure.
 */
export interface TaxonomyNode extends Schema.Struct.Type<typeof taxonomyNodeFields> {
	readonly children: ReadonlyArray<TaxonomyNode>;
}

/**
 * Schema representing a taxonomy node, which can be a tag or category, including its hierarchical structure.
 */
export const TaxonomyNode = Schema.Struct({
	...taxonomyNodeFields,
	children: Schema.Array(
		Schema.suspend((): Schema.Schema<TaxonomyNode> => TaxonomyNode).annotations({
			title: 'Children Taxonomy Nodes',
			description: 'An array of child taxonomy nodes (tags or categories).',
			identifier: 'ChildrenTaxonomyNodes',
		})
	),
}).annotations({
	title: 'Taxonomy Node',
	description:
		'Schema representing a taxonomy node, which can be a tag or category, including its hierarchical structure.',
});

/**
 * Response schema for searching taxonomy entries (tags or categories) in the StudioCMS Dashboard API.
 */
export const TaxonomySearchResponse = Schema.Array(TaxonomyNode).annotations({
	title: 'Taxonomy Search Response',
	description:
		'Response schema for searching taxonomy entries (tags or categories) in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for updating user notification settings in the StudioCMS Dashboard API.
 */
export const UpdateUserNotificationsPayload = Schema.Struct({
	id: Schema.String,
	notifications: Schema.String,
}).annotations({
	title: 'Update User Notifications Payload',
	description:
		'Payload schema for updating user notification settings in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for updating user information in the StudioCMS Dashboard API.
 */
export const UsersPostPayload = Schema.Struct({
	id: Schema.String,
	rank: Schema.Literal('editor', 'admin', 'owner', 'unknown', 'visitor'),
	emailVerified: Schema.Boolean,
}).annotations({
	title: 'Users Post Payload',
	description: 'Payload schema for updating user information in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for deleting a user in the StudioCMS Dashboard API.
 */
export const UsersDeletePayload = Schema.Struct({
	userId: Schema.String,
	username: Schema.String,
	usernameConfirm: Schema.String,
}).annotations({
	title: 'Delete User Payload',
	description: 'Payload schema for deleting a user in the StudioCMS Dashboard API.',
});

/**
 * Payload schema for verifying user session in the StudioCMS Dashboard API.
 */
export const verifySessionPayload = Schema.Struct({
	originPathname: Schema.String,
}).annotations({
	title: 'Verify Session Payload',
	description: 'Payload schema for verifying user session in the StudioCMS Dashboard API.',
});

/**
 * Response schema for verifying user session in the StudioCMS Dashboard API.
 */
export const verifySessionResponse = Schema.Struct({
	isLoggedIn: Schema.Boolean,
	user: Schema.NullOr(
		Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			email: Schema.NullOr(Schema.String),
			avatar: Schema.NullOr(Schema.String),
			username: Schema.String,
		})
	),
	permissionLevel: Schema.Literal('owner', 'admin', 'editor', 'visitor', 'unknown'),
	routes: Schema.Struct({
		logout: Schema.String,
		userProfile: Schema.String,
		contentManagement: Schema.String,
		dashboardIndex: Schema.String,
	}),
}).annotations({
	title: 'Verify Session Response',
	description: 'Response schema for verifying user session in the StudioCMS Dashboard API.',
});
