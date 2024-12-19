/// <reference types="@astrojs/db" />
import { and, eq } from 'astro:db';
import type { Database } from '@astrojs/db/runtime';
import { CMSSiteConfigId, GhostUserDefaults } from '../consts';
import StudioCMS_SDK_Error from './errors';
import {
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
} from './tables';
import type {
	CombinedInsertContent,
	CombinedPageData,
	CombinedRank,
	CombinedUserData,
	DeletionResponse,
	MultiPageInsert,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataTagsInsertResponse,
	STUDIOCMS_SDK_AUTH,
	STUDIOCMS_SDK_DELETE,
	STUDIOCMS_SDK_GET,
	STUDIOCMS_SDK_INIT,
	STUDIOCMS_SDK_POST,
	STUDIOCMS_SDK_UPDATE,
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
	tsPermissionsInsert,
	tsPermissionsSelect,
	tsSessionTableInsert,
	tsSessionTableSelect,
	tsSiteConfigInsert,
	tsSiteConfigSelect,
	tsUsersInsert,
	tsUsersSelect,
	tsUsersUpdate,
} from './types';

/**
 * Utility functions for managing the ghost user in the StudioCMS SDK.
 *
 * @property {Function} verifyExists - Verifies if the ghost user exists in the database.
 * @property {Function} create - Creates a new ghost user in the database.
 * @property {Function} get - Retrieves the ghost user from the database.
 */
interface GhostUserUtils {
	verifyExists: () => Promise<boolean>;
	create: () => Promise<tsUsersSelect>;
	get: () => Promise<tsUsersSelect | undefined>;
}

export class StudioCMSSDK {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	/**
	 * Utility functions for managing the ghost user in the StudioCMS SDK.
	 *
	 * @property {Function} verifyExists - Verifies if the ghost user exists in the database.
	 * @property {Function} create - Creates a new ghost user in the database.
	 * @property {Function} get - Retrieves the ghost user from the database.
	 */
	private ghostUserUtils: GhostUserUtils = {
		verifyExists: async () => {
			try {
				const ghostUser = await this.db
					.select()
					.from(tsUsers)
					.where(eq(tsUsers.id, GhostUserDefaults.id))
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
		create: async () => {
			try {
				return await this.db.insert(tsUsers).values(GhostUserDefaults).returning().get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error creating ghost user: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error creating ghost user: An unknown error occurred.');
			}
		},
		get: async () => {
			try {
				return await this.db
					.select()
					.from(tsUsers)
					.where(eq(tsUsers.id, GhostUserDefaults.id))
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error getting ghost user: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error getting ghost user: An unknown error occurred.');
			}
		},
	};

	/**
	 * Parses an unknown input and casts it to an array of numbers.
	 *
	 * @param ids - The input to be parsed, expected to be an array of numbers.
	 * @returns An array of numbers.
	 */
	private parseIdNumberArray(ids: unknown): number[] {
		return ids as number[];
	}

	/**
	 * Parses the given input as an array of strings.
	 *
	 * @param ids - The input to be parsed, expected to be an array of unknown type.
	 * @returns An array of strings parsed from the input.
	 */
	private parseIdStringArray(ids: unknown): string[] {
		return ids as string[];
	}

	/**
	 * Collects categories based on the provided category IDs.
	 *
	 * @param categoryIds - An array of category IDs to collect.
	 * @returns A promise that resolves to an array of collected categories.
	 * @throws {StudioCMS_SDK_Error} If there is an error while collecting categories.
	 */
	private async collectCategories(categoryIds: number[]): Promise<CombinedPageData['categories']> {
		try {
			const categories: CombinedPageData['categories'] = [];

			const [categoryHead, ...categoryTail] = categoryIds.map((id) =>
				this.db.select().from(tsPageDataCategories).where(eq(tsPageDataCategories.id, id))
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
	private async collectTags(tagIds: number[]): Promise<CombinedPageData['tags']> {
		try {
			const tags: CombinedPageData['tags'] = [];

			const [tagHead, ...tagTail] = tagIds.map((id) =>
				this.db.select().from(tsPageDataCategories).where(eq(tsPageDataCategories.id, id))
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
	private async collectPageData(page: tsPageDataSelect): Promise<CombinedPageData> {
		try {
			const categoryIds = this.parseIdNumberArray(page.categories || []);
			const categories = await this.collectCategories(categoryIds);

			const tagIds = this.parseIdNumberArray(page.tags || []);
			const tags = await this.collectTags(tagIds);

			const contributorIds = this.parseIdStringArray(page.contributorIds || []);

			const multiLanguageContentData = await this.db
				.select()
				.from(tsPageContent)
				.where(eq(tsPageContent.contentId, page.id));

			const defaultLanguageContentData = multiLanguageContentData.find(
				(content) => content.contentLang === page.contentLang
			);

			return {
				...page,
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
	private async collectUserData(user: tsUsersSelect): Promise<CombinedUserData> {
		try {
			const [oAuthData, permissionData] = await this.db.batch([
				this.db.select().from(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, user.id)),
				this.db.select().from(tsPermissions).where(eq(tsPermissions.user, user.id)),
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
	private verifyRank(
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
	private combineRanks(rank: string, users: SingleRank[]): CombinedRank[] {
		return users.map((user) => ({ rank, ...user }));
	}

	/**
	 * Generates a random ID number with the specified length.
	 *
	 * @param length - The length of the random ID number to generate.
	 * @returns A random ID number with the specified length.
	 */
	private generateRandomIDNumber(length: number): number {
		return Math.floor(Math.random() * 10 ** length);
	}

	/**
	 * Initializes the StudioCMS SDK with various utility functions.
	 */
	public INIT: STUDIOCMS_SDK_INIT = {
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
		ghostUser: async (): Promise<tsUsersSelect> => {
			try {
				// Check if the ghost user already exists in the database.
				const ghostUser = await this.ghostUserUtils.verifyExists();

				// If the ghost user does not exist, create it and return the inserted record
				if (!ghostUser) {
					return await this.ghostUserUtils.create();
				}

				const ghostUserRecord = await this.ghostUserUtils.get();

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
	public AUTH: STUDIOCMS_SDK_AUTH = {
		oAuth: {
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
			delete: async (userId: string, provider: string): Promise<DeletionResponse> => {
				try {
					return await this.db
						.delete(tsOAuthAccounts)
						.where(and(eq(tsOAuthAccounts.userId, userId), eq(tsOAuthAccounts.provider, provider)))
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
			searchProvidersForId: async (
				providerId: string,
				userId: string
			): Promise<tsOAuthAccountsSelect | undefined> => {
				try {
					return await this.db
						.select()
						.from(tsOAuthAccounts)
						.where(
							and(
								eq(tsOAuthAccounts.providerUserId, providerId),
								eq(tsOAuthAccounts.userId, userId)
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
		permission: {
			currentStatus: async (userId: string): Promise<tsPermissionsSelect | undefined> => {
				try {
					return await this.db
						.select()
						.from(tsPermissions)
						.where(eq(tsPermissions.user, userId))
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
		session: {
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
						.innerJoin(tsUsers, eq(tsSessionTable.userId, tsUsers.id))
						.where(eq(tsSessionTable.id, sessionId));
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
			delete: async (sessionId: string): Promise<DeletionResponse> => {
				try {
					await this.db.delete(tsSessionTable).where(eq(tsSessionTable.id, sessionId));
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
			update: async (sessionId: string, newDate: Date): Promise<tsSessionTableSelect[]> => {
				try {
					return await this.db
						.update(tsSessionTable)
						.set({ expiresAt: newDate })
						.where(eq(tsSessionTable.id, sessionId))
						.returning();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error updating session: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error updating session: An unknown error occurred.');
				}
			},
		},
		user: {
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
			update: async (userId: string, userData: tsUsersUpdate): Promise<tsUsersSelect> => {
				try {
					return await this.db
						.update(tsUsers)
						.set(userData)
						.where(eq(tsUsers.id, userId))
						.returning()
						.get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error updating user: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error updating user: An unknown error occurred.');
				}
			},
			searchUsersForUsernameOrEmail: async (
				username: string,
				email: string
			): Promise<{
				usernameSearch: tsUsersSelect[];
				emailSearch: tsUsersSelect[];
			}> => {
				try {
					const [usernameSearch, emailSearch] = await this.db.batch([
						this.db.select().from(tsUsers).where(eq(tsUsers.username, username)),
						this.db.select().from(tsUsers).where(eq(tsUsers.email, email)),
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
			ghost: this.ghostUserUtils,
		},
	};

	/**
	 * Provides various methods to get data from the StudioCMS database.
	 */
	public GET: STUDIOCMS_SDK_GET = {
		database: {
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
			pages: async (): Promise<CombinedPageData[]> => {
				try {
					const pages: CombinedPageData[] = [];

					const pagesRaw = await this.db.select().from(tsPageData);

					for (const page of pagesRaw) {
						const PageData = await this.collectPageData(page);

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
			config: async (): Promise<tsSiteConfigSelect | undefined> => {
				try {
					return await this.db
						.select()
						.from(tsSiteConfig)
						.where(eq(tsSiteConfig.id, CMSSiteConfigId))
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
		databaseEntry: {
			users: {
				byId: async (id: string): Promise<CombinedUserData | undefined> => {
					try {
						const user = await this.db.select().from(tsUsers).where(eq(tsUsers.id, id)).get();

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
				byUsername: async (username: string): Promise<CombinedUserData | undefined> => {
					try {
						const user = await this.db
							.select()
							.from(tsUsers)
							.where(eq(tsUsers.username, username))
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
				byEmail: async (email: string): Promise<CombinedUserData | undefined> => {
					try {
						const user = await this.db.select().from(tsUsers).where(eq(tsUsers.email, email)).get();

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
			pages: {
				byId: async (id: string): Promise<CombinedPageData | undefined> => {
					try {
						const page = await this.db.select().from(tsPageData).where(eq(tsPageData.id, id)).get();

						if (!page) return undefined;

						return await this.collectPageData(page);
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
				bySlug: async (slug: string, pkg?: string): Promise<CombinedPageData | undefined> => {
					try {
						const pkgToGet = pkg || 'studiocms';

						const page = await this.db
							.select()
							.from(tsPageData)
							.where(and(eq(tsPageData.slug, slug), eq(tsPageData.package, pkgToGet)))
							.get();

						if (!page) return undefined;

						return await this.collectPageData(page);
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
		databaseTable: {
			users: async () => await this.db.select().from(tsUsers),
			oAuthAccounts: async () => await this.db.select().from(tsOAuthAccounts),
			sessionTable: async () => await this.db.select().from(tsSessionTable),
			permissions: async () => await this.db.select().from(tsPermissions),
			pageData: async () => await this.db.select().from(tsPageData),
			pageDataTags: async () => await this.db.select().from(tsPageDataTags),
			pageDataCategories: async () => await this.db.select().from(tsPageDataCategories),
			pageContent: async () => await this.db.select().from(tsPageContent),
			siteConfig: async () =>
				await this.db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get(),
			diffTracking: async () => await this.db.select().from(tsDiffTracking),
		},
		permissionsLists: {
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
		packagePages: async (packageName: string): Promise<CombinedPageData[]> => {
			try {
				const pages: CombinedPageData[] = [];

				const pagesRaw = await this.db
					.select()
					.from(tsPageData)
					.where(eq(tsPageData.package, packageName));

				for (const page of pagesRaw) {
					const PageData = await this.collectPageData(page);

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
	public POST: STUDIOCMS_SDK_POST = {
		databaseEntry: {
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
			permissions: async (userId: string, rank: string): Promise<tsPermissionsSelect[]> => {
				try {
					const userAlreadyExists = await this.db
						.select()
						.from(tsPermissions)
						.where(eq(tsPermissions.user, userId))
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
		databaseEntries: {
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
	public UPDATE: STUDIOCMS_SDK_UPDATE = {
		page: async (data: tsPageDataSelect): Promise<tsPageDataSelect> => {
			try {
				return await this.db
					.update(tsPageData)
					.set(data)
					.where(eq(tsPageData.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error updating page: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error updating page: An unknown error occurred.');
			}
		},
		pageContent: async (data: tsPageContentSelect): Promise<tsPageContentSelect> => {
			try {
				return await this.db
					.update(tsPageContent)
					.set(data)
					.where(eq(tsPageContent.id, data.id))
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
		tags: async (data: tsPageDataTagsSelect): Promise<tsPageDataTagsSelect> => {
			try {
				return await this.db
					.update(tsPageDataTags)
					.set(data)
					.where(eq(tsPageDataTags.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error updating tags: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error updating tags: An unknown error occurred.');
			}
		},
		categories: async (data: tsPageDataCategoriesSelect): Promise<tsPageDataCategoriesSelect> => {
			try {
				return await this.db
					.update(tsPageDataCategories)
					.set(data)
					.where(eq(tsPageDataCategories.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error updating categories: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error updating categories: An unknown error occurred.');
			}
		},
		permissions: async (data: tsPermissionsSelect): Promise<tsPermissionsSelect> => {
			try {
				return await this.db
					.update(tsPermissions)
					.set(data)
					.where(eq(tsPermissions.user, data.user))
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
		siteConfig: async (data: tsSiteConfigSelect): Promise<tsSiteConfigSelect> => {
			try {
				return await this.db
					.update(tsSiteConfig)
					.set(data)
					.where(eq(tsSiteConfig.id, data.id))
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
	public DELETE: STUDIOCMS_SDK_DELETE = {
		page: async (id: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.batch([
						this.db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, id)),
						this.db.delete(tsPageContent).where(eq(tsPageContent.contentId, id)),
						this.db.delete(tsPageData).where(eq(tsPageData.id, id)),
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
		pageContent: async (id: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPageContent)
					.where(eq(tsPageContent.contentId, id))
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
		pageContentLang: async (id: string, lang: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPageContent)
					.where(and(eq(tsPageContent.contentId, id), eq(tsPageContent.contentLang, lang)))
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
		tags: async (id: number): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPageDataTags)
					.where(eq(tsPageDataTags.id, id))
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
		categories: async (id: number): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPageDataCategories)
					.where(eq(tsPageDataCategories.id, id))
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
		permissions: async (userId: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsPermissions)
					.where(eq(tsPermissions.user, userId))
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
		diffTracking: async (id: string): Promise<DeletionResponse> => {
			try {
				return await this.db
					.delete(tsDiffTracking)
					.where(eq(tsDiffTracking.id, id))
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
