import type {
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsSessionTable,
	tsUsers,
} from '../db/tsTables';

const currentTables = [
	'users',
	'oAuthAccounts',
	'sessionTable',
	'permissions',
	'pageData',
	'pageDataTags',
	'pageDataCategories',
	'pageContent',
	'siteConfig',
] as const;

export const simplifiedTables = ['users', 'pages', 'config'] as const;

export type CurrentTables = (typeof currentTables)[number];
export type SimplifiedTables = (typeof simplifiedTables)[number];

export type tsUsersSelect = typeof tsUsers.$inferSelect;
export type tsOAuthAccountsSelect = typeof tsOAuthAccounts.$inferSelect;
export type tsSessionTableSelect = typeof tsSessionTable.$inferSelect;
export type tsPermissionsSelect = typeof tsPermissions.$inferSelect;
export type tsPageDataSelect = typeof tsPageData.$inferSelect;
export type tsPageDataTagsSelect = typeof tsPageDataTags.$inferSelect;
export type tsPageDataCategoriesSelect = typeof tsPageDataCategories.$inferSelect;
export type tsPageContentSelect = typeof tsPageContent.$inferSelect;

export type PageDataStripped = Omit<tsPageDataSelect, 'catagories' | 'tags'>;

export interface CombinedUserData extends tsUsersSelect {
	oAuthData: tsOAuthAccountsSelect | undefined;
	sessionData: tsSessionTableSelect | undefined;
	permissionsData: tsPermissionsSelect | undefined;
}

export interface CombinedPageData extends PageDataStripped {
	categories: tsPageDataCategoriesSelect[];
	tags: tsPageDataTagsSelect[];
	content: tsPageContentSelect[];
}
