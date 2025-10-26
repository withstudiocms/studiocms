/**
 * - Title: Initial setup of StudioCMS database schema
 * - Created: Oct. 25, 2025
 * - Author: Adam Matthiesen (@Adammatthiesen)
 * - GitHub PR: #963
 * - Description: This migration initializes the database schema for StudioCMS,
 *   creating all necessary tables for users, sessions, permissions, pages, and more.
 *
 *   This re-creates the original AstroDB schema within Kysely to ensure compatibility
 *   with existing installations while transitioning to Kysely as the database layer.
 */

import type { Kysely } from 'kysely';
import type { StudioCMSDatabaseSchema } from '../tables.js';
import {
	getPreviousMigrationSchema,
	rollbackMigration,
	syncDatabaseSchema,
	type TableDefinition,
} from '../utils/migrator-utils.js';

// ============================================================================
// DYNAMIC SCHEMA DEFINITION
// ============================================================================
// Define your entire database schema here. The sync function will automatically
// create tables and add missing columns based on this configuration.
// This allows each migration to represent the full desired state of the database
// at that point in time, simplifying schema management and evolution.
// ============================================================================

export const schemaDefinition: TableDefinition[] = [
	{
		name: 'StudioCMSUsersTable',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{ name: 'url', type: 'text' },
			{ name: 'name', type: 'text', notNull: true },
			{ name: 'email', type: 'text' },
			{ name: 'avatar', type: 'text' },
			{ name: 'username', type: 'text', notNull: true },
			{ name: 'password', type: 'text' },
			{ name: 'updatedAt', type: 'text', notNull: true },
			{ name: 'createdAt', type: 'text', notNull: true, defaultSQL: 'CURRENT_TIMESTAMP' },
			{ name: 'emailVerified', type: 'integer', notNull: true, default: 0 },
			{ name: 'notifications', type: 'text' },
		],
	},
	{
		name: 'StudioCMSOAuthAccounts',
		columns: [
			{ name: 'providerUserId', type: 'text', notNull: true },
			{ name: 'provider', type: 'text', notNull: true },
			{
				name: 'userId',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSUsersTable', column: 'id' },
			},
		],
	},
	{
		name: 'StudioCMSSessionTable',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{
				name: 'userId',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSUsersTable', column: 'id' },
			},
			{ name: 'expiresAt', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSPermissions',
		columns: [
			{
				name: 'user',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSUsersTable', column: 'id' },
			},
			{ name: 'permissions', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSAPIKeys',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{
				name: 'userId',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSUsersTable', column: 'id' },
			},
			{ name: 'key', type: 'text', notNull: true },
			{ name: 'creationDate', type: 'text', notNull: true },
			{ name: 'description', type: 'text' },
		],
	},
	{
		name: 'StudioCMSUserResetTokens',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{
				name: 'userId',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSUsersTable', column: 'id' },
			},
			{ name: 'token', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSPageFolderStructure',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{ name: 'name', type: 'text', notNull: true },
			{ name: 'parent', type: 'text' },
		],
	},
	{
		name: 'StudioCMSPageData',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{ name: 'package', type: 'text', notNull: true },
			{ name: 'title', type: 'text', notNull: true },
			{ name: 'description', type: 'text', notNull: true },
			{ name: 'showOnNav', type: 'integer', notNull: true, default: 0 },
			{ name: 'publishedAt', type: 'text' },
			{ name: 'updatedAt', type: 'text', notNull: true },
			{ name: 'slug', type: 'text', notNull: true },
			{ name: 'contentLang', type: 'text', notNull: true },
			{ name: 'heroImage', type: 'text' },
			{ name: 'categories', type: 'text', notNull: true, default: JSON.stringify([]) },
			{ name: 'tags', type: 'text', notNull: true, default: JSON.stringify([]) },
			{ name: 'authorId', type: 'text', notNull: true },
			{ name: 'contributorIds', type: 'text', notNull: true, default: JSON.stringify([]) },
			{ name: 'showAuthor', type: 'integer', notNull: true, default: 0 },
			{ name: 'showContributors', type: 'integer', notNull: true, default: 0 },
			{ name: 'parentFolder', type: 'text' },
			{ name: 'draft', type: 'integer', notNull: true, default: 0 },
			{ name: 'augments', type: 'text', notNull: true, default: JSON.stringify([]) },
		],
	},
	{
		name: 'StudioCMSDiffTracking',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{
				name: 'pageId',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSPageData', column: 'id' },
			},
			{
				name: 'userId',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSUsersTable', column: 'id' },
			},
			{ name: 'timestamp', type: 'text', notNull: true },
			{ name: 'pageMetaData', type: 'text', notNull: true },
			{ name: 'pageContentStart', type: 'text', notNull: true },
			{ name: 'diff', type: 'text' },
		],
	},
	{
		name: 'StudioCMSPageDataTags',
		columns: [
			{ name: 'id', type: 'integer', primaryKey: true },
			{ name: 'description', type: 'text', notNull: true },
			{ name: 'name', type: 'text', notNull: true },
			{ name: 'slug', type: 'text', notNull: true },
			{ name: 'meta', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSPageDataCategories',
		columns: [
			{ name: 'id', type: 'integer', primaryKey: true },
			{ name: 'parent', type: 'integer' },
			{ name: 'description', type: 'text', notNull: true },
			{ name: 'name', type: 'text', notNull: true },
			{ name: 'slug', type: 'text', notNull: true },
			{ name: 'meta', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSPageContent',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{
				name: 'contentId',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSPageData', column: 'id' },
			},
			{ name: 'contentLang', type: 'text', notNull: true },
			{ name: 'content', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSEmailVerificationTokens',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{
				name: 'userId',
				type: 'text',
				notNull: true,
				references: { table: 'StudioCMSUsersTable', column: 'id' },
			},
			{ name: 'token', type: 'text', notNull: true },
			{ name: 'expiresAt', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSPluginData',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{ name: 'data', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSDynamicConfigSettings',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{ name: 'data', type: 'text', notNull: true },
		],
	},
	// DEPRECATED TABLES - to be removed in future migrations
	{
		name: 'StudioCMSSiteConfig',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{ name: 'title', type: 'text', notNull: true },
			{ name: 'description', type: 'text', notNull: true },
			{ name: 'defaultOgImage', type: 'text' },
			{ name: 'siteIcon', type: 'text' },
			{ name: 'loginPageBackground', type: 'text', notNull: true, default: 'studiocms-curves' },
			{ name: 'loginPageCustomImage', type: 'text' },
			{ name: 'enableDiffs', type: 'integer', notNull: true, default: 0 },
			{ name: 'diffPerPage', type: 'integer', notNull: true, default: 10 },
			{ name: 'gridItems', type: 'text', notNull: true, default: JSON.stringify([]) },
			{ name: 'enableMailer', type: 'integer', notNull: true, default: 0 },
			{ name: 'hideDefaultIndex', type: 'integer', notNull: true, default: 0 },
		],
	},
	{
		name: 'StudioCMSMailerConfig',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{ name: 'host', type: 'text', notNull: true },
			{ name: 'port', type: 'integer', notNull: true },
			{ name: 'secure', type: 'integer', notNull: true, default: 0 },
			{ name: 'proxy', type: 'text' },
			{ name: 'auth_user', type: 'text' },
			{ name: 'auth_password', type: 'text' },
			{ name: 'tls_rejectUnauthorized', type: 'integer' },
			{ name: 'tls_servername', type: 'text' },
			{ name: 'default_sender', type: 'text', notNull: true },
		],
	},
	{
		name: 'StudioCMSNotificationSettings',
		columns: [
			{ name: 'id', type: 'text', primaryKey: true },
			{ name: 'emailVerification', type: 'integer', notNull: true, default: 0 },
			{ name: 'requireAdminVerification', type: 'integer', notNull: true, default: 0 },
			{ name: 'requireEditorVerification', type: 'integer', notNull: true, default: 0 },
			{ name: 'oAuthBypassVerification', type: 'integer', notNull: true, default: 0 },
		],
	},
];

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

// Get previous schema definition from last migration file
const previousSchema = await getPreviousMigrationSchema(null);

// Apply schema changes
export async function up(db: Kysely<StudioCMSDatabaseSchema>): Promise<void> {
	await syncDatabaseSchema(schemaDefinition, previousSchema, db);
}

// Rollback schema changes
export async function down(db: Kysely<StudioCMSDatabaseSchema>): Promise<void> {
	await rollbackMigration(schemaDefinition, previousSchema, db);
}
