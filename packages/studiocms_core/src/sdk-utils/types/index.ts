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

		/**
		 * The `postDatabaseEntries` object provides methods to insert various types of entries into the database.
		 *
		 * @type {STUDIOCMS_SDK['POST']['databaseEntries']}
		 *
		 * @property {Function} tags - Asynchronously inserts an array of tag objects into the `tsPageDataTags` table.
		 * @property {Function} categories - Asynchronously inserts an array of category objects into the `tsPageDataCategories` table.
		 * @property {Function} permissions - Asynchronously inserts an array of permission objects into the `tsPermissions` table.
		 *
		 * @method tags
		 * @param {Array} tags - An array of tag objects to be inserted.
		 * @returns {Promise<Array>} - A promise that resolves to an array of inserted tag IDs.
		 *
		 * @method categories
		 * @param {Array} categories - An array of category objects to be inserted.
		 * @returns {Promise<Array>} - A promise that resolves to an array of inserted category IDs.
		 *
		 * @method permissions
		 * @param {Array} permissions - An array of permission objects to be inserted.
		 * @returns {Promise<Array>} - A promise that resolves to an array of inserted permission objects.
		 * @throws {Error} - Throws an error if a user already has a rank assigned.
		 */
		databaseEntries: {
			/**
			 * Asynchronously inserts an array of tag objects into the `tsPageDataTags` table.
			 */
			tags: (data: tsPageDataTagsInsert[]) => Promise<PageDataTagsInsertResponse[]>;

			/**
			 * Asynchronously inserts an array of category objects into the `tsPageDataCategories` table.
			 */
			categories: (
				data: tsPageDataCategoriesInsert[]
			) => Promise<PageDataCategoriesInsertResponse[]>;

			/**
			 * Asynchronously inserts an array of permission objects into the `tsPermissions` table.
			 */
			permissions: (data: tsPermissionsInsert[]) => Promise<tsPermissionsSelect[]>;
		};
	};

	/**
	 * The `StudioCMS_SDK_UPDATE` object provides methods to update various entities in the StudioCMS system.
	 * Each method performs an update operation on a specific table and returns the updated record.
	 *
	 * @property {Function} page - Updates a page record in the `tsPageData` table.
	 * @property {Function} pageContent - Updates a page content record in the `tsPageContent` table.
	 * @property {Function} tags - Updates a tag record in the `tsPageDataTags` table.
	 * @property {Function} categories - Updates a category record in the `tsPageDataCategories` table.
	 * @property {Function} permissions - Updates a permission record in the `tsPermissions` table.
	 * @property {Function} siteConfig - Updates a site configuration record in the `tsSiteConfig` table.
	 *
	 * Each method accepts a `data` parameter which contains the fields to be updated and the identifier of the record to be updated.
	 * The methods use the `db.update` function to perform the update operation, and the `returning().get()` chain to return the updated record.
	 */
	UPDATE: {
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
	};

	/**
	 * StudioCMS_SDK_DELETE provides methods to delete various entities in the StudioCMS system.
	 * Each method returns a promise that resolves to an object indicating the status and message of the operation.
	 *
	 * @type {STUDIOCMS_SDK['DELETE']}
	 *
	 * @property {Function} page - Deletes a page by its ID.
	 * @param {string} id - The ID of the page to delete.
	 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
	 *
	 * @property {Function} pageContent - Deletes page content by its ID.
	 * @param {string} id - The ID of the page content to delete.
	 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
	 *
	 * @property {Function} pageContentLang - Deletes page content by its ID and language.
	 * @param {string} id - The ID of the page content to delete.
	 * @param {string} lang - The language of the page content to delete.
	 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
	 *
	 * @property {Function} tags - Deletes a tag by its ID.
	 * @param {string} id - The ID of the tag to delete.
	 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
	 *
	 * @property {Function} categories - Deletes a category by its ID.
	 * @param {string} id - The ID of the category to delete.
	 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
	 *
	 * @property {Function} permissions - Deletes permissions for a user by their ID.
	 * @param {string} userId - The ID of the user whose permissions to delete.
	 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
	 *
	 * @property {Function} diffTracking - Deletes diff tracking by its ID.
	 * @param {string} id - The ID of the diff tracking to delete.
	 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
	 */
	DELETE: {
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
	};

	/**
	 * Utilities for the `@studiocms/auth` package to interact
	 * 		with the StudioCMS SDK
	 */
	AUTH: {
		/**
		 * StudioCMS_SDK_authSession provides methods to manage authentication sessions.
		 *
		 * @property {Function} create - Creates a new session.
		 * @param {tsSessionTableInsert} data - The data to insert into the session table.
		 * @returns {Promise<Object>} The created session object.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the session.
		 *
		 * @property {Function} sessionWithUser - Retrieves a session along with the associated user.
		 * @param {string} sessionId - The ID of the session to retrieve.
		 * @returns {Promise<Object>} The session and associated user object.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while retrieving the session with user.
		 *
		 * @property {Function} delete - Deletes a session.
		 * @param {string} sessionId - The ID of the session to delete.
		 * @returns {Promise<Object>} An object indicating the status of the deletion.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the session.
		 *
		 * @property {Function} update - Updates the expiration date of a session.
		 * @param {string} sessionId - The ID of the session to update.
		 * @param {Date} newDate - The new expiration date.
		 * @returns {Promise<Object>} The updated session object.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the session.
		 */
		session: {
			create: (data: tsSessionTableInsert) => Promise<tsSessionTableSelect>;
			sessionWithUser: (
				sessionId: string
			) => Promise<{ user: tsUsersSelect; session: tsSessionTableSelect }[]>;
			delete: (sessionId: string) => Promise<DeletionResponse>;
			update: (sessionId: string, newDate: Date) => Promise<tsSessionTableSelect[]>;
		};

		/**
		 * The `StudioCMS_SDK_authUser` object provides methods for creating and updating user records
		 * in the StudioCMS system. It interacts with the database to perform these operations and
		 * handles errors by throwing `StudioCMS_SDK_Error` with appropriate messages.
		 *
		 * @property {Function} create - Asynchronously creates a new user record in the database.
		 * @param {tsUsersInsert} newUserData - The data for the new user to be created.
		 * @returns {Promise<any>} - A promise that resolves to the created user record.
		 * @throws {StudioCMS_SDK_Error} - Throws an error if the creation process fails.
		 *
		 * @property {Function} update - Asynchronously updates an existing user record in the database.
		 * @param {string} userId - The ID of the user to be updated.
		 * @param {tsUsersSelect} userData - The new data for the user.
		 * @returns {Promise<any>} - A promise that resolves to the updated user record.
		 * @throws {StudioCMS_SDK_Error} - Throws an error if the update process fails.
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

			searchUsersForUsernameOrEmail: (
				username: string,
				email: string
			) => Promise<{ usernameSearch: tsUsersSelect[]; emailSearch: tsUsersSelect[] }>;

			// delete: async () => {},
		};

		/**
		 * The `StudioCMS_SDK_authOAuth` object provides methods to handle OAuth authentication
		 * within the StudioCMS SDK. It includes methods to create and delete OAuth accounts.
		 *
		 * @type {STUDIOCMS_SDK['auth']['oAuth']}
		 *
		 * @property {Function} create - Asynchronously creates a new OAuth account with the provided data.
		 * @param {Object} data - The data for the new OAuth account.
		 * @returns {Promise<Object>} The created OAuth account.
		 * @throws {StudioCMS_SDK_Error} Throws an error if the account creation fails.
		 *
		 * @property {Function} delete - Asynchronously deletes an existing OAuth account based on user ID and provider.
		 * @param {string} userId - The ID of the user whose OAuth account is to be deleted.
		 * @param {string} provider - The provider of the OAuth account to be deleted.
		 * @returns {Promise<Object>} An object containing the status and message of the deletion operation.
		 * @throws {StudioCMS_SDK_Error} Throws an error if the account deletion fails.
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
		};

		/**
		 * An object representing the authentication permissions for the StudioCMS SDK.
		 *
		 * @property {Function} currentStatus - Asynchronously retrieves the current permissions status for a given user.
		 * @param {string} userId - The ID of the user whose permissions are being retrieved.
		 * @returns {Promise<any>} - A promise that resolves to the user's permissions.
		 * @throws {StudioCMS_SDK_Error} - Throws an error if there is an issue retrieving the user's permissions.
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
	};
}
