import type {
	tsDiffTracking,
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsSessionTable,
	tsSiteConfig,
	tsUsers,
} from '../db/tsTables';

/**
 * Represents the possible table names in the current database schema.
 *
 * @property {'users'} users - Table for user information.
 * @property {'oAuthAccounts'} oAuthAccounts - Table for OAuth account details.
 * @property {'sessionTable'} sessionTable - Table for session information.
 * @property {'permissions'} permissions - Table for user permissions.
 * @property {'pageData'} pageData - Table for page data.
 * @property {'pageDataTags'} pageDataTags - Table for tags associated with page data.
 * @property {'pageDataCategories'} pageDataCategories - Table for categories associated with page data.
 * @property {'pageContent'} pageContent - Table for page content.
 * @property {'siteConfig'} siteConfig - Table for site configuration.
 * @property {'diffTracking'} diffTracking - Table for tracking differences.
 */
export type CurrentTables =
	| 'users'
	| 'oAuthAccounts'
	| 'sessionTable'
	| 'permissions'
	| 'pageData'
	| 'pageDataTags'
	| 'pageDataCategories'
	| 'pageContent'
	| 'siteConfig'
	| 'diffTracking';

/**
 * Represents a simplified view of the tables in the system.
 *
 * The `SimplifiedTables` type is a union of string literals that correspond
 * to the names of the tables in the system. This type is used to restrict
 * the values to a predefined set of table names.
 *
 * Possible values:
 * - `'users'`: Represents the users table.
 * - `'pages'`: Represents the pages table.
 * - `'config'`: Represents the config table.
 */
export type SimplifiedTables = 'users' | 'pages' | 'config';

/**
 * Represents the types of tables available in the database.
 *
 * @example
 * // Example usage:
 * const table: DatabaseEntryTables = 'users';
 */
export type DatabaseEntryTables = 'users' | 'pages';

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

export type tsDiffTrackingSelect = typeof tsDiffTracking.$inferSelect;

/**
 * Type alias for the inferred select type of `tsPageContent`.
 *
 * This type is derived from the `$inferSelect` property of `tsPageContent`.
 * It is used to represent the structure of the selected content from `tsPageContent`.
 */
export type tsPageContentSelect = typeof tsPageContent.$inferSelect;

/**
 * Type representing the selection of site configuration data.
 *
 * This type is inferred from the `$inferSelect` property of the `tsSiteConfig` object.
 */
export type tsSiteConfigSelect = typeof tsSiteConfig.$inferSelect;

/**
 * Type representing the insertion of site configuration data.
 *
 * This type is inferred from the `$inferInsert` property of the `tsSiteConfig` object.
 */
export type tsSiteConfigInsert = typeof tsSiteConfig.$inferInsert;

/**
 * Represents a stripped-down version of the `tsSiteConfigSelect` type,
 * excluding the property 'id'.
 */
export type SiteConfig = Omit<tsSiteConfigSelect, 'id'>;

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
	multiLangContent: tsPageContentSelect[];
	defaultContent: tsPageContentSelect | undefined;
}

interface GetDatabaseEntryUser {
	byId: (id: string) => Promise<CombinedUserData | undefined>;
	byUsername: (username: string) => Promise<CombinedUserData | undefined>;
	byEmail: (email: string) => Promise<CombinedUserData | undefined>;
}

interface GetDatabaseEntryPage {
	byId: (id: string) => Promise<CombinedPageData | undefined>;
	bySlug: (slug: string, pkg: string) => Promise<CombinedPageData | undefined>;
}

export type GetDatabaseEntry = GetDatabaseEntryUser | GetDatabaseEntryPage;

export type DatabaseTables =
	| tsUsersSelect[]
	| tsOAuthAccountsSelect[]
	| tsSessionTableSelect[]
	| tsPermissionsSelect[]
	| tsSiteConfigSelect
	| tsPageDataSelect[]
	| tsPageDataTagsSelect[]
	| tsPageDataCategoriesSelect[]
	| tsPageContentSelect[]
	| tsDiffTrackingSelect[]
	| undefined;

export type GetDatabase = SiteConfig | CombinedUserData[] | CombinedPageData[] | undefined;

/**
 * Interface representing the STUDIOCMS SDK.
 */
export interface STUDIOCMS_SDK {
	/**
	 * Contains methods for getting data from the database.
	 */
	GET: {
		/**
		 * Retrieves data from the database based on the specified table.
		 *
		 * @param database - The name of the database table to retrieve data from.
		 *                   It can be one of the following values: 'users', 'pages', or 'config'.
		 *
		 * @returns A promise that resolves to the data retrieved from the specified table.
		 *
		 * - If `database` is 'users', it returns an array of `CombinedUserData` objects.
		 * - If `database` is 'pages', it returns an array of `CombinedPageData` objects.
		 * - If `database` is 'config', it returns the site configuration object.
		 *
		 * @throws Will throw an error if the specified database table is not recognized.
		 */
		database: (database: SimplifiedTables) => Promise<GetDatabase>;

		/**
		 * Retrieves a database entry based on the specified table.
		 *
		 * @param database - The name of the database table to retrieve the entry from.
		 * @returns An object containing methods to retrieve entries by different criteria.
		 *
		 * The function supports the following tables:
		 * - 'users': Provides methods to retrieve user data by ID, username, or email.
		 * - 'pages': Provides methods to retrieve page data by ID or slug and optionally package.
		 *
		 * @example
		 * ```typescript
		 * const userEntry = getDatabaseEntry('users');
		 * const userData = await userEntry.byId('example-id');
		 * if (userData) {
		 *   console.log(userData);
		 * } else {
		 *   console.log('User not found');
		 * }
		 *
		 * const pageEntry = getDatabaseEntry('pages');
		 * const pageData = await pageEntry.byId('example-id');
		 * if (pageData) {
		 *   console.log(pageData);
		 * } else {
		 *   console.log('Page not found');
		 * }
		 * ```
		 */
		databaseEntry: (database: DatabaseEntryTables) => GetDatabaseEntry;

		/**
		 * Retrieves raw data from the specified database table.
		 *
		 * @param database - The name of the database table to retrieve data from.
		 * @returns A promise that resolves to the data from the specified database table.
		 * @throws An error if the specified database table is unknown.
		 *
		 * @example
		 * ```typescript
		 * const users = await getDatabaseRaw('users');
		 * console.log(users);
		 * ```
		 */
		databaseTable: (database: CurrentTables) => Promise<DatabaseTables>;
	};
}
