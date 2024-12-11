import type { Table } from '@astrojs/db/runtime';
import type {
	AvailableLists,
	CombinedRank,
	DatabaseTables,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataReturnId,
	PageDataStripped,
	PageDataTagsInsertResponse,
	PermissionsList,
	SingleRank,
	SiteConfig,
} from './tableDefs';
import type {
	CombinedInsertContent,
	tsDiffTrackingInsert,
	tsDiffTrackingSelect,
	tsOAuthAccountsSelect,
	tsPageContentInsert,
	tsPageContentSelect,
	tsPageDataCategoriesInsert,
	tsPageDataCategoriesSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageDataTagsInsert,
	tsPageDataTagsSelect,
	tsPermissionsSelect,
	tsSessionTableSelect,
	tsSiteConfigInsert,
	tsSiteConfigSelect,
	tsUsersSelect,
} from './tsAlias';

// tableDefs.ts
export type {
	AvailableLists,
	CombinedRank,
	DatabaseTables,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataReturnId,
	PageDataStripped,
	PageDataTagsInsertResponse,
	PermissionsList,
	SingleRank,
	SiteConfig,
};

// tsAlias.ts
export type {
	tsDiffTrackingInsert,
	tsDiffTrackingSelect,
	CombinedInsertContent,
	tsOAuthAccountsSelect,
	tsPageContentInsert,
	tsPageContentSelect,
	tsPageDataCategoriesInsert,
	tsPageDataCategoriesSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageDataTagsInsert,
	tsPageDataTagsSelect,
	tsPermissionsSelect,
	tsSiteConfigInsert,
	tsSessionTableSelect,
	tsSiteConfigSelect,
	tsUsersSelect,
};

export type GenericTable = Table<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	any,
	{
		id: {
			type: 'text' | 'number';
			schema: {
				unique: false;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				deprecated: any;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				name: any;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				collection: any;
				primaryKey: true;
			};
		};
	}
>;

/**
 * Represents the structure for adding a database entry for a page.
 *
 * @property {PageDataReturnId[]} pageData - An array of page data objects with return IDs.
 * @property {PageContentReturnId[]} pageContent - An array of page content objects with return IDs.
 */
export type addDatabaseEntryInsertPage = {
	pageData: PageDataReturnId[];
	pageContent: PageContentReturnId[];
};

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

/**
 * Interface representing the STUDIOCMS SDK.
 */
export interface STUDIOCMS_SDK {
	/**
	 * Contains methods for getting data from the database.
	 */
	GET: {
		/**
		 * Provides methods to retrieve various types of data from the database.
		 *
		 * @type {STUDIOCMS_SDK['GET']['database']}
		 *
		 * @property {Function} users - Asynchronously retrieves and combines user data from the database.
		 * @property {Function} pages - Asynchronously retrieves and combines page data from the database.
		 * @property {Function} config - Asynchronously retrieves the site configuration from the database.
		 */
		database: {
			/**
			 * Retrieves data from the Users table.
			 *
			 * @returns A promise that resolves to an array of CombinedUserData objects.
			 */
			users: () => Promise<CombinedUserData[]>;
			/**
			 * Retrieves data from the Page metadata and content tables.
			 *
			 * @returns A promise that resolves to an array of CombinedPageData objects.
			 */
			pages: () => Promise<CombinedPageData[]>;
			/**
			 * Retrieves the site configuration data.
			 *
			 * @returns A promise that resolves to the site configuration object.
			 */
			config: () => Promise<SiteConfig | undefined>;
		};

		/**
		 * Retrieves a database entry based on the specified table.
		 *
		 * @param table - The name of the database table to retrieve the entry from.
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
		databaseEntry: {
			/**
			 * Provides methods to retrieve user data by different identifiers.
			 */
			users: {
				/**
				 * Fetches user data by user ID.
				 * @param id - The unique identifier of the user.
				 * @returns A promise that resolves to the combined user data or undefined if not found.
				 */
				byId: (id: string) => Promise<CombinedUserData | undefined>;

				/**
				 * Fetches user data by username.
				 * @param username - The username of the user.
				 * @returns A promise that resolves to the combined user data or undefined if not found.
				 */
				byUsername: (username: string) => Promise<CombinedUserData | undefined>;

				/**
				 * Fetches user data by email.
				 * @param email - The email address of the user.
				 * @returns A promise that resolves to the combined user data or undefined if not found.
				 */
				byEmail: (email: string) => Promise<CombinedUserData | undefined>;
			};

			/**
			 * Provides methods to retrieve page data by different identifiers.
			 */
			pages: {
				/**
				 * Retrieves a page entry by its unique identifier.
				 *
				 * @param id - The unique identifier of the page.
				 * @returns A promise that resolves to the combined page data or undefined if not found.
				 */
				byId: (id: string) => Promise<CombinedPageData | undefined>;

				/**
				 * Retrieves a page entry by its slug and package name.
				 *
				 * @param slug - The slug of the page.
				 * @param pkg - The package name associated with the page.
				 * @returns A promise that resolves to the combined page data or undefined if not found.
				 */
				bySlug: (slug: string, pkg: string) => Promise<CombinedPageData | undefined>;
			};
		};

		/**
		 * Retrieves various database tables
		 *
		 * @property {Function} users - Fetches the users table.
		 * @property {Function} oAuthAccounts - Fetches the OAuth accounts table.
		 * @property {Function} sessionTable - Fetches the session table.
		 * @property {Function} permissions - Fetches the permissions table.
		 * @property {Function} pageData - Fetches the page data table.
		 * @property {Function} pageDataTags - Fetches the page data tags table.
		 * @property {Function} pageDataCategories - Fetches the page data categories table.
		 * @property {Function} pageContent - Fetches the page content table.
		 * @property {Function} siteConfig - Fetches the site configuration table with a specific site config ID.
		 * @property {Function} diffTracking - Fetches the diff tracking table.
		 */
		databaseTable: {
			users: () => Promise<tsUsersSelect[]>;
			oAuthAccounts: () => Promise<tsOAuthAccountsSelect[]>;
			sessionTable: () => Promise<tsSessionTableSelect[]>;
			permissions: () => Promise<tsPermissionsSelect[]>;
			pageData: () => Promise<tsPageDataSelect[]>;
			pageDataTags: () => Promise<tsPageDataTagsSelect[]>;
			pageDataCategories: () => Promise<tsPageDataCategoriesSelect[]>;
			pageContent: () => Promise<tsPageContentSelect[]>;
			siteConfig: () => Promise<tsSiteConfigSelect | undefined>;
			diffTracking: () => Promise<tsDiffTrackingSelect[]>;
		};

		/**
		 * Provides methods to retrieve lists of users with different permission levels.
		 *
		 * @property {Function} all - Retrieves all users categorized by their permission levels.
		 * @property {Function} owners - Retrieves users with 'owner' permission level.
		 * @property {Function} admins - Retrieves users with 'admin' permission level.
		 * @property {Function} editors - Retrieves users with 'editor' permission level.
		 * @property {Function} visitors - Retrieves users with 'visitor' permission level.
		 *
		 * @returns {Promise<Array>} - A promise that resolves to an array of users with the specified permission level.
		 */
		permissionsLists: {
			all: () => Promise<PermissionsList[]>;
			owners: () => Promise<PermissionsList[]>;
			admins: () => Promise<PermissionsList[]>;
			editors: () => Promise<PermissionsList[]>;
			visitors: () => Promise<PermissionsList[]>;
		};

		/**
		 * Retrieves the pages associated with a given package name.
		 *
		 * @param packageName - The name of the package for which to retrieve pages.
		 * @returns A promise that resolves to an array of CombinedPageData objects.
		 */
		packagePages: (packageName: string) => Promise<CombinedPageData[]>;
	};
	/**
	 * Contains methods for adding data to the database.
	 */
	POST: {
		/**
		 * Utility functions for adding various entries to the database.
		 */
		databaseEntry: {
			/**
			 * Inserts a new page entry into the database.
			 * @param pageData - The data for the page to be inserted.
			 * @param pageContent - The content for the page to be inserted.
			 * @returns A promise that resolves to the result of the page insertion.
			 */
			pages: (
				pageData: tsPageDataInsert,
				pageContent: CombinedInsertContent
			) => Promise<addDatabaseEntryInsertPage>;
			/**
			 * Inserts new content for a specific page into the database.
			 * @param pageId - The ID of the page to which the content belongs.
			 * @param pageContent - The content to be inserted.
			 * @returns A promise that resolves to an array of inserted content IDs.
			 */
			pageContent: (pageContent: tsPageContentInsert) => Promise<PageContentReturnId[]>;
			/**
			 * Inserts a new tag into the database.
			 * @param tag - The tag data to be inserted.
			 * @returns A promise that resolves to an array of inserted tag responses.
			 */
			tags: (tag: tsPageDataTagsInsert) => Promise<PageDataTagsInsertResponse[]>;
			/**
			 * Inserts a new category into the database.
			 * @param category - The category data to be inserted.
			 * @returns A promise that resolves to an array of inserted category responses.
			 */
			categories: (
				category: tsPageDataCategoriesInsert
			) => Promise<PageDataCategoriesInsertResponse[]>;
			/**
			 * Inserts a new permission for a user into the database.
			 * @param userId - The ID of the user to whom the permission is granted.
			 * @param rank - The rank or level of the permission.
			 * @returns A promise that resolves to an array of selected permissions.
			 */
			permissions: (userId: string, rank: string) => Promise<tsPermissionsSelect[]>;

			/**
			 * Inserts a new Diff Tracking entry into the database.
			 *
			 * @param diff - The diff tracking data to be inserted.
			 * @returns A promise that resolves to an array of inserted diff tracking responses.
			 */
			diffTracking: (diff: tsDiffTrackingInsert) => Promise<tsDiffTrackingSelect[]>;
		};

		// biome-ignore lint/complexity/noBannedTypes: This is temporary while the SDK is being developed
		databaseEntries: {
			// tags: (data: tsPageDataTagsInsert[]) => Promise<void>;
			// categories: (data: tsPageDataCategoriesInsert[]) => Promise<void>;
			// permissions: (data: tsPermissionsSelect[]) => Promise<void>;
		};
	};

	// biome-ignore lint/complexity/noBannedTypes: This is temporary while the SDK is being developed
	UPDATE: {
		// page: (id: string, data: tsPageDataInsert) => Promise<void>;
		// pageContent: (id: string, data: tsPageContentInsert) => Promise<void>;
		// tags: (id: number, data: tsPageDataTagsInsert) => Promise<void>;
		// categories: (id: number, data: tsPageDataCategoriesInsert) => Promise<void>;
		// permissions: (user: string, data: tsPermissionsSelect) => Promise<void>;
		// siteConfig: (data: tsSiteConfigInsert) => Promise<void>;
	};

	// biome-ignore lint/complexity/noBannedTypes: This is temporary while the SDK is being developed
	DELETE: {
		/** Delete page and all page content */
		// page: (id: string) => Promise<void>;
		/** Delete a specific page content entry */
		// pageContent: (id: string) => Promise<void>;
		/** Delete a tag from the Database */
		// tags: (id: number) => Promise<void>;
		/** Delete a category from the Database */
		// categories: (id: number) => Promise<void>;
		/** Delete a user permission from the Database */
		// permissions: (userId: string) => Promise<void>;
		/** Delete a diff from the tracking database */
		// diffTracking: (id: string) => Promise<void>;
	};
}
