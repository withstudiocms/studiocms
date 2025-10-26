import { Schema } from 'effect';
import {
	BooleanFromNumber,
	ColumnType,
	Database,
	encodeDatabase,
	JsonColumnType,
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
	updatedAt: ColumnType(Schema.DateFromString, Schema.String, Schema.String),
	createdAt: ColumnType(Schema.DateFromString, Schema.Never, Schema.Never),
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
	expiresAt: ColumnType(Schema.DateFromString, Schema.String, Schema.String),
});

/**
 * StudioCMS Permissions Table Definition
 */
export const StudioCMSPermissions = Table({
	user: Schema.String,
	permissions: Schema.Literal('owner', 'admin', 'editor', 'visitor', 'unknown'),
});

/**
 * StudioCMS API Keys Table Definition
 */
export const StudioCMSAPIKeys = Table({
	id: Schema.String,
	userId: Schema.String,
	key: Schema.String,
	creationDate: ColumnType(Schema.DateFromString, Schema.String, Schema.Never),
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
	publishedAt: ColumnType(Schema.DateFromString, Schema.String, Schema.String),
	updatedAt: ColumnType(Schema.DateFromString, Schema.String, Schema.String),
	slug: Schema.String,
	contentLang: Schema.String,
	heroImage: Schema.NullishOr(Schema.String),
	categories: JsonColumnType(Schema.Array(Schema.String), Schema.String, Schema.String),
	tags: JsonColumnType(Schema.Array(Schema.String), Schema.String, Schema.String),
	authorId: Schema.String,
	contributorIds: JsonColumnType(Schema.Array(Schema.String), Schema.String, Schema.String),
	showAuthor: BooleanFromNumber,
	showContributors: BooleanFromNumber,
	parentFolder: Schema.NullishOr(Schema.String),
	draft: BooleanFromNumber,
	augments: JsonColumnType(Schema.Array(Schema.String), Schema.String, Schema.String),
});

/**
 * StudioCMS Diff Tracking Table Definition
 */
export const StudioCMSDiffTracking = Table({
	id: Schema.String,
	userId: Schema.String,
	pageId: Schema.String,
	timestamp: ColumnType(Schema.DateFromString, Schema.String, Schema.Never),
	pageMetaData: JsonColumnType(Schema.Object, Schema.String, Schema.String),
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
	meta: JsonColumnType(Schema.Object, Schema.String, Schema.String),
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
	meta: JsonColumnType(Schema.Object, Schema.String, Schema.String),
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
	expiresAt: ColumnType(Schema.DateFromString, Schema.String, Schema.String),
});

/**
 * StudioCMS Plugin Data Table Definition
 */
export const StudioCMSPluginData = Table({
	id: Schema.String,
	data: JsonColumnType(Schema.Object, Schema.String, Schema.String),
});

/**
 * StudioCMS Dynamic Config Settings Table Definition
 */
export const StudioCMSDynamicConfigSettings = Table({
	id: Schema.String,
	data: JsonColumnType(Schema.Object, Schema.String, Schema.String),
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
