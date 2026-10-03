/**
 * - Title: URL Mapping Table Migration
 * - Created: 2025-12-21
 * - Author: Adam Matthiesen
 * - GitHub PR: #1085
 * - Description: This migration creates the URL mapping table to manage URL mappings for the StudioCMS Storage Manager.
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: Requirement from Kysely */

import type { Kysely } from '@withstudiocms/kysely/kysely';
import {
	rollbackMigration,
	syncDatabaseSchema,
	type TableDefinition,
} from '@withstudiocms/kysely/utils/migrator';

import { schemaDefinition as previousSchema } from './20251130T150847_drop_deprecated.js';

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
			{ name: 'rank', type: 'text', notNull: true },
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
	{
		name: 'StudioCMSStorageManagerUrlMappings',
		columns: [
			{ name: 'identifier', type: 'text', primaryKey: true },
			{ name: 'url', type: 'text', notNull: true },
			{ name: 'isPermanent', type: 'integer', notNull: true, default: 0 },
			{ name: 'expiresAt', type: 'integer' },
			{ name: 'createdAt', type: 'integer', notNull: true },
			{ name: 'updatedAt', type: 'integer', notNull: true },
		],
	},
];

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

// Apply schema changes
export async function up(db: Kysely<any>): Promise<void> {
	await syncDatabaseSchema(db, schemaDefinition, previousSchema);
}

// Rollback schema changes
export async function down(db: Kysely<any>): Promise<void> {
	await rollbackMigration(db, schemaDefinition, previousSchema);
}
