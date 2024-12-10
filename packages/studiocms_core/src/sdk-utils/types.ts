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

/**
 * A constant array of strings representing the current tables used in the application.
 *
 * The tables included are:
 * - 'users'
 * - 'oAuthAccounts'
 * - 'sessionTable'
 * - 'permissions'
 * - 'pageData'
 * - 'pageDataTags'
 * - 'pageDataCategories'
 * - 'pageContent'
 * - 'siteConfig'
 * - 'diffTracking'
 *
 * This array is marked as `const` to ensure its values are read-only.
 */
export const currentTables = [
	'users',
	'oAuthAccounts',
	'sessionTable',
	'permissions',
	'pageData',
	'pageDataTags',
	'pageDataCategories',
	'pageContent',
	'siteConfig',
	'diffTracking',
] as const;

/**
 * A constant array of table names that are simplified for the SDK.
 *
 * @constant
 * @default ['users', 'pages', 'config']
 */
export const simplifiedTables = ['users', 'pages', 'config'] as const;

/**
 * Represents the type of the elements in the `currentTables` array.
 *
 * This type is derived from the `currentTables` array, allowing you to use
 * the type of its elements without explicitly defining them.
 */
export type CurrentTables = (typeof currentTables)[number];

/**
 * Represents a type that extracts the types of elements from the `simplifiedTables` array.
 *
 * This type is useful for defining variables or parameters that should be constrained
 * to one of the values present in the `simplifiedTables` array.
 */
export type SimplifiedTables = (typeof simplifiedTables)[number];

/**
 * Type alias for the inferred select type of `tsUsers`.
 *
 * This type is derived from the `$inferSelect` property of `tsUsers`.
 * It represents the shape of the data that will be selected from the `tsUsers` object.
 */
export type tsUsersSelect = typeof tsUsers.$inferSelect;

/**
 * Type alias for the inferred select type of the `tsOAuthAccounts` object.
 *
 * This type is derived from the `$inferSelect` property of the `tsOAuthAccounts` object,
 * which is used to infer the shape of the selected data from the OAuth accounts.
 */
export type tsOAuthAccountsSelect = typeof tsOAuthAccounts.$inferSelect;

/**
 * Type alias for the inferred select type of the `tsSessionTable`.
 *
 * This type is derived from the `$inferSelect` property of the `tsSessionTable` object,
 * which represents the structure of a selected row from the `tsSessionTable`.
 */
export type tsSessionTableSelect = typeof tsSessionTable.$inferSelect;

/**
 * Type alias for the inferred select type of `tsPermissions`.
 *
 * This type is derived from the `$inferSelect` property of `tsPermissions`.
 * It is used to represent the shape of the data that can be selected from `tsPermissions`.
 */
export type tsPermissionsSelect = typeof tsPermissions.$inferSelect;

/**
 * Type alias for the inferred select type of `tsPageData`.
 *
 * This type is derived from the `$inferSelect` property of `tsPageData`.
 */
export type tsPageDataSelect = typeof tsPageData.$inferSelect;

/**
 * Type representing the selection of tags from the `tsPageDataTags` object.
 *
 * This type is inferred from the `$inferSelect` property of the `tsPageDataTags` object.
 */
export type tsPageDataTagsSelect = typeof tsPageDataTags.$inferSelect;

/**
 * Type representing the selection of page data categories.
 *
 * This type is inferred from the `tsPageDataCategories` object using the `$inferSelect` property.
 */
export type tsPageDataCategoriesSelect = typeof tsPageDataCategories.$inferSelect;

/**
 * Type alias for the inferred select type of `tsPageContent`.
 *
 * This type is derived from the `$inferSelect` property of `tsPageContent`.
 * It is used to represent the structure of the selected content from `tsPageContent`.
 */
export type tsPageContentSelect = typeof tsPageContent.$inferSelect;

/**
 * Represents a stripped-down version of the `tsPageDataSelect` type,
 * excluding the properties 'catagories', 'categories', 'tags', and 'contributorIds'.
 */
export type PageDataStripped = Omit<
	tsPageDataSelect,
	'catagories' | 'categories' | 'tags' | 'contributorIds'
>;

/**
 * Interface representing combined user data.
 *
 * This interface extends `tsUsersSelect` and includes additional properties
 * for OAuth data and permissions data.
 *
 * @interface CombinedUserData
 * @extends {tsUsersSelect}
 *
 * @property {tsOAuthAccountsSelect[] | undefined} oAuthData - An array of OAuth account data or undefined.
 * @property {tsPermissionsSelect | undefined} permissionsData - Permissions data or undefined.
 */
export interface CombinedUserData extends tsUsersSelect {
	oAuthData: tsOAuthAccountsSelect[] | undefined;
	permissionsData: tsPermissionsSelect | undefined;
}

/**
 * Represents the combined data for a page, extending the stripped page data.
 *
 * @interface CombinedPageData
 * @extends PageDataStripped
 *
 * @property {string[]} contributorIds - An array of contributor IDs associated with the page.
 * @property {tsPageDataCategoriesSelect[]} categories - An array of categories selected for the page.
 * @property {tsPageDataTagsSelect[]} tags - An array of tags selected for the page.
 * @property {tsPageContentSelect[]} content - An array of content selected for the page.
 */
export interface CombinedPageData extends PageDataStripped {
	contributorIds: string[];
	categories: tsPageDataCategoriesSelect[];
	tags: tsPageDataTagsSelect[];
	content: tsPageContentSelect[];
}
