import type { Diff2HtmlConfig } from 'diff2html';
import { Effect } from 'effect';
import { convertToVanilla } from './effect/convertToVanilla.js';
import { SDKCore } from './sdkCore.js';
import type {
	CombinedInsertContent,
	CombinedPageData,
	CombinedRank,
	CombinedUserData,
	FolderNode,
	MetaOnlyPageData,
	MultiPageInsert,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataTagsInsertResponse,
	PaginateInput,
	SingleRank,
	SiteConfig,
	tsDiffTrackingInsert,
	tsDiffTrackingSelect,
	tsNotificationSettingsInsert,
	tsOAuthAccountsSelect,
	tsPageContentInsert,
	tsPageContentSelect,
	tsPageDataCategoriesInsert,
	tsPageDataCategoriesSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageDataTagsInsert,
	tsPageDataTagsSelect,
	tsPageFolderInsert,
	tsPageFolderSelect,
	tsPermissionsInsert,
	tsPermissionsSelect,
	tsSessionTableInsert,
	tsSiteConfigInsert,
	tsUsersInsert,
	tsUsersSelect,
	tsUsersUpdate,
} from './types/index.js';

/**
 * @deprecated
 */
export async function studiocmsSDKCore() {
	const run = await convertToVanilla(
		Effect.gen(function* () {
			const core = yield* SDKCore;
			return { ...core };
		}).pipe(Effect.provide(SDKCore.Default)),
		true
	);

	// @ts-ignore
	async function _getAllPages(
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: false,
		paginate?: PaginateInput
	): Promise<CombinedPageData[]>;
	async function _getAllPages(
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		tree?: FolderNode[],
		metaOnly?: true,
		paginate?: PaginateInput
	): Promise<MetaOnlyPageData[]>;

	async function _getAllPages(
		includeDrafts = false,
		hideDefaultIndex = false,
		metaOnly = false,
		paginate?: PaginateInput
	) {
		return await convertToVanilla(
			// @ts-ignore
			run.GET.pages(includeDrafts, hideDefaultIndex, metaOnly, paginate),
			true
		);
	}

	async function _getPagesByID(id: string) {
		return await convertToVanilla(
			// @ts-ignore
			run.GET.page.byId(id),
			true
		);
	}

	// @ts-ignore
	async function _getPagesByFolderID(
		id: string,
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: false,
		paginate?: PaginateInput
	): Promise<CombinedPageData[]>;
	async function _getPagesByFolderID(
		id: string,
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: true,
		paginate?: PaginateInput
	): Promise<MetaOnlyPageData[]>;

	async function _getPagesByFolderID(
		id: string,
		includeDrafts = false,
		hideDefaultIndex = false,
		metaOnly = false,
		paginate?: PaginateInput
	) {
		return await convertToVanilla(
			// @ts-ignore
			run.GET.folderPages(id, includeDrafts, hideDefaultIndex, metaOnly, paginate),
			true
		);
	}

	async function _getPagesBySlug(slug: string) {
		return await convertToVanilla(
			// @ts-ignore
			run.GET.page.bySlug(slug),
			true
		);
	}

	async function _getPackagesPages(packageName: string, tree?: FolderNode[]) {
		return await convertToVanilla(
			// @ts-ignore
			run.GET.packagePages(packageName, tree),
			true
		);
	}

	const REST_API = {
		tokens: {
			get: async (userId: string) => await convertToVanilla(run.REST_API.tokens.get(userId), true),
			new: async (userId: string, description: string) =>
				await convertToVanilla(run.REST_API.tokens.new(userId, description), true),
			delete: async (userId: string, tokenId: string) =>
				await convertToVanilla(run.REST_API.tokens.delete(userId, tokenId), true),
			verify: async (key: string) => await convertToVanilla(run.REST_API.tokens.verify(key), true),
		},
	};

	const diffTracking = {
		insert: async (
			userId: string,
			pageId: string,
			data: {
				content: {
					start: string;
					end: string;
				};
				metaData: {
					start: Partial<tsPageDataSelect>;
					end: Partial<tsPageDataSelect>;
				};
			},
			diffLength: number
		) => await convertToVanilla(run.diffTracking.insert(userId, pageId, data, diffLength), true),
		clear: async (pageId: string) => await convertToVanilla(run.diffTracking.clear(pageId), true),
		get: {
			byPageId: {
				all: async (pageId: string) =>
					await convertToVanilla(run.diffTracking.get.byPageId.all(pageId), true),
				latest: async (pageId: string, count: number) =>
					await convertToVanilla(run.diffTracking.get.byPageId.latest(pageId, count), true),
			},
			byUserId: {
				all: async (pageId: string) =>
					await convertToVanilla(run.diffTracking.get.byUserId.all(pageId), true),
				latest: async (pageId: string, count: number) =>
					await convertToVanilla(run.diffTracking.get.byUserId.latest(pageId, count), true),
			},
			single: async (id: string) => await convertToVanilla(run.diffTracking.get.single(id), true),
		},
		revertToDiff: async (id: string, type: 'content' | 'data' | 'both') =>
			await convertToVanilla(run.diffTracking.revertToDiff(id, type), true),
		utils: {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			getMetaDataDifferences<T extends Record<string, any>>(
				obj1: T,
				obj2: T
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			): { label: string; previous: any; current: any }[] {
				return convertToVanilla(run.diffTracking.utils.getMetaDataDifferences(obj1, obj2));
			},
			getDiffHTML: (diff: string | null, options?: Diff2HtmlConfig) =>
				convertToVanilla(run.diffTracking.utils.getDiffHTML(diff, options)),
		},
	};

	const AUTH = {
		verifyEmail: {
			get: async (id: string) => await convertToVanilla(run.AUTH.verifyEmail.get(id), true),
			create: async (userId: string) =>
				await convertToVanilla(run.AUTH.verifyEmail.create(userId), true),
			delete: async (userId: string) =>
				await convertToVanilla(run.AUTH.verifyEmail.delete(userId), true),
		},

		/**
		 * Provides various methods to create, delete, and search for OAuth accounts in the StudioCMS database.
		 */
		oAuth: {
			/**
			 * Creates a new OAuth account in the database.
			 *
			 * @param data - The data to insert into the OAuth account table.
			 * @returns A promise that resolves to the inserted OAuth account.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the OAuth account.
			 */
			create: async (data: tsOAuthAccountsSelect) =>
				await convertToVanilla(run.AUTH.oAuth.create(data), true),

			/**
			 * Deletes an OAuth account from the database.
			 *
			 * @param userId - The ID of the user associated with the OAuth account.
			 * @param provider - The provider of the OAuth account.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the OAuth account.
			 */
			delete: async (userId: string, provider: string) =>
				await convertToVanilla(run.AUTH.oAuth.delete(userId, provider), true),

			/**
			 * Searches for OAuth accounts based on the provider ID and user ID.
			 *
			 * @param providerId - The provider ID to search for.
			 * @param userId - The user ID to search for.
			 * @returns A promise that resolves to the OAuth account data if found, otherwise undefined.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while searching for the OAuth account.
			 */
			searchProvidersForId: async (providerId: string, userId: string) =>
				await convertToVanilla(run.AUTH.oAuth.searchProvidersForId(providerId, userId), true),
		},

		/**
		 * Provides various methods to get and update permissions for users in the StudioCMS database.
		 */
		permission: {
			/**
			 * Checks the current status of a user's permissions.
			 */
			currentStatus: async (userId: string) =>
				await convertToVanilla(run.AUTH.permission.currentStatus(userId), true),
		},

		/**
		 * Provides various methods to create, delete, and update sessions in the StudioCMS database.
		 */
		session: {
			/**
			 * Creates a new session in the database.
			 *
			 * @param data - The data to insert into the session table.
			 * @returns A promise that resolves to the inserted session.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the session.
			 */
			create: async (data: tsSessionTableInsert) =>
				await convertToVanilla(run.AUTH.session.create(data), true),

			/**
			 * Gets a session with the associated user.
			 *
			 * @param sessionId - The ID of the session to search for.
			 * @returns A promise that resolves to the session with the associated user.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the session with the user.
			 */
			sessionWithUser: async (sessionId: string) =>
				await convertToVanilla(run.AUTH.session.sessionWithUser(sessionId), true),

			/**
			 * Deletes a session from the database.
			 *
			 * @param sessionId - The ID of the session to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the session.
			 */
			delete: async (sessionId: string) =>
				await convertToVanilla(run.AUTH.session.delete(sessionId), true),

			/**
			 * Updates the expiration date of a session.
			 *
			 * @param sessionId - The ID of the session to update.
			 * @param newDate - The new expiration date for the session.
			 * @returns A promise that resolves to the updated session.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the session.
			 */
			update: async (sessionId: string, newDate: Date) =>
				await convertToVanilla(run.AUTH.session.update(sessionId, newDate), true),
		},

		/**
		 * Provides various methods to create, update, and search for users in the StudioCMS database.
		 */
		user: {
			/**
			 * Creates a new user in the database.
			 *
			 * @param newUserData - The data to insert into the users table.
			 * @returns A promise that resolves to the inserted user.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the user.
			 */
			create: async (newUserData: tsUsersInsert, rank?: 'visitor' | 'editor' | 'admin' | 'owner') =>
				await convertToVanilla(run.AUTH.user.create(newUserData, rank), true),

			/**
			 * Updates a user in the database.
			 *
			 * @param userId - The ID of the user to update.
			 * @param userData - The data to update the user with.
			 * @returns A promise that resolves to the updated user.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the user.
			 */
			update: async (userId: string, userData: tsUsersUpdate) =>
				await convertToVanilla(run.AUTH.user.update(userId, userData), true),

			/**
			 * Searches for users based on the provided username or email.
			 *
			 * @param username - The username to search for.
			 * @param email - The email to search for.
			 * @returns A promise that resolves to an object containing the search results for the username and email.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while searching for the username or email.
			 */
			searchUsersForUsernameOrEmail: async (username: string, email: string) =>
				await convertToVanilla(run.AUTH.user.searchUsersForUsernameOrEmail(username, email), true),

			/**
			 * Ghost user utilities.
			 */
			ghost: {
				/**
				 * Verifies if the ghost user exists in the database.
				 *
				 * @returns A promise that resolves to a boolean indicating if the ghost user exists.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while verifying the ghost user.
				 */
				verifyExists: async () => await convertToVanilla(run.AUTH.user.ghost.verifyExists(), true),

				/**
				 * Creates the ghost user in the database.
				 *
				 * @returns A promise that resolves to the inserted ghost user.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
				 */
				create: async () => await convertToVanilla(run.AUTH.user.ghost.create(), true),

				/**
				 * Gets the ghost user from the database.
				 *
				 * @returns A promise that resolves to the ghost user.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the ghost user.
				 */
				get: async () => await convertToVanilla(run.AUTH.user.ghost.get(), true),
			},
		},
	};

	const INIT = {
		/**
		 * Initializes the StudioCMS SiteConfig table with the provided configuration.
		 *
		 * @param config - The configuration to insert into the SiteConfig table.
		 * @returns A promise that resolves to the inserted site configuration.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the site configuration.
		 */
		siteConfig: async (config: tsSiteConfigInsert) =>
			await convertToVanilla(run.INIT.siteConfig(config), true),

		/**
		 * Initializes the StudioCMS Ghost User.
		 *
		 * The ghost user is a default user that is used to perform actions on behalf of the system as well as to replace deleted users.
		 *
		 * @returns A promise that resolves to the ghost user record.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
		 */
		ghostUser: async () => await convertToVanilla(run.INIT.ghostUser(), true),
	};

	const notificationSettings = {
		site: {
			get: async () => await convertToVanilla(run.notificationSettings.site.get(), true),
			update: async (settings: tsNotificationSettingsInsert) =>
				await convertToVanilla(run.notificationSettings.site.update(settings), true),
		},
	};

	const GET = {
		/**
		 * Retrieves data from the database
		 */
		database: {
			/**
			 * Retrieves all users from the database.
			 *
			 * @returns A promise that resolves to an array of combined user data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the users.
			 */
			users: async (): Promise<CombinedUserData[]> =>
				await convertToVanilla(run.GET.users.all(), true),

			/**
			 * Retrieves all pages from the database.
			 *
			 * @returns A promise that resolves to an array of combined page data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the pages.
			 */
			pages: _getAllPages,

			/**
			 * Retrieves all the pages from the database that are related to a specific folder
			 */
			folderPages: _getPagesByFolderID,

			/**
			 * Retrieves the site configuration from the database.
			 *
			 * @returns A promise that resolves to the site configuration.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the site configuration.
			 */
			config: async () => (await convertToVanilla(run.GET.siteConfig(), true)).data,

			folders: async (): Promise<tsPageFolderSelect[]> =>
				await convertToVanilla(run.GET.databaseTable.pageFolderStructure(), true),
		},

		/**
		 * Retrieves data from the database by ID.
		 */
		databaseEntry: {
			/**
			 * Retrieves a user from the database
			 */
			users: {
				/**
				 * Retrieves a user by ID.
				 *
				 * @param id - The ID of the user to retrieve.
				 * @returns A promise that resolves to the user data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the user.
				 */
				byId: async (id: string): Promise<CombinedUserData | undefined> =>
					await convertToVanilla(run.GET.users.byId(id), true),

				/**
				 * Retrieves a user by username.
				 *
				 * @param username - The username of the user to retrieve.
				 * @returns A promise that resolves to the user data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the user.
				 */
				byUsername: async (username: string): Promise<CombinedUserData | undefined> =>
					await convertToVanilla(run.GET.users.byUsername(username), true),

				/**
				 * Retrieves a user by email.
				 *
				 * @param email - The email of the user to retrieve.
				 * @returns A promise that resolves to the user data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the user.
				 */
				byEmail: async (email: string): Promise<CombinedUserData | undefined> =>
					await convertToVanilla(run.GET.users.byEmail(email), true),
			},

			/**
			 * Retrieves a page from the database
			 */
			pages: {
				/**
				 * Retrieves a page by ID.
				 *
				 * @param id - The ID of the page to retrieve.
				 * @returns A promise that resolves to the page data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page.
				 */
				byId: _getPagesByID,

				/**
				 * Retrieves a page by slug.
				 *
				 * @param slug - The slug of the page to retrieve.
				 * @returns A promise that resolves to the page data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page.
				 */
				bySlug: _getPagesBySlug,
			},

			folder: async (id: string): Promise<tsPageFolderSelect | undefined> =>
				await convertToVanilla(run.GET.folder(id), true),
		},

		/**
		 * Retrieves data from the database tables without any additional processing.
		 */
		databaseTable: {
			/**
			 * Retrieves all data from the users table.
			 *
			 * @returns A promise that resolves to an array of user data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the users.
			 */
			users: async () => await convertToVanilla(run.GET.databaseTable.users(), true),

			/**
			 * Retrieves all data from the OAuth accounts table.
			 *
			 * @returns A promise that resolves to an array of OAuth account data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the OAuth accounts.
			 */
			oAuthAccounts: async () =>
				await convertToVanilla(run.GET.databaseTable.oAuthAccounts(), true),

			/**
			 * Retrieves all data from the session table.
			 *
			 * @returns A promise that resolves to an array of session data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the sessions.
			 */
			sessionTable: async () => await convertToVanilla(run.GET.databaseTable.sessionTable(), true),

			/**
			 * Retrieves all data from the permissions table.
			 *
			 * @returns A promise that resolves to an array of permission data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the permissions.
			 */
			permissions: async () => await convertToVanilla(run.GET.databaseTable.permissions(), true),

			/**
			 * Retrieves all data from the page data table.
			 *
			 * @returns A promise that resolves to an array of page data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the pages.
			 */
			pageData: async () => await convertToVanilla(run.GET.databaseTable.pageData(), true),

			/**
			 * Retrieves all data from the page data tags table.
			 *
			 * @returns A promise that resolves to an array of page data tags.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page data tags.
			 */
			pageDataTags: async () => await convertToVanilla(run.GET.databaseTable.pageDataTags(), true),

			/**
			 * Retrieves all data from the page data categories table.
			 *
			 * @returns A promise that resolves to an array of page data categories.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page data categories.
			 */
			pageDataCategories: async () =>
				await convertToVanilla(run.GET.databaseTable.pageDataCategories(), true),

			/**
			 * Retrieves all data from the page content table.
			 *
			 * @returns A promise that resolves to an array of page content.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page content.
			 */
			pageContent: async () => await convertToVanilla(run.GET.databaseTable.pageContent(), true),

			/**
			 * Retrieves all data from the site config table.
			 *
			 * @returns A promise that resolves to an array of site configuration data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the site configuration.
			 */
			siteConfig: async () => await convertToVanilla(run.GET.databaseTable.siteConfig(), true),

			/**
			 * Retrieves all data from the diff tracking table.
			 *
			 * @returns A promise that resolves to an array of diff tracking data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the diff tracking data.
			 */
			diffTracking: async () => await convertToVanilla(run.GET.databaseTable.diffTracking(), true),

			/**
			 * Retrieves all data from the page folder structure table.
			 *
			 * @returns A promise that resolves to an array of page folder structure data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page folder structure data.
			 */
			pageFolderStructure: async () =>
				await convertToVanilla(run.GET.databaseTable.pageFolderStructure(), true),

			/**
			 * Retrieves all data from the notification settings table.
			 *
			 * @returns A promise that resolves to an array of notification settings data.
			 */
			notificationSettings: async () =>
				await convertToVanilla(run.GET.databaseTable.notificationSettings(), true),

			/**
			 * Retrieves all data from the email verification tokens table.
			 *
			 * @returns A promise that resolves to an array of email verification token data.
			 */
			emailVerificationTokens: async () =>
				await convertToVanilla(run.GET.databaseTable.emailVerificationTokens(), true),
		},

		/**
		 * Retrieve Permission Lists
		 */
		permissionsLists: {
			/**
			 * Retrieves all permissions for users in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the permissions.
			 */
			all: async (): Promise<CombinedRank[]> =>
				await convertToVanilla(run.GET.permissionsLists.all(), true),

			/**
			 * Retrieves all owners in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the owners.
			 */
			owners: async (): Promise<SingleRank[]> =>
				await convertToVanilla(run.GET.permissionsLists.owners(), true),

			/**
			 * Retrieves all admins in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the admins.
			 */
			admins: async (): Promise<SingleRank[]> =>
				await convertToVanilla(run.GET.permissionsLists.admins(), true),

			/**
			 * Retrieves all editors in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the editors.
			 */
			editors: async (): Promise<SingleRank[]> =>
				await convertToVanilla(run.GET.permissionsLists.editors(), true),

			/**
			 * Retrieves all visitors in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the visitors.
			 */
			visitors: async (): Promise<SingleRank[]> =>
				await convertToVanilla(run.GET.permissionsLists.visitors(), true),
		},

		/**
		 * Retrieves data from the database by package.
		 */
		packagePages: _getPackagesPages,
	};

	const POST = {
		/**
		 * Inserts data into the database by Entry
		 */
		databaseEntry: {
			/**
			 * Insert a new page into the database.
			 *
			 * @param pageData - The data to insert into the page data table.
			 * @param pageContent - The data to insert into the page content table.
			 * @returns A promise that resolves to the inserted page data and page content.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the page.
			 */
			pages: async (pageData: tsPageDataInsert, pageContent: CombinedInsertContent) =>
				await convertToVanilla(run.POST.databaseEntry.pages(pageData, pageContent), true),

			/**
			 * Inserts new page content into the database.
			 *
			 * @param pageContent - The data to insert into the page content table.
			 * @returns A promise that resolves to the inserted page content.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the page content.
			 */
			pageContent: async (pageContent: tsPageContentInsert): Promise<PageContentReturnId[]> =>
				await convertToVanilla(run.POST.databaseEntry.pageContent(pageContent), true),

			/**
			 * Inserts a new tag into the database.
			 *
			 * @param tag - The data to insert into the page data tags table.
			 * @returns A promise that resolves to the inserted tag.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the tag.
			 */
			tags: async (tag: tsPageDataTagsInsert): Promise<PageDataTagsInsertResponse[]> =>
				await convertToVanilla(run.POST.databaseEntry.tags(tag), true),

			/**
			 * Inserts a new category into the database.
			 *
			 * @param category - The data to insert into the page data categories table.
			 * @returns A promise that resolves to the inserted category.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the category.
			 */
			categories: async (category: tsPageDataCategoriesInsert) =>
				await convertToVanilla(run.POST.databaseEntry.categories(category), true),

			/**
			 * Inserts a new permission into the database.
			 *
			 * @param userId - The ID of the user to assign the rank to.
			 * @param rank - The rank to assign to the user.
			 * @returns A promise that resolves to the inserted permission.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the permission.
			 */
			permissions: async (userId: string, rank: string): Promise<tsPermissionsSelect[]> =>
				await convertToVanilla(run.POST.databaseEntry.permissions(userId, rank), true),

			/**
			 * Inserts a new diff tracking entry into the database.
			 *
			 * @param diff - The data to insert into the diff tracking table.
			 * @returns A promise that resolves to the inserted diff tracking entry.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the diff tracking entry.
			 */
			diffTracking: async (diff: tsDiffTrackingInsert): Promise<tsDiffTrackingSelect[]> =>
				await convertToVanilla(run.POST.databaseEntry.diffTracking(diff), true),

			/**
			 * Inserts a new folder into the database.
			 *
			 * @param folder - The data to insert into the page folder structure table.
			 * @returns A promise that resolves to the inserted folder.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the folder.
			 */
			folder: async (folder: tsPageFolderInsert): Promise<tsPageFolderSelect> =>
				await convertToVanilla(run.POST.databaseEntry.folder(folder), true),
		},

		/**
		 * Inserts data into the database by Array of Entries
		 */
		databaseEntries: {
			/**
			 * Inserts multiple tags into the database.
			 *
			 * @param data - The data to insert into the page data tags table.
			 * @returns A promise that resolves to the inserted tags.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the tags.
			 */
			tags: async (data: tsPageDataTagsInsert[]): Promise<PageDataTagsInsertResponse[]> =>
				await convertToVanilla(run.POST.databaseEntries.tags(data), true),

			/**
			 * Inserts multiple categories into the database.
			 *
			 * @param data - The data to insert into the page data categories table.
			 * @returns A promise that resolves to the inserted categories.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the categories.
			 */
			categories: async (
				data: tsPageDataCategoriesInsert[]
			): Promise<PageDataCategoriesInsertResponse[]> =>
				await convertToVanilla(run.POST.databaseEntries.categories(data), true),

			/**
			 * Inserts multiple permissions into the database.
			 *
			 * @param data - The data to insert into the permissions table.
			 * @returns A promise that resolves to the inserted permissions.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the permissions.
			 */
			permissions: async (data: tsPermissionsInsert[]): Promise<tsPermissionsSelect[]> =>
				await convertToVanilla(run.POST.databaseEntries.permissions(data), true),

			/**
			 * Inserts multiple pages into the database.
			 *
			 * @param pages - The data to insert into the page data and page content tables.
			 * @returns A promise that resolves to the inserted pages.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the pages.
			 */
			pages: async (pages: MultiPageInsert): Promise<void> =>
				await convertToVanilla(run.POST.databaseEntries.pages(pages), true),
		},
	};

	const UPDATE = {
		/**
		 * Updates a page content in the database.
		 *
		 * @param data - The data to update in the page content table.
		 * @returns A promise that resolves to the updated page content.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the page content.
		 */
		pageContent: async (data: tsPageContentSelect): Promise<tsPageContentSelect> =>
			await convertToVanilla(run.UPDATE.pageContent(data), true),

		/**
		 * Updates a tag in the database.
		 *
		 * @param data - The data to update in the page data tags table.
		 * @returns A promise that resolves to the updated tag.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the tag.
		 */
		tags: async (data: tsPageDataTagsSelect): Promise<tsPageDataTagsSelect> =>
			await convertToVanilla(run.UPDATE.tags(data), true),

		/**
		 * Updates a category in the database.
		 *
		 * @param data - The data to update in the page data categories table.
		 * @returns A promise that resolves to the updated category.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the category.
		 */
		categories: async (data: tsPageDataCategoriesSelect): Promise<tsPageDataCategoriesSelect> =>
			await convertToVanilla(run.UPDATE.categories(data), true),

		/**
		 * Updates a permission in the database.
		 *
		 * @param data - The data to update in the permissions table.
		 * @returns A promise that resolves to the updated permission.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the permission.
		 */
		permissions: async (data: tsPermissionsSelect): Promise<tsPermissionsSelect> =>
			await convertToVanilla(run.UPDATE.permissions(data), true),

		/**
		 * Updates a site configuration in the database.
		 *
		 * @param data - The data to update in the site config table.
		 * @returns A promise that resolves to the updated site configuration.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the site configuration.
		 */
		siteConfig: async (data: SiteConfig) =>
			(await convertToVanilla(run.UPDATE.siteConfig(data), true)).data,

		folder: async (data: tsPageFolderSelect): Promise<tsPageFolderSelect> =>
			await convertToVanilla(run.UPDATE.folder(data), true),
	};

	const DELETE = {
		/**
		 * Deletes a page from the database.
		 *
		 * @param id - The ID of the page to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page.
		 */
		page: async (id: string) => await convertToVanilla(run.DELETE.page(id), true),

		/**
		 * Deletes a page content from the database.
		 *
		 * @param id - The ID of the page content to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page content.
		 */
		pageContent: async (id: string) => await convertToVanilla(run.DELETE.pageContent(id), true),

		/**
		 * Deletes a page content lang from the database.
		 *
		 * @param id - The ID of the page content to delete.
		 * @param lang - The lang of the page content to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page content lang.
		 */
		pageContentLang: async (id: string, lang: string) =>
			await convertToVanilla(run.DELETE.pageContentLang(id, lang), true),

		/**
		 * Deletes a tag from the database.
		 *
		 * @param id - The ID of the tag to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the tag.
		 */
		tags: async (id: number) => await convertToVanilla(run.DELETE.tags(id), true),

		/**
		 * Deletes a category from the database.
		 *
		 * @param id - The ID of the category to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the category.
		 */
		categories: async (id: number) => await convertToVanilla(run.DELETE.categories(id), true),

		/**
		 * Deletes a permission from the database.
		 *
		 * @param userId - The ID of the user to delete the permission for.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the permission.
		 */
		permissions: async (userId: string) =>
			await convertToVanilla(run.DELETE.permissions(userId), true),

		/**
		 * Deletes a site configuration from the database.
		 *
		 * @param id - The ID of the site configuration to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the site configuration.
		 */
		diffTracking: async (id: string) => await convertToVanilla(run.DELETE.diffTracking(id), true),

		/**
		 * Deletes a folder from the database.
		 *
		 * @param id - The ID of the folder to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the folder.
		 */
		folder: async (id: string) => await convertToVanilla(run.DELETE.folder(id), true),

		/**
		 * Deletes a user from the database.
		 *
		 * @param id - The ID of the user to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the user.
		 */
		user: async (id: string) => await convertToVanilla(run.DELETE.user(id), true),
	};

	// Return the public methods
	return {
		db: run.db,
		addPageToFolderTree: (tree: FolderNode[], folderId: string, newPage: FolderNode) =>
			convertToVanilla(run.addPageToFolderTree(tree, folderId, newPage)),
		findNodeById: (tree: FolderNode[], id: string) => convertToVanilla(run.findNodeById(tree, id)),
		findNodeByPath: (tree: FolderNode[], path: string[]) =>
			convertToVanilla(run.findNodeByPath(tree, path)),
		findNodesAlongPath: (tree: FolderNode[], path: string[]) =>
			convertToVanilla(run.findNodesAlongPath(tree, path)),
		getFullPath: (tree: FolderNode[], path: string[]) =>
			convertToVanilla(run.getFullPath(tree, path)),
		parseIdNumberArray: (ids: unknown) => convertToVanilla(run.parseIdNumberArray(ids)),
		parseIdStringArray: (ids: unknown) => convertToVanilla(run.parseIdStringArray(ids)),
		generateRandomIDNumber: (length: number) =>
			convertToVanilla(run.generateRandomIDNumber(length)),
		generateToken: (userId: string, noExpire?: boolean) =>
			convertToVanilla(run.generateToken(userId, noExpire)),
		testToken: (token: string) => convertToVanilla(run.testToken(token)),
		combineRanks: (rank: string, users: SingleRank[]) =>
			convertToVanilla(run.combineRanks(rank, users)),
		verifyRank: (users: tsUsersSelect[], permissions: tsPermissionsSelect[], rank: string) =>
			convertToVanilla(run.verifyRank(users, permissions, rank)),
		generateRandomPassword: (length: number) =>
			convertToVanilla(run.generateRandomPassword(length)),
		buildFolderTree: async () => await convertToVanilla(run.buildFolderTree, true),
		getAvailableFolders: async () => await convertToVanilla(run.getAvailableFolders, true),
		clearUserReferences: async (userId: string) =>
			await convertToVanilla(run.clearUserReferences(userId), true),
		collectCategories: async (categoryIds: number[]) =>
			await convertToVanilla(run.collectCategories(categoryIds), true),
		collectTags: async (tagIds: number[]) => await convertToVanilla(run.collectTags(tagIds), true),
		collectPageData: async (page: tsPageDataSelect, tree: FolderNode[]) =>
			await convertToVanilla(run.collectPageData(page, tree), true),
		collectUserData: async (user: tsUsersSelect) =>
			await convertToVanilla(run.collectUserData(user), true),
		resetTokenBucket: {
			new: async (userId: string) => await convertToVanilla(run.resetTokenBucket.new(userId), true),
			delete: async (userId: string) =>
				await convertToVanilla(run.resetTokenBucket.delete(userId), true),
			check: async (token: string) =>
				await convertToVanilla(run.resetTokenBucket.check(token), true),
		},
		diffTracking,
		notificationSettings,
		AUTH,
		INIT,
		DELETE,
		REST_API,
		GET,
		POST,
		UPDATE,
	};
}
