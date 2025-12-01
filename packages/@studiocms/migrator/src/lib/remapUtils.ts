import type { AstroDBTableKeys, GetMigrationTypes } from './tableMap.js';

type Users = GetMigrationTypes<'StudioCMSUsers'>;
type PageData = GetMigrationTypes<'StudioCMSPageData'>;
type PageFolders = GetMigrationTypes<'StudioCMSPageFolderStructure'>;
type PageDataTags = GetMigrationTypes<'StudioCMSPageDataTags'>;
type PageDataCategories = GetMigrationTypes<'StudioCMSPageDataCategories'>;
type PluginData = GetMigrationTypes<'StudioCMSPluginData'>;
type DynamicConfig = GetMigrationTypes<'StudioCMSDynamicConfigSettings'>;
type apiKeys = GetMigrationTypes<'StudioCMSAPIKeys'>;
type diffTracking = GetMigrationTypes<'StudioCMSDiffTracking'>;
type emailVerificationTokens = GetMigrationTypes<'StudioCMSEmailVerificationTokens'>;
type oAuthAccounts = GetMigrationTypes<'StudioCMSOAuthAccounts'>;
type pageContent = GetMigrationTypes<'StudioCMSPageContent'>;
type permissions = GetMigrationTypes<'StudioCMSPermissions'>;
type sessionTable = GetMigrationTypes<'StudioCMSSessionTable'>;
type userResetTokens = GetMigrationTypes<'StudioCMSUserResetTokens'>;

const booleanToNumber = (value: boolean): number => (value ? 1 : 0);

export const remapUsersTable = (astro: Users['astro'][]): Users['kysely'][] => {
	return astro.map((user) => ({
		...user,
		// Add any necessary transformations here
		createdAt: user.createdAt?.toISOString(),
		updatedAt: new Date().toISOString(),
		emailVerified: booleanToNumber(user.emailVerified),
	}));
};

export const remapPageDataTable = (astro: PageData['astro'][]): PageData['kysely'][] => {
	return astro.map((item) => ({
		...item,
		// Add any necessary transformations here
		updatedAt: new Date().toISOString(),
		showOnNav: booleanToNumber(item.showOnNav),
		showAuthor: booleanToNumber(item.showAuthor ?? false),
		showContributors: booleanToNumber(item.showContributors ?? false),
		publishedAt: item.publishedAt?.toISOString(),
		categories: JSON.stringify(item.categories),
		tags: JSON.stringify(item.tags),
		contributorIds: JSON.stringify(item.contributorIds),
		augments: JSON.stringify(item.augments),
		authorId: item.authorId ?? '',
		draft: booleanToNumber(item.draft ?? false),
	}));
};

export const remapPageFoldersTable = (astro: PageFolders['astro'][]): PageFolders['kysely'][] => {
	return astro.map((item) => ({
		...item,
	}));
};

export const remapPageDataTagsTable = (
	astro: PageDataTags['astro'][]
): PageDataTags['kysely'][] => {
	return astro.map((item) => ({
		...item,
		meta: JSON.stringify(item.meta),
	}));
};

export const remapPageDataCategoriesTable = (
	astro: PageDataCategories['astro'][]
): PageDataCategories['kysely'][] => {
	return astro.map((item) => ({
		...item,
		meta: JSON.stringify(item.meta),
	}));
};

export const remapPluginDataTable = (astro: PluginData['astro'][]): PluginData['kysely'][] => {
	return astro.map((item) => ({
		...item,
		data: JSON.stringify(item.data),
	}));
};

export const remapDynamicConfigTable = (
	astro: DynamicConfig['astro'][]
): DynamicConfig['kysely'][] => {
	return astro.map((item) => ({
		...item,
		data: JSON.stringify(item.data),
	}));
};

export const remapApiKeysTable = (astro: apiKeys['astro'][]): apiKeys['kysely'][] => {
	return astro.map((item) => ({
		...item,
		creationDate: item.creationDate?.toISOString(),
	}));
};

export const remapDiffTrackingTable = (
	astro: diffTracking['astro'][]
): diffTracking['kysely'][] => {
	return astro.map((item) => ({
		...item,
		pageMetaData: JSON.stringify(item.pageMetaData),
		timestamp: item.timestamp?.toISOString(),
	}));
};

export const remapEmailVerificationTokensTable = (
	astro: emailVerificationTokens['astro'][]
): emailVerificationTokens['kysely'][] => {
	return astro.map((item) => ({
		...item,
		expiresAt: item.expiresAt?.toISOString(),
	}));
};

export const remapOAuthAccountsTable = (
	astro: oAuthAccounts['astro'][]
): oAuthAccounts['kysely'][] => {
	return astro.map((item) => ({
		...item,
	}));
};

export const remapPageContentTable = (astro: pageContent['astro'][]): pageContent['kysely'][] => {
	return astro.map((item) => ({
		...item,
		content: item.content ?? '',
	}));
};

export const remapPermissionsTable = (astro: permissions['astro'][]): permissions['kysely'][] => {
	return astro.map(({ rank, user }) => ({
		rank,
		user,
	}));
};

export const remapSessionTable = (astro: sessionTable['astro'][]): sessionTable['kysely'][] => {
	return astro.map((item) => ({
		...item,
		expiresAt: item.expiresAt?.toISOString(),
	}));
};

export const remapUserResetTokensTable = (
	astro: userResetTokens['astro'][]
): userResetTokens['kysely'][] => {
	return astro;
};

export const remapFunctions: {
	[key in AstroDBTableKeys]: (
		astro: GetMigrationTypes<key>['astro'][]
	) => GetMigrationTypes<key>['kysely'][];
} = {
	StudioCMSUsers: remapUsersTable,
	StudioCMSPageData: remapPageDataTable,
	StudioCMSPageFolderStructure: remapPageFoldersTable,
	StudioCMSPageDataTags: remapPageDataTagsTable,
	StudioCMSPageDataCategories: remapPageDataCategoriesTable,
	StudioCMSPluginData: remapPluginDataTable,
	StudioCMSDynamicConfigSettings: remapDynamicConfigTable,
	StudioCMSAPIKeys: remapApiKeysTable,
	StudioCMSDiffTracking: remapDiffTrackingTable,
	StudioCMSEmailVerificationTokens: remapEmailVerificationTokensTable,
	StudioCMSOAuthAccounts: remapOAuthAccountsTable,
	StudioCMSPageContent: remapPageContentTable,
	StudioCMSPermissions: remapPermissionsTable,
	StudioCMSSessionTable: remapSessionTable,
	StudioCMSUserResetTokens: remapUserResetTokensTable,
};
