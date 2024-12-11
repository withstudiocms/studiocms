import type { Table } from '@astrojs/db/runtime';
import type {
	AvailableLists,
	CombinedRank,
	CurrentTables,
	DatabaseEntryTables,
	DatabaseTables,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataReturnId,
	PageDataStripped,
	PageDataTagsInsertResponse,
	PermissionsList,
	SimplifiedTables,
	SingleRank,
	SiteConfig,
} from './tables.types';
import type {
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
	tsSiteConfigSelect,
	tsUsersSelect,
} from './tsAlias.types';

export type {
	// tables.types.ts
	AvailableLists,
	CombinedRank,
	CurrentTables,
	DatabaseEntryTables,
	DatabaseTables,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataReturnId,
	PageDataStripped,
	PageDataTagsInsertResponse,
	PermissionsList,
	SimplifiedTables,
	SingleRank,
	SiteConfig,
	// tsAlias.types.ts
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
 * Interface for retrieving user data from the database.
 * Provides methods to fetch user data by different identifiers.
 */
interface GetDatabaseEntryUser {
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
}

/**
 * Interface representing methods to retrieve database entries for pages.
 */
interface GetDatabaseEntryPage {
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
}

/**
 * Represents a database entry which can be either a user or a page.
 */
export type GetDatabaseEntry = GetDatabaseEntryUser | GetDatabaseEntryPage;

/**
 * Represents the possible return types for a database query.
 *
 * @type {SiteConfig | CombinedUserData[] | CombinedPageData[] | undefined}
 *
 * @property {SiteConfig} SiteConfig - Configuration settings for the site.
 * @property {CombinedUserData[]} CombinedUserData - Array of combined user data.
 * @property {CombinedPageData[]} CombinedPageData - Array of combined page data.
 * @property {undefined} undefined - Indicates that the database query returned no results.
 */
export type GetDatabase = SiteConfig | CombinedUserData[] | CombinedPageData[] | undefined;

/**
 * Interface representing the methods to add entries to various database tables.
 */
export interface AddDatabaseEntry {
	/**
	 * Methods related to the `pages` table.
	 */
	pages: {
		/**
		 * Inserts a new page entry into the database.
		 * @param pageData - The data for the page to be inserted.
		 * @param pageContent - The content for the page to be inserted.
		 * @returns A promise that resolves to the result of the page insertion.
		 */
		insert: (
			pageData: tsPageDataInsert,
			pageContent: tsPageContentInsert
		) => Promise<addDatabaseEntryInsertPage>;
	};
	/**
	 * Methods related to the `pageContent` table.
	 */
	pageContent: {
		/**
		 * Inserts new content for a specific page into the database.
		 * @param pageId - The ID of the page to which the content belongs.
		 * @param pageContent - The content to be inserted.
		 * @returns A promise that resolves to an array of inserted content IDs.
		 */
		insert: (pageId: string, pageContent: tsPageContentInsert) => Promise<PageContentReturnId[]>;
	};
	/**
	 * Methods related to the `tags` table.
	 */
	tags: {
		/**
		 * Inserts a new tag into the database.
		 * @param tag - The tag data to be inserted.
		 * @returns A promise that resolves to an array of inserted tag responses.
		 */
		insert: (tag: tsPageDataTagsInsert) => Promise<PageDataTagsInsertResponse[]>;
	};
	/**
	 * Methods related to the `categories` table.
	 */
	categories: {
		/**
		 * Inserts a new category into the database.
		 * @param category - The category data to be inserted.
		 * @returns A promise that resolves to an array of inserted category responses.
		 */
		insert: (category: tsPageDataCategoriesInsert) => Promise<PageDataCategoriesInsertResponse[]>;
	};
	/**
	 * Methods related to the `permissions` table.
	 */
	permissions: {
		/**
		 * Inserts a new permission for a user into the database.
		 * @param userId - The ID of the user to whom the permission is granted.
		 * @param rank - The rank or level of the permission.
		 * @returns A promise that resolves to an array of selected permissions.
		 */
		insert: (userId: string, rank: string) => Promise<tsPermissionsSelect[]>;
	};
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

		/**
		 * Retrieves the pages associated with a given package name.
		 *
		 * @param packageName - The name of the package for which to retrieve pages.
		 * @returns A promise that resolves to an array of CombinedPageData objects.
		 */
		packagePages: (packageName: string) => Promise<CombinedPageData[]>;

		/**
		 * Retrieves a list of permissions based on the specified list type.
		 *
		 * @param list - The type of list to retrieve. Can be one of 'all', 'owners', 'admins', 'editors', or 'visitors'.
		 * @returns A promise that resolves to an array of permissions lists.
		 *
		 * The function performs the following actions based on the list type:
		 * - 'all': Retrieves all users and their permissions, then categorizes them into owners, admins, editors, and visitors.
		 * - 'owners': Retrieves users with 'owner' permissions.
		 * - 'admins': Retrieves users with 'admin' permissions.
		 * - 'editors': Retrieves users with 'editor' permissions.
		 * - 'visitors': Retrieves users with 'visitor' permissions.
		 *
		 * The function uses the following helper functions:
		 * - `verifyRank`: Verifies the rank of users based on the existing users and current permitted users.
		 * - `combineRanks`: Combines users of a specific rank into a single list.
		 *
		 * @example
		 * ```typescript
		 * const owners = await getPermissionsLists('owners');
		 * console.log(owners);
		 * ```
		 */
		permissionsLists: (list: AvailableLists) => Promise<PermissionsList[]>;
	};
	/**
	 * Contains methods for adding data to the database.
	 */
	POST: {
		/**
		 * Methods related to adding entries to the database.
		 */
		databaseEntry: AddDatabaseEntry;
	};
}
