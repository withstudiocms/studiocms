import { CMSSiteConfigId, GhostUserDefaults } from '../consts.js';
import { StudioCMS_SDK_Error } from './errors.js';
import {
	tsDiffTracking,
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
	tsSessionTable,
	tsSiteConfig,
	tsUsers,
} from './tables.js';
import type {
	AstroDBVirtualModule,
	CombinedInsertContent,
	CombinedPageData,
	CombinedRank,
	CombinedUserData,
	DeletionResponse,
	FolderListItem,
	FolderNode,
	MultiPageInsert,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataTagsInsertResponse,
	SingleRank,
	addDatabaseEntryInsertPage,
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
	tsPageFolderSelect,
	tsPermissionsInsert,
	tsPermissionsSelect,
	tsSessionTableInsert,
	tsSessionTableSelect,
	tsSiteConfigInsert,
	tsSiteConfigSelect,
	tsUsersInsert,
	tsUsersSelect,
	tsUsersUpdate,
} from './types/index.js';

/**
 * The StudioCMSSDK class provides a comprehensive set of methods for interacting with the StudioCMS database.
 * It includes functionalities for parsing input data, collecting and combining page and user data, managing
 * authentication and authorization, and performing CRUD operations on various database tables.
 *
 * @class StudioCMSSDK
 * @param AstroDB - The AstroDB virtual module to interact with the database.
 *
 * @example
 * ```ts
 * import * as AstroDB from 'astro:db';
 * import { uninitializedStudioCMSSDK } from '@studiocms/core/sdk-utils';
 *
 * const sdkCore = new uninitializedStudioCMSSDK(AstroDB);
 * ```
 */
export class StudioCMSSDK {
	private db: AstroDBVirtualModule['db'];
	private and: AstroDBVirtualModule['and'];
	private eq: AstroDBVirtualModule['eq'];

	constructor(AstroDB: AstroDBVirtualModule) {
		this.db = AstroDB.db;
		this.and = AstroDB.and;
		this.eq = AstroDB.eq;
	}

	/**
	 * Parses an unknown input and casts it to an array of numbers.
	 *
	 * @param ids - The input to be parsed, expected to be an array of numbers.
	 * @returns An array of numbers.
	 */
	public parseIdNumberArray(ids: unknown): number[] {
		return ids as number[];
	}

	/**
	 * Parses the given input as an array of strings.
	 *
	 * @param ids - The input to be parsed, expected to be an array of unknown type.
	 * @returns An array of strings parsed from the input.
	 */
	public parseIdStringArray(ids: unknown): string[] {
		return ids as string[];
	}

	/**
	 * Builds a folder structure from the provided folder data.
	 *
	 * @param folders - An array of folder data to build the folder structure from.
	 * @returns An array of folder nodes representing the folder structure.
	 */
	public generateFolderTree(folders: tsPageFolderSelect[]): FolderNode[] {
		// Create a lookup table
		const folderMap: Record<string, FolderNode> = {};

		for (const folder of folders) {
			folderMap[folder.id] = { id: folder.id, name: folder.name, page: false, children: [] };
		}

		// Build the tree
		const rootFolders: FolderNode[] = [];

		for (const folder of folders) {
			const childFolder = folderMap[folder.id];
			if (!childFolder) continue; // Skip if childFolder is undefined

			if (folder.parent === null) {
				// Root-level folder
				rootFolders.push(childFolder);
			} else {
				const parentFolder = folderMap[folder.parent];
				if (parentFolder) {
					// Add to parent's children
					parentFolder.children.push(childFolder);
				}
			}
		}

		return rootFolders;
	}

	/**
	 * Gets the folder structure from the database.
	 *
	 * @returns A promise that resolves to an array of folder nodes representing the folder structure.
	 */
	public async buildFolderTree(): Promise<FolderNode[]> {
		const currentFolders = await this.db.select().from(tsPageFolderStructure);
		return this.generateFolderTree(currentFolders);
	}

	/**
	 * Gets the available folders from the database.
	 *
	 * @returns A promise that resolves to an array of folder list items.
	 */
	public async getAvailableFolders(): Promise<FolderListItem[]> {
		const folders: FolderListItem[] = [];
		const currentFolders = await this.db.select().from(tsPageFolderStructure);
		for (const current of currentFolders) {
			folders.push(current);
		}
		return folders;
	}

	/**
	 * Finds a node in the tree that matches the given URL path.
	 * @param tree - The root of the folder tree.
	 * @param path - The URL path to locate.
	 * @returns The matching node or null if not found.
	 */
	public findNodeByPath(tree: FolderNode[], path: string[]): FolderNode | null {
		if (path.length === 0) return null;

		const [current, ...rest] = path;

		for (const node of tree) {
			if (node.name === current) {
				if (rest.length === 0) return node;
				return this.findNodeByPath(node.children, rest);
			}
		}

		return null;
	}

	/**
	 * Finds all nodes along the path to a specific node by its ID.
	 * @param tree - The root of the folder tree.
	 * @param id - The ID of the target node.
	 * @returns An array of nodes along the path or an empty array if the node is not found.
	 */
	public findNodesAlongPathToId(tree: FolderNode[], id: string): FolderNode[] {
		const path: FolderNode[] = [];

		function helper(nodes: FolderNode[], targetId: string): boolean {
			for (const node of nodes) {
				path.push(node); // Add the current node to the path

				if (node.id === targetId) {
					return true; // Target found, stop recursion
				}

				if (helper(node.children, targetId)) {
					return true; // Target found in descendants, propagate success
				}

				path.pop(); // Backtrack if target is not found in this branch
			}

			return false; // Target not found in this branch
		}

		helper(tree, id);
		return path;
	}

	/**
	 * Finds the full path to a node based on its URL.
	 * @param tree - The root of the folder tree.
	 * @param path - The URL path to locate.
	 * @returns The full path as an array of node names.
	 */
	public getFullPath(tree: FolderNode[], path: string[]): string[] {
		const result: string[] = [];

		function helper(nodes: FolderNode[], pathParts: string[]): boolean {
			if (pathParts.length === 0) return false;

			const [current, ...rest] = pathParts;

			for (const node of nodes) {
				if (node.name === current) {
					result.push(node.name);
					if (rest.length === 0 || helper(node.children, rest)) {
						return true;
					}
					result.pop(); // Backtrack if not found
				}
			}

			return false;
		}

		helper(tree, path);
		return result;
	}

	/**
	 * Finds all nodes along the path to a given URL.
	 * @param tree - The root of the folder tree.
	 * @param path - The URL path to locate.
	 * @returns The nodes along the path.
	 */
	public findNodesAlongPath(tree: FolderNode[], path: string[]): FolderNode[] {
		const result: FolderNode[] = [];

		function helper(nodes: FolderNode[], pathParts: string[]): boolean {
			if (pathParts.length === 0) return false;

			const [current, ...rest] = pathParts;

			for (const node of nodes) {
				if (node.name === current) {
					result.push(node);
					if (rest.length === 0 || helper(node.children, rest)) {
						return true;
					}
					result.pop(); // Backtrack if not found
				}
			}

			return false;
		}

		helper(tree, path);
		return result;
	}

	/**
	 * Finds a node by its ID in the tree.
	 * @param id - The ID of the node to find.
	 * @returns The node or null if not found.
	 */
	private findNodeById(tree: FolderNode[], id: string): FolderNode | null {
		for (const node of tree) {
			if (node.id === id) {
				return node;
			}
			const found = this.findNodeById(node.children, id);
			if (found) {
				return found;
			}
		}
		return null;
	}

	/**
	 * Adds a new page to the folder tree.
	 * @param tree - The root of the folder tree.
	 * @param folderId - The ID of the parent folder.
	 * @param newPage - The new page to add.
	 * @returns The updated folder tree
	 */
	public addPageToFolderTree(
		tree: FolderNode[],
		folderId: string,
		newPage: FolderNode
	): FolderNode[] {
		const parentFolder = this.findNodeById(tree, folderId);

		if (!parentFolder) {
			tree.push(newPage);
			return tree;
		}

		parentFolder.children.push(newPage);
		return tree;
	}

	/**
	 * Collects categories based on the provided category IDs.
	 *
	 * @param categoryIds - An array of category IDs to collect.
	 * @returns A promise that resolves to an array of collected categories.
	 * @throws {StudioCMS_SDK_Error} If there is an error while collecting categories.
	 */
	public async collectCategories(categoryIds: number[]): Promise<CombinedPageData['categories']> {
		try {
			const categories: CombinedPageData['categories'] = [];

			const [categoryHead, ...categoryTail] = categoryIds.map((id) =>
				this.db.select().from(tsPageDataCategories).where(this.eq(tsPageDataCategories.id, id))
			);

			if (categoryHead) {
				const categoryResults = await this.db.batch([categoryHead, ...categoryTail]);
				categories.push(...categoryResults.flat().filter((result) => result !== undefined));
			}

			return categories;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting categories: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting categories: An unknown error occurred.');
		}
	}

	/**
	 * Collects tags based on the provided tag IDs.
	 *
	 * @param tagIds - An array of tag IDs to collect.
	 * @returns A promise that resolves to an array of tags.
	 * @throws {StudioCMS_SDK_Error} If an error occurs while fetching the tags.
	 */
	public async collectTags(tagIds: number[]): Promise<CombinedPageData['tags']> {
		try {
			const tags: CombinedPageData['tags'] = [];

			const [tagHead, ...tagTail] = tagIds.map((id) =>
				this.db.select().from(tsPageDataCategories).where(this.eq(tsPageDataCategories.id, id))
			);

			if (tagHead) {
				const tagResults = await this.db.batch([tagHead, ...tagTail]);
				tags.push(...tagResults.flat().filter((result) => result !== undefined));
			}

			return tags;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting tags: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting tags: An unknown error occurred.');
		}
	}

	/**
	 * Collects and combines various data related to a page.
	 *
	 * @param page - The page data to collect additional information for.
	 * @returns A promise that resolves to the combined page data.
	 * @throws {StudioCMS_SDK_Error} If an error occurs while collecting page data.
	 */
	public async collectPageData(
		page: tsPageDataSelect,
		tree: FolderNode[]
	): Promise<CombinedPageData> {
		try {
			const categoryIds = this.parseIdNumberArray(page.categories || []);
			const categories = await this.collectCategories(categoryIds);

			const tagIds = this.parseIdNumberArray(page.tags || []);
			const tags = await this.collectTags(tagIds);

			const contributorIds = this.parseIdStringArray(page.contributorIds || []);

			const multiLanguageContentData = await this.db
				.select()
				.from(tsPageContent)
				.where(this.eq(tsPageContent.contentId, page.id));

			const defaultLanguageContentData = multiLanguageContentData.find(
				(content) => content.contentLang === page.contentLang
			);

			const safeSlug = page.slug === 'index' ? '/' : `/${page.slug}`;

			let urlRoute = safeSlug;

			if (page.parentFolder) {
				const urlParts = this.findNodesAlongPathToId(tree, page.parentFolder);
				urlRoute = urlParts.map((part) => part.name).join('/') + safeSlug;
			}

			return {
				...page,
				urlRoute,
				categories,
				tags,
				contributorIds,
				multiLangContent: multiLanguageContentData,
				defaultContent: defaultLanguageContentData,
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error collecting page data: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error collecting page data: An unknown error occurred.');
		}
	}

	/**
	 * Collects user data by fetching OAuth data and permission data from the database.
	 *
	 * @param user - The user object containing user information.
	 * @returns A promise that resolves to a CombinedUserData object containing the user data, OAuth data, and permissions data.
	 * @throws {StudioCMS_SDK_Error} If an error occurs while collecting user data.
	 */
	public async collectUserData(user: tsUsersSelect): Promise<CombinedUserData> {
		try {
			const [oAuthData, permissionData] = await this.db.batch([
				this.db.select().from(tsOAuthAccounts).where(this.eq(tsOAuthAccounts.userId, user.id)),
				this.db.select().from(tsPermissions).where(this.eq(tsPermissions.user, user.id)),
			]);

			return {
				...user,
				oAuthData,
				permissionsData: permissionData[0],
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error collecting user data: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error collecting user data: An unknown error occurred.');
		}
	}

	/**
	 * Verifies the rank of users based on the provided permissions and rank.
	 *
	 * @param users - An array of user objects to be verified.
	 * @param permissions - An array of permission objects that include user ranks.
	 * @param rank - The rank to be verified against the permissions.
	 * @returns An array of objects containing the id and name of users with the specified rank.
	 * @throws {StudioCMS_SDK_Error} If an error occurs during the verification process.
	 */
	public verifyRank(
		users: tsUsersSelect[],
		permissions: tsPermissionsSelect[],
		rank: string
	): SingleRank[] {
		try {
			const filteredUsers = permissions.filter((user) => user.rank === rank);
			const permitted: { id: string; name: string }[] = [];

			for (const user of filteredUsers) {
				const foundUser = users.find((u) => u.id === user.user);

				if (foundUser) {
					permitted.push({ id: foundUser.id, name: foundUser.name });
				}
			}

			return permitted;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error verifying rank: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error verifying rank: An unknown error occurred.');
		}
	}

	/**
	 * Combines a given rank with an array of user ranks.
	 *
	 * @param rank - The rank to be combined with each user.
	 * @param users - An array of user ranks to be combined with the given rank.
	 * @returns An array of combined ranks, where each element includes the given rank and the properties of a user rank.
	 */
	public combineRanks(rank: string, users: SingleRank[]): CombinedRank[] {
		return users.map((user) => ({ rank, ...user }));
	}

	/**
	 * Generates a random ID number with the specified length.
	 *
	 * @param length - The length of the random ID number to generate.
	 * @returns A random ID number with the specified length.
	 */
	public generateRandomIDNumber(length: number): number {
		return Math.floor(Math.random() * 10 ** length);
	}

	/**
	 * Initializes the StudioCMS SDK with various utility functions.
	 */
	public INIT = {
		/**
		 * Initializes the StudioCMS SiteConfig table with the provided configuration.
		 *
		 * @param config - The configuration to insert into the SiteConfig table.
		 * @returns A promise that resolves to the inserted site configuration.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the site configuration.
		 */
		siteConfig: async (config: tsSiteConfigInsert): Promise<tsSiteConfigSelect> => {
			try {
				return await this.db
					.insert(tsSiteConfig)
					.values({ ...config, id: CMSSiteConfigId })
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error creating site configuration: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					'Error creating site configuration: An unknown error occurred.'
				);
			}
		},

		/**
		 * Initializes the StudioCMS Ghost User.
		 *
		 * The ghost user is a default user that is used to perform actions on behalf of the system as well as to replace deleted users.
		 *
		 * @returns A promise that resolves to the ghost user record.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
		 */
		ghostUser: async (): Promise<tsUsersSelect> => {
			try {
				// Check if the ghost user already exists in the database.
				const ghostUser = await this.AUTH.user.ghost.verifyExists();

				// If the ghost user does not exist, create it and return the inserted record
				if (!ghostUser) {
					return await this.AUTH.user.ghost.create();
				}

				const ghostUserRecord = await this.AUTH.user.ghost.get();

				if (!ghostUserRecord) {
					throw new StudioCMS_SDK_Error(
						'Error getting ghost user from database: The ghost user may not exist yet.'
					);
				}

				return ghostUserRecord;
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error creating ghost user: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error creating ghost user: An unknown error occurred.');
			}
		},
	};

	/**
	 * The AUTH object provides various authentication and authorization utilities for the StudioCMS SDK.
	 */
	public AUTH = {
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
			create: async (data: tsOAuthAccountsSelect): Promise<tsOAuthAccountsSelect> => {
				try {
					return await this.db.insert(tsOAuthAccounts).values(data).returning().get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error creating OAuth account: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error('Error creating OAuth account: An unknown error occurred.');
				}
			},

			/**
			 * Deletes an OAuth account from the database.
			 *
			 * @param userId - The ID of the user associated with the OAuth account.
			 * @param provider - The provider of the OAuth account.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the OAuth account.
			 */
			delete: async (userId: string, provider: string): Promise<DeletionResponse> => {
				try {
					return await this.db
						.delete(tsOAuthAccounts)
						.where(
							this.and(
								this.eq(tsOAuthAccounts.userId, userId),
								this.eq(tsOAuthAccounts.provider, provider)
							)
						)
						.then(() => {
							return {
								status: 'success',
								message: 'OAuth account deleted',
							};
						});
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error deleting OAuth account: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error('Error deleting OAuth account: An unknown error occurred.');
				}
			},

			/**
			 * Searches for OAuth accounts based on the provider ID and user ID.
			 *
			 * @param providerId - The provider ID to search for.
			 * @param userId - The user ID to search for.
			 * @returns A promise that resolves to the OAuth account data if found, otherwise undefined.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while searching for the OAuth account.
			 */
			searchProvidersForId: async (
				providerId: string,
				userId: string
			): Promise<tsOAuthAccountsSelect | undefined> => {
				try {
					return await this.db
						.select()
						.from(tsOAuthAccounts)
						.where(
							this.and(
								this.eq(tsOAuthAccounts.providerUserId, providerId),
								this.eq(tsOAuthAccounts.userId, userId)
							)
						)
						.get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error searching for OAuth account: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error(
						'Error searching for OAuth account: An unknown error occurred.'
					);
				}
			},
		},

		/**
		 * Provides various methods to get and update permissions for users in the StudioCMS database.
		 */
		permission: {
			/**
			 * Checks the current status of a user's permissions.
			 */
			currentStatus: async (userId: string): Promise<tsPermissionsSelect | undefined> => {
				try {
					return await this.db
						.select()
						.from(tsPermissions)
						.where(this.eq(tsPermissions.user, userId))
						.get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error getting user permissions: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error(
						'Error getting user permissions: An unknown error occurred.'
					);
				}
			},
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
			create: async (data: tsSessionTableInsert): Promise<tsSessionTableSelect> => {
				try {
					return await this.db
						.insert(tsSessionTable)
						.values(data)
						.returning({
							id: tsSessionTable.id,
							userId: tsSessionTable.userId,
							expiresAt: tsSessionTable.expiresAt,
						})
						.get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error creating session: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error creating session: An unknown error occurred.');
				}
			},

			/**
			 * Gets a session with the associated user.
			 *
			 * @param sessionId - The ID of the session to search for.
			 * @returns A promise that resolves to the session with the associated user.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the session with the user.
			 */
			sessionWithUser: async (
				sessionId: string
			): Promise<
				{
					user: tsUsersSelect;
					session: tsSessionTableSelect;
				}[]
			> => {
				try {
					return await this.db
						.select({ user: tsUsers, session: tsSessionTable })
						.from(tsSessionTable)
						.innerJoin(tsUsers, this.eq(tsSessionTable.userId, tsUsers.id))
						.where(this.eq(tsSessionTable.id, sessionId));
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error getting session with user: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error(
						'Error getting session with user: An unknown error occurred.'
					);
				}
			},

			/**
			 * Deletes a session from the database.
			 *
			 * @param sessionId - The ID of the session to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the session.
			 */
			delete: async (sessionId: string): Promise<DeletionResponse> => {
				try {
					await this.db.delete(tsSessionTable).where(this.eq(tsSessionTable.id, sessionId));
					return {
						status: 'success',
						message: 'Session deleted',
					};
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error deleting session: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error deleting session: An unknown error occurred.');
				}
			},

			/**
			 * Updates the expiration date of a session.
			 *
			 * @param sessionId - The ID of the session to update.
			 * @param newDate - The new expiration date for the session.
			 * @returns A promise that resolves to the updated session.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the session.
			 */
			update: async (sessionId: string, newDate: Date): Promise<tsSessionTableSelect[]> => {
				try {
					return await this.db
						.update(tsSessionTable)
						.set({ expiresAt: newDate })
						.where(this.eq(tsSessionTable.id, sessionId))
						.returning();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error updating session: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error updating session: An unknown error occurred.');
				}
			},
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
			create: async (newUserData: tsUsersInsert): Promise<tsUsersSelect> => {
				try {
					const newUser = await this.db.insert(tsUsers).values(newUserData).returning().get();
					await this.db.insert(tsPermissions).values({ user: newUser.id, rank: 'visitor' });
					return newUser;
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error creating user: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error creating user: An unknown error occurred.');
				}
			},

			/**
			 * Updates a user in the database.
			 *
			 * @param userId - The ID of the user to update.
			 * @param userData - The data to update the user with.
			 * @returns A promise that resolves to the updated user.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the user.
			 */
			update: async (userId: string, userData: tsUsersUpdate): Promise<tsUsersSelect> => {
				try {
					return await this.db
						.update(tsUsers)
						.set(userData)
						.where(this.eq(tsUsers.id, userId))
						.returning()
						.get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error updating user: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error updating user: An unknown error occurred.');
				}
			},

			/**
			 * Searches for users based on the provided username or email.
			 *
			 * @param username - The username to search for.
			 * @param email - The email to search for.
			 * @returns A promise that resolves to an object containing the search results for the username and email.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while searching for the username or email.
			 */
			searchUsersForUsernameOrEmail: async (
				username: string,
				email: string
			): Promise<{
				usernameSearch: tsUsersSelect[];
				emailSearch: tsUsersSelect[];
			}> => {
				try {
					const [usernameSearch, emailSearch] = await this.db.batch([
						this.db.select().from(tsUsers).where(this.eq(tsUsers.username, username)),
						this.db.select().from(tsUsers).where(this.eq(tsUsers.email, email)),
					]);

					return { usernameSearch, emailSearch };
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error searching for username or email: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error(
						'Error searching for username or email: An unknown error occurred.'
					);
				}
			},

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
				verifyExists: async () => {
					try {
						const ghostUser = await this.db
							.select()
							.from(tsUsers)
							.where(this.eq(tsUsers.id, GhostUserDefaults.id))
							.get();
						if (!ghostUser) {
							return false;
						}
						return true;
					} catch (error) {
						if (error instanceof Error) {
							throw new StudioCMS_SDK_Error(
								`Error verifying ghost user exists: ${error.message}`,
								error.stack
							);
						}
						throw new StudioCMS_SDK_Error(
							'Error verifying ghost user exists: An unknown error occurred.'
						);
					}
				},

				/**
				 * Creates the ghost user in the database.
				 *
				 * @returns A promise that resolves to the inserted ghost user.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
				 */
				create: async () => {
					try {
						return await this.db.insert(tsUsers).values(GhostUserDefaults).returning().get();
					} catch (error) {
						if (error instanceof Error) {
							throw new StudioCMS_SDK_Error(
								`Error creating ghost user: ${error.message}`,
								error.stack
							);
						}
						throw new StudioCMS_SDK_Error('Error creating ghost user: An unknown error occurred.');
					}
				},

				/**
				 * Gets the ghost user from the database.
				 *
				 * @returns A promise that resolves to the ghost user.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the ghost user.
				 */
				get: async () => {
					try {
						return await this.db
							.select()
							.from(tsUsers)
							.where(this.eq(tsUsers.id, GhostUserDefaults.id))
							.get();
					} catch (error) {
						if (error instanceof Error) {
							throw new StudioCMS_SDK_Error(
								`Error getting ghost user: ${error.message}`,
								error.stack
							);
						}
						throw new StudioCMS_SDK_Error('Error getting ghost user: An unknown error occurred.');
					}
				},
			},
		},
	};

	/**
	 * Provides various methods to get data from the StudioCMS database.
	 */
	public GET = {
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
			users: async (): Promise<CombinedUserData[]> => {
				try {
					const combinedUserData: CombinedUserData[] = [];

					const users = await this.db.select().from(tsUsers);

					for (const user of users) {
						const UserData = await this.collectUserData(user);

						combinedUserData.push(UserData);
					}

					return combinedUserData;
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.');
				}
			},

			/**
			 * Retrieves all pages from the database.
			 *
			 * @returns A promise that resolves to an array of combined page data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the pages.
			 */
			pages: async (tree?: FolderNode[]): Promise<CombinedPageData[]> => {
				try {
					const pages: CombinedPageData[] = [];

					const pagesRaw = await this.db.select().from(tsPageData);
					const folders = tree || (await this.buildFolderTree());

					for (const page of pagesRaw) {
						const PageData = await this.collectPageData(page, folders);

						pages.push(PageData);
					}

					return pages;
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting pages: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting pages: An unknown error occurred.');
				}
			},

			/**
			 * Retrieves the site configuration from the database.
			 *
			 * @returns A promise that resolves to the site configuration.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the site configuration.
			 */
			config: async (): Promise<tsSiteConfigSelect | undefined> => {
				try {
					return await this.db
						.select()
						.from(tsSiteConfig)
						.where(this.eq(tsSiteConfig.id, CMSSiteConfigId))
						.get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error getting site configuration: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error(
						'Error getting site configuration: An unknown error occurred.'
					);
				}
			},
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
				byId: async (id: string): Promise<CombinedUserData | undefined> => {
					try {
						const user = await this.db.select().from(tsUsers).where(this.eq(tsUsers.id, id)).get();

						if (!user) return undefined;

						return await this.collectUserData(user);
					} catch (error) {
						if (error instanceof Error) {
							throw new StudioCMS_SDK_Error(
								`Error getting user by ID: ${error.message}`,
								error.stack
							);
						}
						throw new StudioCMS_SDK_Error('Error getting user by ID: An unknown error occurred.');
					}
				},

				/**
				 * Retrieves a user by username.
				 *
				 * @param username - The username of the user to retrieve.
				 * @returns A promise that resolves to the user data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the user.
				 */
				byUsername: async (username: string): Promise<CombinedUserData | undefined> => {
					try {
						const user = await this.db
							.select()
							.from(tsUsers)
							.where(this.eq(tsUsers.username, username))
							.get();

						if (!user) return undefined;

						return await this.collectUserData(user);
					} catch (error) {
						if (error instanceof Error) {
							throw new StudioCMS_SDK_Error(
								`Error getting user by username: ${error.message}`,
								error.stack
							);
						}
						throw new StudioCMS_SDK_Error(
							'Error getting user by username: An unknown error occurred.'
						);
					}
				},

				/**
				 * Retrieves a user by email.
				 *
				 * @param email - The email of the user to retrieve.
				 * @returns A promise that resolves to the user data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the user.
				 */
				byEmail: async (email: string): Promise<CombinedUserData | undefined> => {
					try {
						const user = await this.db
							.select()
							.from(tsUsers)
							.where(this.eq(tsUsers.email, email))
							.get();

						if (!user) return undefined;

						return await this.collectUserData(user);
					} catch (error) {
						if (error instanceof Error) {
							throw new StudioCMS_SDK_Error(
								`Error getting user by email: ${error.message}`,
								error.stack
							);
						}
						throw new StudioCMS_SDK_Error(
							'Error getting user by email: An unknown error occurred.'
						);
					}
				},
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
				byId: async (id: string, tree?: FolderNode[]): Promise<CombinedPageData | undefined> => {
					try {
						const page = await this.db
							.select()
							.from(tsPageData)
							.where(this.eq(tsPageData.id, id))
							.get();

						if (!page) return undefined;
						const folders = tree || (await this.buildFolderTree());

						return await this.collectPageData(page, folders);
					} catch (error) {
						if (error instanceof Error) {
							throw new StudioCMS_SDK_Error(
								`Error getting page by ID: ${error.message}`,
								error.stack
							);
						}
						throw new StudioCMS_SDK_Error('Error getting page by ID: An unknown error occurred.');
					}
				},

				/**
				 * Retrieves a page by slug.
				 *
				 * @param slug - The slug of the page to retrieve.
				 * @param pkg - The package of the page to retrieve.
				 * @returns A promise that resolves to the page data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page.
				 */
				bySlug: async (
					slug: string,
					pkg?: string,
					tree?: FolderNode[]
				): Promise<CombinedPageData | undefined> => {
					try {
						const pkgToGet = pkg || 'studiocms';

						const page = await this.db
							.select()
							.from(tsPageData)
							.where(
								this.and(this.eq(tsPageData.slug, slug), this.eq(tsPageData.package, pkgToGet))
							)
							.get();

						if (!page) return undefined;
						const folders = tree || (await this.buildFolderTree());

						return await this.collectPageData(page, folders);
					} catch (error) {
						if (error instanceof Error) {
							throw new StudioCMS_SDK_Error(
								`Error getting page by slug: ${error.message}`,
								error.stack
							);
						}
						throw new StudioCMS_SDK_Error('Error getting page by slug: An unknown error occurred.');
					}
				},
			},
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
			users: async () => await this.db.select().from(tsUsers),

			/**
			 * Retrieves all data from the OAuth accounts table.
			 *
			 * @returns A promise that resolves to an array of OAuth account data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the OAuth accounts.
			 */
			oAuthAccounts: async () => await this.db.select().from(tsOAuthAccounts),

			/**
			 * Retrieves all data from the session table.
			 *
			 * @returns A promise that resolves to an array of session data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the sessions.
			 */
			sessionTable: async () => await this.db.select().from(tsSessionTable),

			/**
			 * Retrieves all data from the permissions table.
			 *
			 * @returns A promise that resolves to an array of permission data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the permissions.
			 */
			permissions: async () => await this.db.select().from(tsPermissions),

			/**
			 * Retrieves all data from the page data table.
			 *
			 * @returns A promise that resolves to an array of page data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the pages.
			 */
			pageData: async () => await this.db.select().from(tsPageData),

			/**
			 * Retrieves all data from the page data tags table.
			 *
			 * @returns A promise that resolves to an array of page data tags.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page data tags.
			 */
			pageDataTags: async () => await this.db.select().from(tsPageDataTags),

			/**
			 * Retrieves all data from the page data categories table.
			 *
			 * @returns A promise that resolves to an array of page data categories.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page data categories.
			 */
			pageDataCategories: async () => await this.db.select().from(tsPageDataCategories),

			/**
			 * Retrieves all data from the page content table.
			 *
			 * @returns A promise that resolves to an array of page content.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page content.
			 */
			pageContent: async () => await this.db.select().from(tsPageContent),

			/**
			 * Retrieves all data from the site config table.
			 *
			 * @returns A promise that resolves to an array of site configuration data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the site configuration.
			 */
			siteConfig: async () =>
				await this.db
					.select()
					.from(tsSiteConfig)
					.where(this.eq(tsSiteConfig.id, CMSSiteConfigId))
					.get(),

			/**
			 * Retrieves all data from the diff tracking table.
			 *
			 * @returns A promise that resolves to an array of diff tracking data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the diff tracking data.
			 */
			diffTracking: async () => await this.db.select().from(tsDiffTracking),
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
			all: async (): Promise<CombinedRank[]> => {
				try {
					const [currentPermittedUsers, existingUsers] = await this.db.batch([
						this.db.select().from(tsPermissions),
						this.db.select().from(tsUsers),
					]);

					const owners = this.verifyRank(existingUsers, currentPermittedUsers, 'owner');

					const admins = this.verifyRank(existingUsers, currentPermittedUsers, 'admin');

					const editors = this.verifyRank(existingUsers, currentPermittedUsers, 'editor');

					const visitors = this.verifyRank(existingUsers, currentPermittedUsers, 'visitor');

					return [
						...this.combineRanks('owner', owners),
						...this.combineRanks('admin', admins),
						...this.combineRanks('editor', editors),
						...this.combineRanks('visitor', visitors),
					];
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.');
				}
			},

			/**
			 * Retrieves all owners in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the owners.
			 */
			owners: async (): Promise<SingleRank[]> => {
				try {
					const [currentPermittedUsers, existingUsers] = await this.db.batch([
						this.db.select().from(tsPermissions),
						this.db.select().from(tsUsers),
					]);

					return this.verifyRank(existingUsers, currentPermittedUsers, 'owner');
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.');
				}
			},

			/**
			 * Retrieves all admins in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the admins.
			 */
			admins: async (): Promise<SingleRank[]> => {
				try {
					const [currentPermittedUsers, existingUsers] = await this.db.batch([
						this.db.select().from(tsPermissions),
						this.db.select().from(tsUsers),
					]);

					return this.verifyRank(existingUsers, currentPermittedUsers, 'admin');
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.');
				}
			},

			/**
			 * Retrieves all editors in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the editors.
			 */
			editors: async (): Promise<SingleRank[]> => {
				try {
					const [currentPermittedUsers, existingUsers] = await this.db.batch([
						this.db.select().from(tsPermissions),
						this.db.select().from(tsUsers),
					]);

					return this.verifyRank(existingUsers, currentPermittedUsers, 'editor');
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.');
				}
			},

			/**
			 * Retrieves all visitors in the database.
			 *
			 * @returns A promise that resolves to an array of combined rank data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the visitors.
			 */
			visitors: async (): Promise<SingleRank[]> => {
				try {
					const [currentPermittedUsers, existingUsers] = await this.db.batch([
						this.db.select().from(tsPermissions),
						this.db.select().from(tsUsers),
					]);

					return this.verifyRank(existingUsers, currentPermittedUsers, 'visitor');
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.');
				}
			},
		},

		/**
		 * Retrieves data from the database by package.
		 */
		packagePages: async (packageName: string, tree?: FolderNode[]): Promise<CombinedPageData[]> => {
			try {
				const pages: CombinedPageData[] = [];

				const pagesRaw = await this.db
					.select()
					.from(tsPageData)
					.where(this.eq(tsPageData.package, packageName));
				const folders = tree || (await this.buildFolderTree());

				for (const page of pagesRaw) {
					const PageData = await this.collectPageData(page, folders);

					pages.push(PageData);
				}

				return pages;
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error getting pages: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error getting pages: An unknown error occurred.');
			}
		},
	};

	/**
	 * Provides various methods to post data to the StudioCMS database.
	 */
	public POST = {
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
			pages: async (
				pageData: tsPageDataInsert,
				pageContent: CombinedInsertContent
			): Promise<addDatabaseEntryInsertPage> => {
				try {
					const newContentID = pageData.id || crypto.randomUUID().toString();

					const {
						title,
						slug,
						description,
						authorId = null,
						package: packageName = 'studiocms',
						contentLang = 'default',
						heroImage = '',
						showOnNav = false,
						showAuthor = false,
						showContributors = false,
					} = pageData;

					const stringified = {
						categories: JSON.stringify(pageData.categories || []),
						tags: JSON.stringify(pageData.tags || []),
						contributorIds: JSON.stringify(pageData.contributorIds || []),
					};

					const contentData = {
						id: crypto.randomUUID().toString(),
						contentId: newContentID,
						contentLang: pageContent.contentLang || 'default',
						content: pageContent.content || '',
					};

					const NOW = new Date();

					const [newPageData, newPageContent] = await this.db.batch([
						this.db
							.insert(tsPageData)
							.values({
								id: newContentID,
								title,
								slug,
								description,
								authorId,
								contentLang,
								heroImage,
								showAuthor,
								showContributors,
								showOnNav,
								package: packageName,
								publishedAt: NOW,
								updatedAt: NOW,
								...stringified,
							})
							.returning({ id: tsPageData.id }),
						this.db.insert(tsPageContent).values(contentData).returning({ id: tsPageContent.id }),
					]);

					return {
						pageData: newPageData,
						pageContent: newPageContent,
					};
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error inserting page: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error inserting page: An unknown error occurred.');
				}
			},

			/**
			 * Inserts a new user into the database.
			 *
			 * @param userData - The data to insert into the users table.
			 * @returns A promise that resolves to the inserted user.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the user.
			 */
			pageContent: async (pageContent: tsPageContentInsert): Promise<PageContentReturnId[]> => {
				try {
					return await this.db
						.insert(tsPageContent)
						.values({
							id: pageContent.id || crypto.randomUUID().toString(),
							contentId: pageContent.contentId,
							contentLang: pageContent.contentLang || 'default',
							content: pageContent.content || '',
						})
						.returning({ id: tsPageContent.id });
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error inserting page content: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error('Error inserting page content: An unknown error occurred.');
				}
			},

			/**
			 * Inserts a new tag into the database.
			 *
			 * @param tag - The data to insert into the page data tags table.
			 * @returns A promise that resolves to the inserted tag.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the tag.
			 */
			tags: async (tag: tsPageDataTagsInsert): Promise<PageDataTagsInsertResponse[]> => {
				try {
					return await this.db
						.insert(tsPageDataTags)
						.values({
							name: tag.name,
							description: tag.description,
							slug: tag.slug,
							meta: JSON.stringify(tag.meta),
							id: tag.id || this.generateRandomIDNumber(9),
						})
						.returning({ id: tsPageDataTags.id });
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error inserting tag: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error inserting tag: An unknown error occurred.');
				}
			},

			/**
			 * Inserts a new category into the database.
			 *
			 * @param category - The data to insert into the page data categories table.
			 * @returns A promise that resolves to the inserted category.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the category.
			 */
			categories: async (category: tsPageDataCategoriesInsert) => {
				try {
					return await this.db
						.insert(tsPageDataCategories)
						.values({
							name: category.name,
							description: category.description,
							slug: category.slug,
							meta: JSON.stringify(category.meta),
							id: category.id || this.generateRandomIDNumber(9),
						})
						.returning({ id: tsPageDataCategories.id });
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error inserting category: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error('Error inserting category: An unknown error occurred.');
				}
			},

			/**
			 * Inserts a new permission into the database.
			 *
			 * @param userId - The ID of the user to assign the rank to.
			 * @param rank - The rank to assign to the user.
			 * @returns A promise that resolves to the inserted permission.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the permission.
			 */
			permissions: async (userId: string, rank: string): Promise<tsPermissionsSelect[]> => {
				try {
					const userAlreadyExists = await this.db
						.select()
						.from(tsPermissions)
						.where(this.eq(tsPermissions.user, userId))
						.get();

					if (userAlreadyExists) {
						throw new StudioCMS_SDK_Error(
							'User already is already assigned a rank, please update the existing rank instead.'
						);
					}

					return await this.db
						.insert(tsPermissions)
						.values({
							user: userId,
							rank,
						})
						.returning({ user: tsPermissions.user, rank: tsPermissions.rank });
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error inserting permissions: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error('Error inserting permissions: An unknown error occurred.');
				}
			},

			/**
			 * Inserts a new site configuration into the database.
			 *
			 * @param siteConfig - The data to insert into the site config table.
			 * @returns A promise that resolves to the inserted site configuration.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the site configuration.
			 */
			diffTracking: async (diff: tsDiffTrackingInsert): Promise<tsDiffTrackingSelect[]> => {
				try {
					return await this.db
						.insert(tsDiffTracking)
						.values({
							id: diff.id || crypto.randomUUID().toString(),
							userId: diff.userId,
							pageId: diff.pageId,
							diff: diff.diff || '',
							timestamp: diff.timestamp || new Date(),
							pageContentStart: diff.pageContentStart,
							pageMetaData: JSON.stringify(diff.pageMetaData || {}),
						})
						.returning();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error inserting diff tracking: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error(
						'Error inserting diff tracking: An unknown error occurred.'
					);
				}
			},
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
			tags: async (data: tsPageDataTagsInsert[]): Promise<PageDataTagsInsertResponse[]> => {
				try {
					return await this.db
						.insert(tsPageDataTags)
						.values(
							data.map((tag) => {
								return {
									id: tag.id || this.generateRandomIDNumber(9),
									name: tag.name,
									slug: tag.slug,
									description: tag.description,
									meta: JSON.stringify(tag.meta),
								};
							})
						)
						.returning({ id: tsPageDataTags.id });
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error inserting tags: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error inserting tags: An unknown error occurred.');
				}
			},

			/**
			 * Inserts multiple categories into the database.
			 *
			 * @param data - The data to insert into the page data categories table.
			 * @returns A promise that resolves to the inserted categories.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the categories.
			 */
			categories: async (
				data: tsPageDataCategoriesInsert[]
			): Promise<PageDataCategoriesInsertResponse[]> => {
				try {
					return await this.db
						.insert(tsPageDataCategories)
						.values(
							data.map((category) => {
								return {
									id: category.id || this.generateRandomIDNumber(9),
									name: category.name,
									slug: category.slug,
									description: category.description,
									meta: JSON.stringify(category.meta),
								};
							})
						)
						.returning({ id: tsPageDataCategories.id });
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error inserting categories: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error('Error inserting categories: An unknown error occurred.');
				}
			},

			/**
			 * Inserts multiple permissions into the database.
			 *
			 * @param data - The data to insert into the permissions table.
			 * @returns A promise that resolves to the inserted permissions.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the permissions.
			 */
			permissions: async (data: tsPermissionsInsert[]): Promise<tsPermissionsSelect[]> => {
				try {
					const currentPermittedUsers = await this.db.select().from(tsPermissions);

					for (const permission of data) {
						const userAlreadyExists = currentPermittedUsers.find(
							(user) => user.user === permission.user
						);

						if (userAlreadyExists) {
							throw new Error(
								`User with ID ${permission.user} already has a rank assigned. Please update the existing rank instead.`
							);
						}
					}

					return await this.db
						.insert(tsPermissions)
						.values(
							data.map((permission) => {
								return {
									user: permission.user,
									rank: permission.rank,
								};
							})
						)
						.returning({ user: tsPermissions.user, rank: tsPermissions.rank });
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(
							`Error inserting permissions: ${error.message}`,
							error.stack
						);
					}
					throw new StudioCMS_SDK_Error('Error inserting permissions: An unknown error occurred.');
				}
			},

			/**
			 * Inserts multiple pages into the database.
			 *
			 * @param pages - The data to insert into the page data and page content tables.
			 * @returns A promise that resolves to the inserted pages.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the pages.
			 */
			pages: async (pages: MultiPageInsert): Promise<void> => {
				try {
					const queries = [];

					for (const { pageData, pageContent } of pages) {
						const newContentID = pageData.id || crypto.randomUUID().toString();

						const {
							title,
							slug,
							description,
							authorId = null,
							package: packageName = 'studiocms',
							contentLang = 'default',
							heroImage = '',
							showOnNav = false,
							showAuthor = false,
							showContributors = false,
						} = pageData;

						const stringified = {
							categories: JSON.stringify(pageData.categories || []),
							tags: JSON.stringify(pageData.tags || []),
							contributorIds: JSON.stringify(pageData.contributorIds || []),
						};

						const contentData = {
							id: crypto.randomUUID().toString(),
							contentId: newContentID,
							contentLang: pageContent.contentLang || 'default',
							content: pageContent.content || '',
						};

						const NOW = new Date();

						queries.push(
							this.db
								.insert(tsPageData)
								.values({
									id: newContentID,
									title,
									slug,
									description,
									authorId,
									contentLang,
									heroImage,
									showAuthor,
									showContributors,
									showOnNav,
									package: packageName,
									publishedAt: NOW,
									updatedAt: NOW,
									...stringified,
								})
								.returning(),
							this.db.insert(tsPageContent).values(contentData).returning()
						);
					}

					const [head, ...tail] = queries;

					if (head) {
						await this.db.batch([head, ...tail]);
					}
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error inserting pages: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error inserting pages: An unknown error occurred.');
				}
			},
		},
	};

	/**
	 * Provides various methods to update data in the StudioCMS database.
	 */
	public UPDATE = {
		/**
		 * Updates a page in the database.
		 *
		 * @param data - The data to update in the page data table.
		 * @returns A promise that resolves to the updated page data.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the page.
		 */
		page: async (data: tsPageDataSelect): Promise<tsPageDataSelect> => {
			try {
				return await this.db
					.update(tsPageData)
					.set(data)
					.where(this.eq(tsPageData.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error updating page: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error updating page: An unknown error occurred.');
			}
		},

		/**
		 * Updates a page content in the database.
		 *
		 * @param data - The data to update in the page content table.
		 * @returns A promise that resolves to the updated page content.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the page content.
		 */
		pageContent: async (data: tsPageContentSelect): Promise<tsPageContentSelect> => {
			try {
				return await this.db
					.update(tsPageContent)
					.set(data)
					.where(this.eq(tsPageContent.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error updating page content: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error('Error updating page content: An unknown error occurred.');
			}
		},

		/**
		 * Updates a tag in the database.
		 *
		 * @param data - The data to update in the page data tags table.
		 * @returns A promise that resolves to the updated tag.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the tag.
		 */
		tags: async (data: tsPageDataTagsSelect): Promise<tsPageDataTagsSelect> => {
			try {
				return await this.db
					.update(tsPageDataTags)
					.set(data)
					.where(this.eq(tsPageDataTags.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error updating tags: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error updating tags: An unknown error occurred.');
			}
		},

		/**
		 * Updates a category in the database.
		 *
		 * @param data - The data to update in the page data categories table.
		 * @returns A promise that resolves to the updated category.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the category.
		 */
		categories: async (data: tsPageDataCategoriesSelect): Promise<tsPageDataCategoriesSelect> => {
			try {
				return await this.db
					.update(tsPageDataCategories)
					.set(data)
					.where(this.eq(tsPageDataCategories.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error updating categories: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error updating categories: An unknown error occurred.');
			}
		},

		/**
		 * Updates a permission in the database.
		 *
		 * @param data - The data to update in the permissions table.
		 * @returns A promise that resolves to the updated permission.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the permission.
		 */
		permissions: async (data: tsPermissionsSelect): Promise<tsPermissionsSelect> => {
			try {
				return await this.db
					.update(tsPermissions)
					.set(data)
					.where(this.eq(tsPermissions.user, data.user))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error updating permissions: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error('Error updating permissions: An unknown error occurred.');
			}
		},

		/**
		 * Updates a site configuration in the database.
		 *
		 * @param data - The data to update in the site config table.
		 * @returns A promise that resolves to the updated site configuration.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the site configuration.
		 */
		siteConfig: async (data: tsSiteConfigSelect): Promise<tsSiteConfigSelect> => {
			try {
				return await this.db
					.update(tsSiteConfig)
					.set(data)
					.where(this.eq(tsSiteConfig.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error updating site config: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error('Error updating site config: An unknown error occurred.');
			}
		},
	};

	/**
	 * Provides various methods to delete data from the StudioCMS database.
	 */
	public DELETE = {
		/**
		 * Deletes a page from the database.
		 *
		 * @param id - The ID of the page to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page.
		 */
		page: async (id: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.batch([
						this.db.delete(tsDiffTracking).where(this.eq(tsDiffTracking.pageId, id)),
						this.db.delete(tsPageContent).where(this.eq(tsPageContent.contentId, id)),
						this.db.delete(tsPageData).where(this.eq(tsPageData.id, id)),
					])
					.then(() => {
						return {
							status: 'success',
							message: `Page with ID ${id} has been deleted successfully`,
						};
					});
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting page with ID ${id}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting page with ID ${id}: An unknown error occurred.`
				);
			}
		},

		/**
		 * Deletes a page content from the database.
		 *
		 * @param id - The ID of the page content to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page content.
		 */
		pageContent: async (id: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPageContent)
					.where(this.eq(tsPageContent.contentId, id))
					.then(() => {
						return {
							status: 'success',
							message: `Page content with ID ${id} has been deleted successfully`,
						};
					});
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting page content with ID ${id}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting page content with ID ${id}: An unknown error occurred.`
				);
			}
		},

		/**
		 * Deletes a page content lang from the database.
		 *
		 * @param id - The ID of the page content to delete.
		 * @param lang - The lang of the page content to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page content lang.
		 */
		pageContentLang: async (id: string, lang: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPageContent)
					.where(
						this.and(this.eq(tsPageContent.contentId, id), this.eq(tsPageContent.contentLang, lang))
					)
					.then(() => {
						return {
							status: 'success',
							message: `Page content with ID ${id} and lang ${lang} has been deleted successfully`,
						};
					});
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting page content with ID ${id} and lang ${lang}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting page content with ID ${id} and lang ${lang}: An unknown error occurred.`
				);
			}
		},

		/**
		 * Deletes a tag from the database.
		 *
		 * @param id - The ID of the tag to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the tag.
		 */
		tags: async (id: number): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPageDataTags)
					.where(this.eq(tsPageDataTags.id, id))
					.then(() => {
						return {
							status: 'success',
							message: `Tag with ID ${id} has been deleted successfully`,
						};
					});
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting tag with ID ${id}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting tag with ID ${id}: An unknown error occurred.`
				);
			}
		},

		/**
		 * Deletes a category from the database.
		 *
		 * @param id - The ID of the category to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the category.
		 */
		categories: async (id: number): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPageDataCategories)
					.where(this.eq(tsPageDataCategories.id, id))
					.then(() => {
						return {
							status: 'success',
							message: `Category with ID ${id} has been deleted successfully`,
						};
					});
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting category with ID ${id}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting category with ID ${id}: An unknown error occurred.`
				);
			}
		},

		/**
		 * Deletes a permission from the database.
		 *
		 * @param userId - The ID of the user to delete the permission for.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the permission.
		 */
		permissions: async (userId: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPermissions)
					.where(this.eq(tsPermissions.user, userId))
					.then(() => {
						return {
							status: 'success',
							message: `Permissions for user with ID ${userId} have been deleted successfully`,
						};
					});
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting permissions for user with ID ${userId}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting permissions for user with ID ${userId}: An unknown error occurred.`
				);
			}
		},

		/**
		 * Deletes a site configuration from the database.
		 *
		 * @param id - The ID of the site configuration to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the site configuration.
		 */
		diffTracking: async (id: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsDiffTracking)
					.where(this.eq(tsDiffTracking.id, id))
					.then(() => {
						return {
							status: 'success',
							message: `Diff tracking with ID ${id} has been deleted successfully`,
						};
					});
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting diff tracking with ID ${id}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting diff tracking with ID ${id}: An unknown error occurred.`
				);
			}
		},
	};
}

export default StudioCMSSDK;
