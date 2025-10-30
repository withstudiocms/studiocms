import { Schema } from 'effect';
import {
	BooleanFromNumber,
	ColumnType,
	CreatedAtDate,
	Database,
	DateFromString,
	encodeDatabase,
	JSONObjectFromString,
	StringArrayFromString,
	Table,
} from './core/schema.js';

/**
 * StudioCMS Users Table Definition
 */
export const StudioCMSUsersTable = Table({
	id: Schema.String,
	url: Schema.NullishOr(Schema.String),
	name: Schema.String,
	email: Schema.NullishOr(Schema.String),
	avatar: Schema.NullishOr(Schema.String),
	username: Schema.String,
	password: Schema.NullishOr(Schema.String),
	updatedAt: DateFromString,
	createdAt: CreatedAtDate,
	emailVerified: BooleanFromNumber,
	notifications: Schema.NullishOr(Schema.String),
});

/**
 * StudioCMS OAuth Accounts Table Definition
 */
export const StudioCMSOAuthAccounts = Table({
	providerUserId: Schema.String,
	provider: Schema.String,
	userId: Schema.String,
});

/**
 * StudioCMS Sessions Table Definition
 */
export const StudioCMSSessionTable = Table({
	id: Schema.String,
	userId: Schema.String,
	expiresAt: DateFromString,
});

/**
 * StudioCMS Permissions Table Definition
 */
export const StudioCMSPermissions = Table({
	user: Schema.String,
	rank: Schema.Literal('owner', 'admin', 'editor', 'visitor', 'unknown'),
});

/**
 * StudioCMS API Keys Table Definition
 */
export const StudioCMSAPIKeys = Table({
	id: Schema.String,
	userId: Schema.String,
	key: Schema.String,
	creationDate: CreatedAtDate,
	description: Schema.NullishOr(Schema.String),
});

/**
 * StudioCMS User Reset Tokens Table Definition
 */
export const StudioCMSUserResetTokens = Table({
	id: Schema.String,
	userId: Schema.String,
	token: Schema.String,
});

/**
 * StudioCMS Page Folder Structure Table Definition
 */
export const StudioCMSPageFolderStructure = Table({
	id: Schema.String,
	name: Schema.String,
	parent: Schema.NullishOr(Schema.String),
});

/**
 * StudioCMS Page Data Table Definition
 */
export const StudioCMSPageData = Table({
	id: Schema.String,
	package: Schema.String,
	title: Schema.String,
	description: Schema.String,
	showOnNav: BooleanFromNumber,
	publishedAt: DateFromString,
	updatedAt: DateFromString,
	slug: Schema.String,
	contentLang: Schema.String,
	heroImage: Schema.NullishOr(Schema.String),
	categories: ColumnType(StringArrayFromString, Schema.String, Schema.String),
	tags: ColumnType(StringArrayFromString, Schema.String, Schema.String),
	authorId: Schema.String,
	contributorIds: ColumnType(StringArrayFromString, Schema.String, Schema.String),
	showAuthor: BooleanFromNumber,
	showContributors: BooleanFromNumber,
	parentFolder: Schema.NullishOr(Schema.String),
	draft: BooleanFromNumber,
	augments: ColumnType(StringArrayFromString, Schema.String, Schema.String),
});

/**
 * StudioCMS Diff Tracking Table Definition
 */
export const StudioCMSDiffTracking = Table({
	id: Schema.String,
	userId: Schema.String,
	pageId: Schema.String,
	timestamp: CreatedAtDate,
	pageMetaData: ColumnType(JSONObjectFromString, Schema.String, Schema.String),
	pageContentStart: Schema.String,
	diff: Schema.NullishOr(Schema.String),
});

/**
 * StudioCMS Page Data Tags Table Definition
 */
export const StudioCMSPageDataTags = Table({
	id: Schema.Number,
	description: Schema.String,
	name: Schema.String,
	slug: Schema.String,
	meta: ColumnType(JSONObjectFromString, Schema.String, Schema.String),
});

/**
 * StudioCMS Page Data Categories Table Definition
 */
export const StudioCMSPageDataCategories = Table({
	id: Schema.Number,
	parent: Schema.NullishOr(Schema.Number),
	description: Schema.String,
	name: Schema.String,
	slug: Schema.String,
	meta: ColumnType(JSONObjectFromString, Schema.String, Schema.String),
});

/**
 * StudioCMS Page Content Table Definition
 */
export const StudioCMSPageContent = Table({
	id: Schema.String,
	contentId: Schema.String,
	contentLang: Schema.String,
	content: Schema.String,
});

/**
 * StudioCMS Email Verification Tokens Table Definition
 */
export const StudioCMSEmailVerificationTokens = Table({
	id: Schema.String,
	userId: Schema.String,
	token: Schema.String,
	expiresAt: DateFromString,
});

/**
 * StudioCMS Plugin Data Table Definition
 */
export const StudioCMSPluginData = Table({
	id: Schema.String,
	data: ColumnType(JSONObjectFromString, Schema.String, Schema.String),
});

/**
 * StudioCMS Dynamic Config Settings Table Definition
 */
export const StudioCMSDynamicConfigSettings = Table({
	id: Schema.String,
	data: ColumnType(JSONObjectFromString, Schema.String, Schema.String),
});

/**
 * Complete StudioCMS Database Schema Definition
 */
export const StudioCMSDatabaseSchema = Database({
	StudioCMSUsersTable,
	StudioCMSOAuthAccounts,
	StudioCMSSessionTable,
	StudioCMSAPIKeys,
	StudioCMSUserResetTokens,
	StudioCMSPermissions,
	StudioCMSPageFolderStructure,
	StudioCMSPageData,
	StudioCMSDiffTracking,
	StudioCMSPageDataTags,
	StudioCMSPageDataCategories,
	StudioCMSPageContent,
	StudioCMSEmailVerificationTokens,
	StudioCMSPluginData,
	StudioCMSDynamicConfigSettings,
});

/**
 * Encoded StudioCMS Database Schema
 */
const StudioCMSDatabaseSchemaEncoded = encodeDatabase(StudioCMSDatabaseSchema);

/**
 * Type representing the StudioCMS Database Schema.
 */
export type StudioCMSDatabaseSchema = typeof StudioCMSDatabaseSchemaEncoded;
