import { column, defineTable, NOW } from 'astro:db';
import { asDrizzleTable } from '@astrojs/db/utils';

/** StudioCMS - Users Table for Astro DB */
export const StudioCMSUsers = defineTable({
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

export const StudioCMSAPIKeys = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
		key: column.text(),
		creationDate: column.date({ default: NOW }),
		description: column.text({ optional: true }),
	},
});

export const StudioCMSUserResetTokens = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
		token: column.text(),
	},
});

/** StudioCMS - OAuth Accounts Table for Astro DB */
export const StudioCMSOAuthAccounts = defineTable({
	columns: {
		provider: column.text(), // github, google, discord, auth0
		providerUserId: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
	},
});

/** StudioCMS - Session Table for Astro DB */
export const StudioCMSSessionTable = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id, optional: false }),
		expiresAt: column.date(),
	},
});

/** StudioCMS - Permissions Table for Astro DB */
export const StudioCMSPermissions = defineTable({
	columns: {
		user: column.text({ references: () => StudioCMSUsers.columns.id }),
		rank: column.text(),
	},
});

/** StudioCMS - Page Folder Structure */
export const StudioCMSPageFolderStructure = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		name: column.text(),
		parent: column.text({ optional: true }),
	},
});

/** StudioCMS - Pages Data Table for Astro DB */
export const StudioCMSPageData = defineTable({
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

/** StudioCMS - Diff Tracking Table for Astro DB */
export const StudioCMSDiffTracking = defineTable({
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

/** StudioCMS - Page Data Tags Table for Astro DB */
export const StudioCMSPageDataTags = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		description: column.text(),
		name: column.text(),
		slug: column.text(),
		meta: column.json(),
	},
});

/** StudioCMS - Page Data Categories Table for Astro DB */
export const StudioCMSPageDataCategories = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		parent: column.number({ optional: true }),
		description: column.text(),
		name: column.text(),
		slug: column.text(),
		meta: column.json(),
	},
});

/** StudioCMS - Pages Content Table for Astro DB */
export const StudioCMSPageContent = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		contentId: column.text({ references: () => StudioCMSPageData.columns.id }),
		contentLang: column.text({ default: 'default' }),
		content: column.text({ multiline: true, optional: true }),
	},
});

/** StudioCMS - Site Config Table for Astro DB */
export const StudioCMSSiteConfig = defineTable({
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

export const StudioCMSMailerConfig = defineTable({
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

export const StudioCMSNotificationSettings = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		emailVerification: column.boolean({ default: false }),
		requireAdminVerification: column.boolean({ default: false }),
		requireEditorVerification: column.boolean({ default: false }),
		oAuthBypassVerification: column.boolean({ default: false }),
	},
});

export const StudioCMSEmailVerificationTokens = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
		token: column.text(),
		expiresAt: column.date(),
	},
});

export const StudioCMSPluginData = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		rawData: column.json()
	}
});

export const tables = {
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
};
