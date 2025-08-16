import { column, defineDb, defineTable, NOW } from 'astro:db';
import { asDrizzleTable } from '@astrojs/db/utils';

/** StudioCMS - Users Table for Astro DB */
const StudioCMSUsers = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		url: column.text({ optional: true }),
		name: column.text(),
		email: column.text({ unique: true, optional: true }),
		avatar: column.text({
			optional: true,
			default: 'https://seccdn.libravatar.org/static/img/mm/80.png',
		}),
		username: column.text(),
		password: column.text({ optional: true }),
		updatedAt: column.date({ default: NOW, optional: true }),
		createdAt: column.date({ default: NOW, optional: true }),
		emailVerified: column.boolean({ default: false }),
		notifications: column.text({ optional: true }),
	},
});

export const tsUsers = asDrizzleTable('StudioCMSUsers', StudioCMSUsers);

const StudioCMSAPIKeys = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
		key: column.text(),
		creationDate: column.date({ default: NOW }),
		description: column.text({ optional: true }),
	},
});

export const tsAPIKeys = asDrizzleTable('StudioCMSAPIKeys', StudioCMSAPIKeys);

const StudioCMSUserResetTokens = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
		token: column.text(),
	},
});

export const tsUserResetTokens = asDrizzleTable(
	'StudioCMSUserResetTokens',
	StudioCMSUserResetTokens
);

/** StudioCMS - OAuth Accounts Table for Astro DB */
const StudioCMSOAuthAccounts = defineTable({
	columns: {
		provider: column.text(), // github, google, discord, auth0
		providerUserId: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
	},
});

export const tsOAuthAccounts = asDrizzleTable('StudioCMSOAuthAccounts', StudioCMSOAuthAccounts);

/** StudioCMS - Session Table for Astro DB */
const StudioCMSSessionTable = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id, optional: false }),
		expiresAt: column.date(),
	},
});

export const tsSessionTable = asDrizzleTable('StudioCMSSessionTable', StudioCMSSessionTable);

/** StudioCMS - Permissions Table for Astro DB */
const StudioCMSPermissions = defineTable({
	columns: {
		user: column.text({ references: () => StudioCMSUsers.columns.id }),
		rank: column.text(),
	},
});

export const tsPermissions = asDrizzleTable('StudioCMSPermissions', StudioCMSPermissions);

/** StudioCMS - Page Folder Structure */
const StudioCMSPageFolderStructure = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		name: column.text(),
		parent: column.text({ optional: true }),
	},
});

export const tsPageFolderStructure = asDrizzleTable(
	'StudioCMSPageFolderStructure',
	StudioCMSPageFolderStructure
);

/** StudioCMS - Pages Data Table for Astro DB */
const StudioCMSPageData = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		package: column.text({ default: 'studiocms' }),
		title: column.text(),
		description: column.text(),
		showOnNav: column.boolean({ default: false }),
		publishedAt: column.date({ default: NOW }),
		updatedAt: column.date({ optional: true }),
		slug: column.text(),
		contentLang: column.text({ default: 'default' }),
		heroImage: column.text({
			default:
				'https://images.unsplash.com/photo-1707343843982-f8275f3994c5?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		}),
		categories: column.json({ default: [], optional: true }),
		tags: column.json({ default: [], optional: true }),
		authorId: column.text({ optional: true }),
		contributorIds: column.json({ default: [], optional: true }),
		showAuthor: column.boolean({ default: false, optional: true }),
		showContributors: column.boolean({ default: false, optional: true }),
		parentFolder: column.text({ optional: true }),
		draft: column.boolean({ optional: true }),
	},
});

export const tsPageData = asDrizzleTable('StudioCMSPageData', StudioCMSPageData);

/** StudioCMS - Diff Tracking Table for Astro DB */
const StudioCMSDiffTracking = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
		pageId: column.text({ references: () => StudioCMSPageData.columns.id }),
		timestamp: column.date({ default: NOW, optional: true }),
		pageMetaData: column.json({ optional: true }),
		pageContentStart: column.text({ multiline: true }),
		diff: column.text({ multiline: true, optional: true }),
	},
});

export const tsDiffTracking = asDrizzleTable('StudioCMSDiffTracking', StudioCMSDiffTracking);

/** StudioCMS - Page Data Tags Table for Astro DB */
const StudioCMSPageDataTags = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		description: column.text(),
		name: column.text(),
		slug: column.text(),
		meta: column.json(),
	},
});

export const tsPageDataTags = asDrizzleTable('StudioCMSPageDataTags', StudioCMSPageDataTags);

/** StudioCMS - Page Data Categories Table for Astro DB */
const StudioCMSPageDataCategories = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		parent: column.number({ optional: true }),
		description: column.text(),
		name: column.text(),
		slug: column.text(),
		meta: column.json(),
	},
});

export const tsPageDataCategories = asDrizzleTable(
	'StudioCMSPageDataCategories',
	StudioCMSPageDataCategories
);

/** StudioCMS - Pages Content Table for Astro DB */
const StudioCMSPageContent = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		contentId: column.text({ references: () => StudioCMSPageData.columns.id }),
		contentLang: column.text({ default: 'default' }),
		content: column.text({ multiline: true, optional: true }),
	},
});

export const tsPageContent = asDrizzleTable('StudioCMSPageContent', StudioCMSPageContent);

/** StudioCMS - Site Config Table for Astro DB */
const StudioCMSSiteConfig = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		title: column.text(),
		description: column.text(),
		defaultOgImage: column.text({ optional: true }),
		siteIcon: column.text({ optional: true }),
		loginPageBackground: column.text({ default: 'studiocms-curves' }),
		loginPageCustomImage: column.text({ optional: true }),
		enableDiffs: column.boolean({ default: false }),
		diffPerPage: column.number({ default: 10 }),
		gridItems: column.json({ default: [] }),
		enableMailer: column.boolean({ default: false }),
		hideDefaultIndex: column.boolean({ default: false }),
	},
});

export const tsSiteConfig = asDrizzleTable('StudioCMSSiteConfig', StudioCMSSiteConfig);

const StudioCMSMailerConfig = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		host: column.text(),
		port: column.number(),
		secure: column.boolean(),
		proxy: column.text({ optional: true }),
		auth_user: column.text({ optional: true }),
		auth_pass: column.text({ optional: true }),
		tls_rejectUnauthorized: column.boolean({ optional: true }),
		tls_servername: column.text({ optional: true }),
		default_sender: column.text(),
	},
});

export const tsMailerConfig = asDrizzleTable('StudioCMSMailerConfig', StudioCMSMailerConfig);

const StudioCMSNotificationSettings = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		emailVerification: column.boolean({ default: false }),
		requireAdminVerification: column.boolean({ default: false }),
		requireEditorVerification: column.boolean({ default: false }),
		oAuthBypassVerification: column.boolean({ default: false }),
	},
});

export const tsNotificationSettings = asDrizzleTable(
	'StudioCMSNotificationSettings',
	StudioCMSNotificationSettings
);

const StudioCMSEmailVerificationTokens = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
		token: column.text(),
		expiresAt: column.date(),
	},
});

export const tsEmailVerificationTokens = asDrizzleTable(
	'StudioCMSEmailVerificationTokens',
	StudioCMSEmailVerificationTokens
);

const StudioCMSPluginData = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		data: column.json(),
	},
});

export const tsPluginData = asDrizzleTable('StudioCMSPluginData', StudioCMSPluginData);

// Export the Database Configuration for StudioCMS
export default defineDb({
	tables: {
		StudioCMSPageContent,
		StudioCMSPageData,
		StudioCMSPageDataCategories,
		StudioCMSPageDataTags,
		StudioCMSPermissions,
		StudioCMSSessionTable,
		StudioCMSSiteConfig,
		StudioCMSUsers,
		StudioCMSOAuthAccounts,
		StudioCMSDiffTracking,
		StudioCMSPageFolderStructure,
		StudioCMSUserResetTokens,
		StudioCMSAPIKeys,
		StudioCMSMailerConfig,
		StudioCMSNotificationSettings,
		StudioCMSEmailVerificationTokens,
		StudioCMSPluginData,
	},
});
