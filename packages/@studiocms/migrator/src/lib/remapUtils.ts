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

const booleanToNumber = (value: boolean): number => {
	if (value === true) return 1;
	return 0;
};

export const remapUsersTable = (astro: Users['astro']): Users['kysely'] => {
	return {
		...astro,
		// Add any necessary transformations here
		createdAt: astro.createdAt?.toISOString(),
		updatedAt: new Date().toISOString(),
		emailVerified: booleanToNumber(astro.emailVerified),
	};
};

export const remapPageDataTable = (astro: PageData['astro']): PageData['kysely'] => {
	return {
		...astro,
		// Add any necessary transformations here
		updatedAt: new Date().toISOString(),
		showOnNav: booleanToNumber(astro.showOnNav),
		showAuthor: booleanToNumber(astro.showAuthor ?? false),
		showContributors: booleanToNumber(astro.showContributors ?? false),
		publishedAt: astro.publishedAt?.toISOString(),
		categories: JSON.stringify(astro.categories as string),
		tags: JSON.stringify(astro.tags as string),
		contributorIds: JSON.stringify(astro.contributorIds as string),
		augments: JSON.stringify(astro.augments as string),
		authorId: astro.authorId ?? '',
		draft: booleanToNumber(astro.draft ?? false),
	};
};

export const remapPageFoldersTable = (astro: PageFolders['astro']): PageFolders['kysely'] => {
	return astro;
};

export const remapPageDataTagsTable = (astro: PageDataTags['astro']): PageDataTags['kysely'] => {
	return {
		...astro,
		meta: JSON.stringify(astro.meta as string),
	};
};

export const remapPageDataCategoriesTable = (
	astro: PageDataCategories['astro']
): PageDataCategories['kysely'] => {
	return {
		...astro,
		meta: JSON.stringify(astro.meta as string),
	};
};

export const remapPluginDataTable = (astro: PluginData['astro']): PluginData['kysely'] => {
	return {
		...astro,
		data: JSON.stringify(astro.data as string),
	};
};

export const remapDynamicConfigTable = (astro: DynamicConfig['astro']): DynamicConfig['kysely'] => {
	return {
		...astro,
		data: JSON.stringify(astro.data as string),
	};
};

export const remapApiKeysTable = (astro: apiKeys['astro']): apiKeys['kysely'] => {
	return {
		...astro,
		creationDate: astro.creationDate?.toISOString(),
	};
};

export const remapDiffTrackingTable = (astro: diffTracking['astro']): diffTracking['kysely'] => {
	return {
		...astro,
		pageMetaData: JSON.stringify(astro.pageMetaData as string),
		timestamp: astro.timestamp?.toISOString(),
	};
};

export const remapEmailVerificationTokensTable = (
	astro: emailVerificationTokens['astro']
): emailVerificationTokens['kysely'] => {
	return {
		...astro,
		expiresAt: astro.expiresAt?.toISOString(),
	};
};

export const remapOAuthAccountsTable = (astro: oAuthAccounts['astro']): oAuthAccounts['kysely'] => {
	return {
		...astro,
	};
};

export const remapPageContentTable = (astro: pageContent['astro']): pageContent['kysely'] => {
	return {
		...astro,
		content: astro.content ?? '',
	};
};

export const remapPermissionsTable = (astro: permissions['astro']): permissions['kysely'] => {
	return {
		...astro,
	};
};

export const remapSessionTable = (astro: sessionTable['astro']): sessionTable['kysely'] => {
	return {
		...astro,
		expiresAt: astro.expiresAt?.toISOString(),
	};
};

export const remapUserResetTokensTable = (
	astro: userResetTokens['astro']
): userResetTokens['kysely'] => {
	return {
		...astro,
	};
};

export const remapFunctions: {
	[key in AstroDBTableKeys]: (
		astro: GetMigrationTypes<key>['astro']
	) => GetMigrationTypes<key>['kysely'];
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
