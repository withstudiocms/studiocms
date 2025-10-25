import { type Kysely, sql } from 'kysely';
import type { StudioCMSDatabaseSchema } from '../tables.js';

export async function up(db: Kysely<StudioCMSDatabaseSchema>): Promise<void> {
	// Migration code here
	await db.schema
		.createTable('StudioCMSUsersTable')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('url', 'text')
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('email', 'text')
		.addColumn('avatar', 'text')
		.addColumn('username', 'text', (col) => col.notNull())
		.addColumn('password', 'text')
		.addColumn('updatedAt', 'text', (col) => col.notNull())
		.addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('emailVerified', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('notifications', 'text')
		.execute();

	await db.schema
		.createTable('StudioCMSOAuthAccounts')
		.addColumn('providerUserId', 'text', (col) => col.notNull())
		.addColumn('provider', 'text', (col) => col.notNull())
		.addColumn('userId', 'text', (col) => col.notNull().references('StudioCMSUsersTable.id'))
		.execute();

	await db.schema
		.createTable('StudioCMSSessionTable')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('userId', 'text', (col) => col.notNull().references('StudioCMSUsersTable.id'))
		.addColumn('expiresAt', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('StudioCMSPermissions')
		.addColumn('user', 'text', (col) => col.notNull().references('StudioCMSUsersTable.id'))
		.addColumn(
			'permissions',
			'text',
			(col) => col.notNull() // In a real migration, consider using an enum type if supported
		)
		.execute();

	await db.schema
		.createTable('StudioCMSAPIKeys')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('userId', 'text', (col) => col.notNull().references('StudioCMSUsersTable.id'))
		.addColumn('key', 'text', (col) => col.notNull())
		.addColumn('creationDate', 'text', (col) => col.notNull())
		.addColumn('description', 'text')
		.execute();

	await db.schema
		.createTable('StudioCMSUserResetTokens')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('userId', 'text', (col) => col.notNull().references('StudioCMSUsersTable.id'))
		.addColumn('token', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('StudioCMSPageFolderStructure')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('parent', 'text')
		.execute();

	await db.schema
		.createTable('StudioCMSPageData')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('package', 'text', (col) => col.notNull())
		.addColumn('title', 'text', (col) => col.notNull())
		.addColumn('description', 'text', (col) => col.notNull())
		.addColumn('showOnNav', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('publishedAt', 'text')
		.addColumn('updatedAt', 'text', (col) => col.notNull())
		.addColumn('slug', 'text', (col) => col.notNull())
		.addColumn('contentLang', 'text', (col) => col.notNull())
		.addColumn('heroImage', 'text')
		.addColumn('categories', 'text', (col) => col.notNull().defaultTo(JSON.stringify([])))
		.addColumn('tags', 'text', (col) => col.notNull().defaultTo(JSON.stringify([])))
		.addColumn('authorId', 'text', (col) => col.notNull())
		.addColumn('contributorIds', 'text', (col) => col.notNull().defaultTo(JSON.stringify([])))
		.addColumn('showAuthor', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('showContributors', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('parentFolder', 'text')
		.addColumn('draft', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('augments', 'text', (col) => col.notNull().defaultTo(JSON.stringify([])))
		.execute();

	await db.schema
		.createTable('StudioCMSDiffTracking')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('pageId', 'text', (col) => col.notNull().references('StudioCMSPageData.id'))
		.addColumn('userId', 'text', (col) => col.notNull().references('StudioCMSUsersTable.id'))
		.addColumn('timestamp', 'text', (col) => col.notNull())
		.addColumn('pageMetaData', 'text', (col) => col.notNull())
		.addColumn('pageContentStart', 'text', (col) => col.notNull())
		.addColumn('diff', 'text')
		.execute();

	await db.schema
		.createTable('StudioCMSPageDataTags')
		.addColumn('id', 'integer', (col) => col.primaryKey())
		.addColumn('description', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('slug', 'text', (col) => col.notNull())
		.addColumn('meta', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('StudioCMSPageDataCategories')
		.addColumn('id', 'integer', (col) => col.primaryKey())
		.addColumn('parent', 'integer')
		.addColumn('description', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('slug', 'text', (col) => col.notNull())
		.addColumn('meta', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('StudioCMSPageContent')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('contentId', 'text', (col) => col.notNull().references('StudioCMSPageData.id'))
		.addColumn('contentLang', 'text', (col) => col.notNull())
		.addColumn('content', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('StudioCMSEmailVerificationTokens')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('userId', 'text', (col) => col.notNull().references('StudioCMSUsersTable.id'))
		.addColumn('token', 'text', (col) => col.notNull())
		.addColumn('expiresAt', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('StudioCMSPluginData')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('data', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('StudioCMSDynamicConfigSettings')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('data', 'text', (col) => col.notNull())
		.execute();

	// DEPRECATED TABLES - to be removed in future migrations
	await db.schema
		.createTable('StudioCMSSiteConfig')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('title', 'text', (col) => col.notNull())
		.addColumn('description', 'text', (col) => col.notNull())
		.addColumn('defaultOgImage', 'text')
		.addColumn('siteIcon', 'text')
		.addColumn('loginPageBackground', 'text', (col) => col.notNull().defaultTo('studiocms-curves'))
		.addColumn('loginPageCustomImage', 'text')
		.addColumn('enableDiffs', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('diffPerPage', 'integer', (col) => col.notNull().defaultTo(10))
		.addColumn('gridItems', 'text', (col) => col.notNull().defaultTo(JSON.stringify([])))
		.addColumn('enableMailer', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('hideDefaultIndex', 'integer', (col) => col.notNull().defaultTo(0))
		.execute();

	await db.schema
		.createTable('StudioCMSMailerConfig')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('host', 'text', (col) => col.notNull())
		.addColumn('port', 'integer', (col) => col.notNull())
		.addColumn('secure', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('proxy', 'text')
		.addColumn('auth_user', 'text')
		.addColumn('auth_password', 'text')
		.addColumn('tls_rejectUnauthorized', 'integer')
		.addColumn('tls_servername', 'text')
		.addColumn('default_sender', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('StudioCMSNotificationSettings')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('emailVerification', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('requireAdminVerification', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('requireEditorVerification', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('oAuthBypassVerification', 'integer', (col) => col.notNull().defaultTo(0))
		.execute();
}

export async function down(db: Kysely<StudioCMSDatabaseSchema>): Promise<void> {
	// Rollback code here
	await db.schema.dropTable('StudioCMSUsersTable').execute();
	await db.schema.dropTable('StudioCMSOAuthAccounts').execute();
	await db.schema.dropTable('StudioCMSSessionTable').execute();
	await db.schema.dropTable('StudioCMSPermissions').execute();
	await db.schema.dropTable('StudioCMSAPIKeys').execute();
	await db.schema.dropTable('StudioCMSUserResetTokens').execute();
	await db.schema.dropTable('StudioCMSPageFolderStructure').execute();
	await db.schema.dropTable('StudioCMSPageData').execute();
	await db.schema.dropTable('StudioCMSDiffTracking').execute();
	await db.schema.dropTable('StudioCMSPageDataTags').execute();
	await db.schema.dropTable('StudioCMSPageDataCategories').execute();
	await db.schema.dropTable('StudioCMSPageContent').execute();
	await db.schema.dropTable('StudioCMSEmailVerificationTokens').execute();
	await db.schema.dropTable('StudioCMSPluginData').execute();
	await db.schema.dropTable('StudioCMSDynamicConfigSettings').execute();

	// DEPRECATED TABLES - to be removed in future migrations
	await db.schema.dropTable('StudioCMSSiteConfig').execute();
	await db.schema.dropTable('StudioCMSMailerConfig').execute();
	await db.schema.dropTable('StudioCMSNotificationSettings').execute();
}
