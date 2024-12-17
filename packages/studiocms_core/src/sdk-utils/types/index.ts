import type { Table } from '@astrojs/db/runtime';
import type { CacheConfig, ProcessedCacheConfig } from '../../schemas/config/sdk';
import type {
	AvailableLists,
	CombinedRank,
	DatabaseTables,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataReturnId,
	PageDataStripped,
	PageDataTagsInsertResponse,
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
	tsPermissionsInsert,
	tsPermissionsSelect,
	tsSessionTableInsert,
	tsSessionTableSelect,
	tsSiteConfigInsert,
	tsSiteConfigSelect,
	tsUsersInsert,
	tsUsersSelect,
	tsUsersUpdate,
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
	tsPermissionsInsert,
	tsSiteConfigInsert,
	tsSessionTableSelect,
	tsSiteConfigSelect,
	tsUsersSelect,
	tsUsersInsert,
	tsSessionTableInsert,
	tsUsersUpdate,
};

// sdk-utils/types/index.ts
export type { CacheConfig, ProcessedCacheConfig };

export interface BaseCacheObject {
	lastCacheUpdate: Date;
}

/**
 * Represents a cache object for page data.
 *
 * @interface PageDataCacheObject
 * @property {string} id - The unique identifier for the cache object.
 * @property {Date} lastCacheUpdate - The date and time when the cache was last updated.
 * @property {CombinedPageData} data - The combined data of the page stored in the cache.
 */
export interface PageDataCacheObject extends BaseCacheObject {
	id: string;
	data: CombinedPageData;
}

/**
 * Represents a cache object for site configuration.
 *
 * @interface SiteConfigCacheObject
 * @property {Date} lastCacheUpdate - The date when the cache was last updated.
 * @property {SiteConfig} data - The site configuration data.
 */
export interface SiteConfigCacheObject extends BaseCacheObject {
	data: SiteConfig;
}

/**
 * Represents a cache object that stores pages and site configuration data.
 */
export interface CacheObject {
	pages: PageDataCacheObject[];
	siteConfig: SiteConfigCacheObject | undefined;
}

/**
 * Represents a unit of time.
 *
 * @remarks
 * Allowed units are:
 * - 'm' for minutes
 * - 'h' for hours
 */
export type TimeUnit = 'm' | 'h';

/**
 * Represents a time string pattern consisting of a numeric value followed by a time unit.
 *
 * @example
 * ```typescript
 * const time: TimeString = "10m"; // 10 minutes
 * const time: TimeString = "5m";  // 5 minutes
 * ```
 */
export type TimeString = `${number}${TimeUnit}`;

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
 * Interface representing the response received after a deletion operation.
 *
 * @property {string} status - The status of the deletion operation.
 * @property {string} message - A message providing additional information about the deletion operation.
 */
export interface DeletionResponse {
	status: 'success' | 'error';
	message: string;
}

/**
 * Represents the data required to insert a new page.
 */
export interface PageInsert {
	pageData: tsPageDataInsert;
	pageContent: CombinedInsertContent;
}

/**
 * Represents an array of PageInsert objects.
 */
export type MultiPageInsert = PageInsert[];

/**
 * Interface representing the STUDIOCMS SDK.
 */
export interface STUDIOCMS_SDK_GET {
	/**
	 * Provides methods to retrieve various types of data from the database.
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
	 */
	databaseTable: {
		/**
		 * Fetches the users table.
		 */
		users: () => Promise<tsUsersSelect[]>;

		/**
		 * Fetches the OAuth accounts table.
		 */
		oAuthAccounts: () => Promise<tsOAuthAccountsSelect[]>;

		/**
		 * Fetches the session table.
		 */
		sessionTable: () => Promise<tsSessionTableSelect[]>;

		/**
		 * Fetches the permissions table.
		 */
		permissions: () => Promise<tsPermissionsSelect[]>;

		/**
		 * Fetches the page data table.
		 */
		pageData: () => Promise<tsPageDataSelect[]>;

		/**
		 * Fetches the page data tags table.
		 */
		pageDataTags: () => Promise<tsPageDataTagsSelect[]>;

		/**
		 * Fetches the page data categories table.
		 */
		pageDataCategories: () => Promise<tsPageDataCategoriesSelect[]>;

		/**
		 * Fetches the page content table.
		 */
		pageContent: () => Promise<tsPageContentSelect[]>;

		/**
		 * Fetches the site configuration table with a specific site config ID.
		 */
		siteConfig: () => Promise<tsSiteConfigSelect | undefined>;

		/**
		 * Fetches the diff tracking table.
		 */
		diffTracking: () => Promise<tsDiffTrackingSelect[]>;
	};

	/**
	 * Provides methods to retrieve lists of users with different permission levels.
	 */
	permissionsLists: {
		/**
		 * Retrieves all users categorized by their permission levels.
		 */
		all: () => Promise<CombinedRank[]>;

		/**
		 * Retrieves users with 'owner' permission level.
		 */
		owners: () => Promise<SingleRank[]>;

		/**
		 * Retrieves users with 'admin' permission level.
		 */
		admins: () => Promise<SingleRank[]>;

		/**
		 * Retrieves users with 'editor' permission level.
		 */
		editors: () => Promise<SingleRank[]>;

		/**
		 * Retrieves users with 'visitor' permission level.
		 */
		visitors: () => Promise<SingleRank[]>;
	};

	/**
	 * Retrieves the pages associated with a given package name.
	 *
	 * @param packageName - The name of the package for which to retrieve pages.
	 * @returns A promise that resolves to an array of CombinedPageData objects.
	 */
	packagePages: (packageName: string) => Promise<CombinedPageData[]>;
}

/**
 * Contains methods for adding data to the database.
 */
export interface STUDIOCMS_SDK_POST {
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

	/**
	 * The `postDatabaseEntries` object provides methods to insert various types of entries into the database.
	 */
	databaseEntries: {
		/**
		 * Asynchronously inserts an array of tag objects into the `tsPageDataTags` table.
		 */
		tags: (data: tsPageDataTagsInsert[]) => Promise<PageDataTagsInsertResponse[]>;

		/**
		 * Asynchronously inserts an array of category objects into the `tsPageDataCategories` table.
		 */
		categories: (data: tsPageDataCategoriesInsert[]) => Promise<PageDataCategoriesInsertResponse[]>;

		/**
		 * Asynchronously inserts an array of permission objects into the `tsPermissions` table.
		 */
		permissions: (data: tsPermissionsInsert[]) => Promise<tsPermissionsSelect[]>;

		/**
		 * Asynchronously inserts an array of pages into the `tsPageData` and `tsPageContent` tables.
		 * @param pages - An array of page objects to be inserted.
		 */
		pages: (pages: MultiPageInsert) => Promise<void>;
	};
}

/**
 * The `StudioCMS_SDK_UPDATE` object provides methods to update various entities in the StudioCMS system.
 */
export interface STUDIOCMS_SDK_UPDATE {
	/**
	 * Updates a page record in the `tsPageData` table.
	 */
	page: (data: tsPageDataSelect) => Promise<tsPageDataSelect>;

	/**
	 * Updates a page content record in the `tsPageContent` table.
	 */
	pageContent: (data: tsPageContentSelect) => Promise<tsPageContentSelect>;

	/**
	 * Updates a tag record in the `tsPageDataTags` table.
	 */
	tags: (data: tsPageDataTagsSelect) => Promise<tsPageDataTagsSelect>;

	/**
	 * Updates a category record in the `tsPageDataCategories` table.
	 */
	categories: (data: tsPageDataCategoriesSelect) => Promise<tsPageDataCategoriesSelect>;

	/**
	 * Updates a permission record in the `tsPermissions` table.
	 */
	permissions: (data: tsPermissionsSelect) => Promise<tsPermissionsSelect>;

	/**
	 * Updates a site configuration record in the `tsSiteConfig` table.
	 */
	siteConfig: (data: tsSiteConfigSelect) => Promise<tsSiteConfigSelect>;
}

/**
 * StudioCMS_SDK_DELETE provides methods to delete various entities in the StudioCMS system.
 * Each method returns a promise that resolves to an object indicating the status and message of the operation.
 */
export interface STUDIOCMS_SDK_DELETE {
	/** Delete page and all page content */
	page: (id: string) => Promise<DeletionResponse>;

	/** Delete all page content entries for an ID */
	pageContent: (id: string) => Promise<DeletionResponse>;

	/** Delete page content for a specific language */
	pageContentLang: (id: string, lang: string) => Promise<DeletionResponse>;

	/** Delete a tag from the Database */
	tags: (id: number) => Promise<DeletionResponse>;

	/** Delete a category from the Database */
	categories: (id: number) => Promise<DeletionResponse>;

	/** Delete a user permission from the Database */
	permissions: (userId: string) => Promise<DeletionResponse>;

	/** Delete a diff from the tracking database */
	diffTracking: (id: string) => Promise<DeletionResponse>;
}

/**
 * Utilities for the `@studiocms/auth` package to interact
 * 		with the StudioCMS SDK
 */
export interface STUDIOCMS_SDK_AUTH {
	/**
	 * StudioCMS_SDK_authSession provides methods to manage authentication sessions.
	 */
	session: {
		/**
		 * Creates a new session.
		 * @param data - The data to insert into the session table.
		 * @returns The created session object.
		 */
		create: (data: tsSessionTableInsert) => Promise<tsSessionTableSelect>;

		/**
		 * Retrieves a session along with the associated user.
		 * @param sessionId - The ID of the session to retrieve.
		 * @returns The session and associated user object.
		 */
		sessionWithUser: (
			sessionId: string
		) => Promise<{ user: tsUsersSelect; session: tsSessionTableSelect }[]>;

		/**
		 * Deletes a session.
		 * @param sessionId - The ID of the session to delete.
		 * @returns An object indicating the status of the deletion.
		 */
		delete: (sessionId: string) => Promise<DeletionResponse>;

		/**
		 * Updates the expiration date of a session.
		 * @param sessionId - The ID of the session to update.
		 * @param newDate - The new expiration date.
		 * @returns The updated session object.
		 */
		update: (sessionId: string, newDate: Date) => Promise<tsSessionTableSelect[]>;
	};

	/**
	 * The `StudioCMS_SDK_authUser` object provides methods for creating and updating user records
	 * in the StudioCMS system. It interacts with the database to perform these operations and
	 * handles errors by throwing `StudioCMS_SDK_Error` with appropriate messages.
	 *
	 * @todo Implement the delete function to safely remove user records without causing errors due to references in other tables.
	 */
	user: {
		/**
		 * Asynchronously creates a new user record in the database.
		 * @param newUserData - The data for the new user to be created.
		 * @returns A promise that resolves to the created user record.
		 */
		create: (newUserData: tsUsersInsert) => Promise<tsUsersSelect>;

		/**
		 * Asynchronously updates an existing user record in the database.
		 * @param userId - The ID of the user to be updated.
		 * @param userData - The new data for the user.
		 * @returns A promise that resolves to the updated user record.
		 */
		update: (userId: string, userData: tsUsersUpdate) => Promise<tsUsersSelect>;

		/**
		 * Asynchronously searches for users based on username or email.
		 * @param username - The username to search for.
		 * @param email - The email to search for.
		 * @returns A promise that resolves to an object containing the search results.
		 */
		searchUsersForUsernameOrEmail: (
			username: string,
			email: string
		) => Promise<{ usernameSearch: tsUsersSelect[]; emailSearch: tsUsersSelect[] }>;

		/**
		 * The `ghost` object provides utility functions to interact with the ghost user in the database.
		 */
		ghost: {
			/**
			 * Asynchronously verifies if the ghost user exists in the database.
			 *
			 * @returns A promise that resolves to a boolean indicating whether the ghost user exists.
			 */
			verifyExists: () => Promise<boolean>;

			/**
			 * Asynchronously creates a new ghost user in the database.
			 *
			 * @returns A promise that resolves to the created ghost user.
			 */
			create: () => Promise<tsUsersSelect>;

			/**
			 * Asynchronously retrieves the ghost user from the database.
			 *
			 * @returns A promise that resolves to the ghost user.
			 */
			get: () => Promise<tsUsersSelect | undefined>;
		};

		// delete: async () => {},
	};

	/**
	 * The `StudioCMS_SDK_authOAuth` object provides methods to handle OAuth authentication
	 * within the StudioCMS SDK. It includes methods to create and delete OAuth accounts.
	 */
	oAuth: {
		/**
		 * Asynchronously creates a new OAuth account with the provided data.
		 * @param data - The data for the new OAuth account.
		 * @returns A promise that resolves to the created OAuth account.
		 */
		create: (data: tsOAuthAccountsSelect) => Promise<tsOAuthAccountsSelect>;

		/**
		 * Asynchronously deletes an existing OAuth account based on user ID and provider.
		 * @param userId - The ID of the user whose OAuth account is to be deleted.
		 * @param provider - The provider of the OAuth account to be deleted.
		 * @returns A promise that resolves to an object containing the status and message of the deletion operation.
		 */
		delete: (userId: string, provider: string) => Promise<DeletionResponse>;

		/**
		 * Asynchronously searches for OAuth accounts based on provider and user ID.
		 * @param provider - The provider of the OAuth account to search for.
		 * @param userId - The ID of the user associated with the OAuth account.
		 * @returns A promise that resolves to the OAuth account or undefined if not found.
		 */
		searchProvidersForId: (
			provider: string,
			userId: string
		) => Promise<tsOAuthAccountsSelect | undefined>;
	};

	/**
	 * An object representing the authentication permissions for the StudioCMS SDK.
	 */
	permission: {
		/**
		 * Retrieves the current permission status for a user.
		 *
		 * @param userId - The ID of the user to check permissions for.
		 * @returns A promise that resolves to the current permission status for the user.
		 */
		currentStatus: (userId: string) => Promise<tsPermissionsSelect | undefined>;
	};
}

/**
 * An object containing utility functions for initializing site configurations and managing ghost users.
 */
export interface STUDIOCMS_SDK_INIT {
	/**
	 * Inserts a new site configuration into the database.
	 *
	 * @param config - The site configuration to insert.
	 * @returns A promise that resolves to the inserted site configuration.
	 */
	siteConfig: (config: tsSiteConfigInsert) => Promise<tsSiteConfigSelect>;

	/**
	 * Retrieves the ghost user. If the ghost user does not exist, it creates a new one.
	 *
	 * @returns A promise that resolves to the ghost user.
	 */
	ghostUser: () => Promise<tsUsersSelect>;
}

/**
 * Interface representing the STUDIOCMS SDK.
 */
export interface STUDIOCMS_SDK {
	/**
	 * Contains methods for getting data from the database.
	 */
	GET: STUDIOCMS_SDK_GET;
	/**
	 * Contains methods for adding data to the database.
	 */
	POST: STUDIOCMS_SDK_POST;

	/**
	 * The `StudioCMS_SDK_UPDATE` object provides methods to update various entities in the StudioCMS system.
	 */
	UPDATE: STUDIOCMS_SDK_UPDATE;

	/**
	 * StudioCMS_SDK_DELETE provides methods to delete various entities in the StudioCMS system.
	 * Each method returns a promise that resolves to an object indicating the status and message of the operation.
	 */
	DELETE: STUDIOCMS_SDK_DELETE;

	/**
	 * Utilities for the `@studiocms/auth` package to interact
	 * 		with the StudioCMS SDK
	 */
	AUTH: STUDIOCMS_SDK_AUTH;

	/**
	 * An object containing utility functions for initializing site configurations and managing ghost users.
	 */
	INIT: STUDIOCMS_SDK_INIT;
}

/**
 * Interface representing the cache utility for the STUDIOCMS SDK.
 */
export interface STUDIOCMS_SDK_CACHE {
	/**
	 * Cache retrieval operations.
	 */
	GET: {
		/**
		 * Cache operations related to individual pages.
		 */
		page: {
			/**
			 * Retrieves a page from the cache by its ID.
			 * @param id - The ID of the page.
			 * @returns A promise that resolves to the cached page data.
			 */
			byId: (id: string) => Promise<PageDataCacheObject>;

			/**
			 * Retrieves a page from the cache by its slug and package.
			 * @param slug - The slug of the page.
			 * @param pkg - The package of the page.
			 * @returns A promise that resolves to the cached page data.
			 */
			bySlug: (slug: string, pkg: string) => Promise<PageDataCacheObject>;
		};

		/**
		 * Retrieves all pages from the cache.
		 * @returns A promise that resolves to an array of cached page data.
		 */
		pages: () => Promise<PageDataCacheObject[]>;

		/**
		 * Retrieves the site configuration from the cache.
		 * @returns A promise that resolves to the cached site configuration data.
		 */
		siteConfig: () => Promise<SiteConfigCacheObject>;
	};

	/**
	 * Cache clearing operations.
	 */
	CLEAR: {
		/**
		 * Cache clearing operations related to individual pages.
		 */
		page: {
			/**
			 * Clears a page from the cache by its ID.
			 * @param id - The ID of the page.
			 */
			byId: (id: string) => void;

			/**
			 * Clears a page from the cache by its slug and package.
			 * @param slug - The slug of the page.
			 * @param pkg - The package of the page.
			 */
			bySlug: (slug: string, pkg: string) => void;
		};

		/**
		 * Clears all pages from the cache.
		 */
		pages: () => void;
	};

	/**
	 * Cache update operations.
	 */
	UPDATE: {
		/**
		 * Cache update operations related to individual pages.
		 */
		page: {
			/**
			 * Updates a page in the cache by its ID.
			 * @param id - The ID of the page.
			 * @param data - The updated page data.
			 * @returns A promise that resolves to the updated cached page data.
			 */
			byId: (
				id: string,
				data: { pageData: tsPageDataSelect; pageContent: tsPageContentSelect }
			) => Promise<PageDataCacheObject>;

			/**
			 * Updates a page in the cache by its slug and package.
			 * @param slug - The slug of the page.
			 * @param pkg - The package of the page.
			 * @param data - The updated page data.
			 * @returns A promise that resolves to the updated cached page data.
			 */
			bySlug: (
				slug: string,
				pkg: string,
				data: { pageData: tsPageDataSelect; pageContent: tsPageContentSelect }
			) => Promise<PageDataCacheObject>;
		};

		/**
		 * Updates the site configuration in the cache.
		 * @param data - The updated site configuration data.
		 * @returns A promise that resolves to the updated cached site configuration data.
		 */
		siteConfig: (data: SiteConfig) => Promise<SiteConfigCacheObject>;
	};
}
