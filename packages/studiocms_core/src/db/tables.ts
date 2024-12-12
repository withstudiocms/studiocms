import { NOW, column, defineTable } from 'astro:db';

/** StudioCMS - Users Table for Astro DB */
export const StudioCMSUsers = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		url: column.text({ optional: true }),
		name: column.text(),
		email: column.text({ unique: true, optional: true }),
		avatar: column.text({ optional: true }),
		username: column.text(),
		password: column.text({ optional: true }),
		updatedAt: column.date({ default: NOW, optional: true }),
		createdAt: column.date({ default: NOW, optional: true }),
	},
});

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
	},
});

export const StudioCMSDiffTracking = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => StudioCMSUsers.columns.id }),
		pageId: column.text({ references: () => StudioCMSPageData.columns.id }),
		timestamp: column.date({ default: NOW, optional: true }),
		pageMetaData: column.json({ default: {}, optional: true }),
		pageContentStart: column.text({ multiline: true }),
		diff: column.text({ multiline: true, optional: true }),
	},
});

export const StudioCMSPageDataTags = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		description: column.text(),
		name: column.text(),
		slug: column.text(),
		meta: column.json({ default: {} }),
	},
});

export const StudioCMSPageDataCategories = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		parent: column.number({ optional: true }),
		description: column.text(),
		name: column.text(),
		slug: column.text(),
		meta: column.json({ default: {} }),
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
	},
});
