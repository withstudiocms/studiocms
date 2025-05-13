import { and, asc, db, desc, eq, inArray } from 'astro:db';
import { createTwoFilesPatch } from 'diff';
import { type Diff2HtmlConfig, html } from 'diff2html';
import {
	CMSNotificationSettingsId,
	CMSSiteConfigId,
	GhostUserDefaults,
	NotificationSettingsDefaults,
} from '../consts.js';
import { StudioCMS_SDK_Error } from './errors.js';
import {
	addPageToFolderTree,
	findNodeById,
	findNodeByPath,
	findNodesAlongPath,
	findNodesAlongPathToId,
	generateFolderTree,
	getFullPath,
} from './lib/foldertree.js';
import {
	generateRandomIDNumber,
	generateRandomPassword,
	generateToken,
	testToken,
} from './lib/generators.js';
import { fixDiff, parseIdNumberArray, parseIdStringArray } from './lib/parsers.js';
import { combineRanks, verifyRank } from './lib/users.js';
import {
	tsAPIKeys,
	tsDiffTracking,
	tsEmailVerificationTokens,
	tsNotificationSettings,
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
	tsSessionTable,
	tsSiteConfig,
	tsUserResetTokens,
	tsUsers,
} from './tables.js';
import type {
	CombinedInsertContent,
	CombinedPageData,
	CombinedRank,
	CombinedUserData,
	DeletionResponse,
	FolderListItem,
	FolderNode,
	MetaOnlyPageData,
	MultiPageInsert,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataReturnType,
	PageDataTagsInsertResponse,
	PaginateInput,
	SingleRank,
	addDatabaseEntryInsertPage,
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
	tsSessionTableSelect,
	tsSiteConfigInsert,
	tsSiteConfigSelect,
	tsUsersInsert,
	tsUsersSelect,
	tsUsersUpdate,
} from './types/index.js';

/**
 * The core SDK for StudioCMS.
 *
 * This SDK provides access to the core functionality of StudioCMS, including the ability to interact with the database, manage users, and more.
 *
 * @returns An object containing the core functionality of the StudioCMS SDK.
 */
export function studiocmsSDKCore() {
	/**
	 * Gets the folder structure from the database.
	 *
	 * @returns A promise that resolves to an array of folder nodes representing the folder structure.
	 */
	async function buildFolderTree(): Promise<FolderNode[]> {
		const currentFolders = await db.select().from(tsPageFolderStructure);
		return generateFolderTree(currentFolders);
	}

	/**
	 * Gets the available folders from the database.
	 *
	 * @returns A promise that resolves to an array of folder list items.
	 */
	async function getAvailableFolders(): Promise<FolderListItem[]> {
		const folders: FolderListItem[] = [];
		const currentFolders = await db.select().from(tsPageFolderStructure);
		for (const current of currentFolders) {
			folders.push(current);
		}
		return folders;
	}

	async function clearUserReferences(userId: string) {
		try {
			await db.batch([
				db.delete(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId)),
				db.delete(tsPermissions).where(eq(tsPermissions.user, userId)),
				db.delete(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, userId)),
				db.delete(tsSessionTable).where(eq(tsSessionTable.userId, userId)),
				db
					.update(tsDiffTracking)
					.set({ userId: GhostUserDefaults.id })
					.where(eq(tsDiffTracking.userId, userId)),
				db
					.update(tsPageData)
					.set({ authorId: GhostUserDefaults.id })
					.where(eq(tsPageData.authorId, userId)),
			]);
			return true;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(
					`Error clearing user references: ${error.message}`,
					error.stack
				);
			}
			throw new StudioCMS_SDK_Error('Error clearing user references: An unknown error occurred.');
		}
	}

	/**
	 * Collects categories based on the provided category IDs.
	 *
	 * @param categoryIds - An array of category IDs to collect.
	 * @returns A promise that resolves to an array of collected categories.
	 * @throws {StudioCMS_SDK_Error} If there is an error while collecting categories.
	 */
	async function collectCategories(categoryIds: number[]): Promise<CombinedPageData['categories']> {
		try {
			const categories: CombinedPageData['categories'] = [];

			if (categoryIds.length > 0) {
				const [categoryHead, ...categoryTail] = categoryIds.map((id) =>
					db.select().from(tsPageDataCategories).where(eq(tsPageDataCategories.id, id))
				);

				if (categoryHead) {
					const categoryResults = await db.batch([categoryHead, ...categoryTail]);
					categories.push(...categoryResults.flat().filter((result) => result !== undefined));
				}
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
	async function collectTags(tagIds: number[]): Promise<CombinedPageData['tags']> {
		try {
			const tags: CombinedPageData['tags'] = [];

			const [tagHead, ...tagTail] = tagIds.map((id) =>
				db.select().from(tsPageDataTags).where(eq(tsPageDataTags.id, id))
			);

			if (tagHead) {
				const tagResults = await db.batch([tagHead, ...tagTail]);
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

	function transformPageDataToMetaOnly<T extends CombinedPageData[] | CombinedPageData>(
		data: T
	): PageDataReturnType<T> {
		if (Array.isArray(data)) {
			return data.map(
				({ defaultContent, multiLangContent, ...rest }) => rest
			) as PageDataReturnType<T>;
		}
		const { defaultContent, multiLangContent, ...rest } = data as CombinedPageData;
		return rest as PageDataReturnType<T>;
	}

	async function collectPageData(
		page: tsPageDataSelect,
		tree: FolderNode[]
	): Promise<CombinedPageData>;
	async function collectPageData(
		page: tsPageDataSelect,
		tree: FolderNode[],
		metaOnly: boolean
	): Promise<MetaOnlyPageData>;

	/**
	 * Collects and combines various data related to a page.
	 *
	 * @param page - The page data to collect additional information for.
	 * @param tree - The FolderNode tree
	 * @param metaOnly - Only return the metadata and not the pageContent
	 * @returns A promise that resolves to the combined page data.
	 * @throws {StudioCMS_SDK_Error} If an error occurs while collecting page data.
	 */
	async function collectPageData(page: tsPageDataSelect, tree: FolderNode[], metaOnly = false) {
		try {
			const categoryIds = parseIdNumberArray(page.categories || []);
			const tagIds = parseIdNumberArray(page.tags || []);
			const contributorIds = Array.isArray(page.contributorIds) ? page.contributorIds : [];

			const [categories, tags, authorDataArray, contributorsData, multiLanguageContentData] =
				await Promise.all([
					collectCategories(categoryIds),
					collectTags(tagIds),
					db
						.select()
						.from(tsUsers)
						.where(eq(tsUsers.id, page.authorId || '')),
					contributorIds.length
						? db.select().from(tsUsers).where(inArray(tsUsers.id, contributorIds))
						: undefined,
					metaOnly
						? undefined
						: db.select().from(tsPageContent).where(eq(tsPageContent.contentId, page.id)),
				]);

			const authorData = authorDataArray[0] || undefined;

			const defaultLanguageContentData = multiLanguageContentData?.find(
				(content) => content.contentLang === page.contentLang
			);

			const safeSlug = page.slug === 'index' ? '/' : `/${page.slug}`;

			let urlRoute = safeSlug;

			if (page.parentFolder) {
				const urlParts = findNodesAlongPathToId(tree, page.parentFolder);
				urlRoute = urlParts.map((part) => part.name).join('/') + safeSlug;
			}

			const returnData = {
				...page,
				urlRoute,
				categories,
				tags,
				contributorIds,
				authorData,
				contributorsData,
				multiLangContent: multiLanguageContentData,
				defaultContent: defaultLanguageContentData,
			} as CombinedPageData;

			return metaOnly ? transformPageDataToMetaOnly(returnData) : returnData;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error collecting page data: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error collecting page data: An unknown error occurred.');
		}
	}

	function filterPagesByDraftAndIndex(
		pages: tsPageDataSelect[],
		includeDrafts: boolean,
		hideDefaultIndex: boolean
	): tsPageDataSelect[] {
		return pages.filter(
			({ draft, slug }) =>
				(includeDrafts || draft === false || draft === null) &&
				(!hideDefaultIndex || slug !== 'index')
		);
	}

	async function _getAllPages(
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		tree?: FolderNode[],
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
		tree?: FolderNode[],
		metaOnly = false,
		paginate?: PaginateInput
	) {
		try {
			if (paginate) {
				if (paginate.limit < 0 || paginate.offset < 0) {
					throw new StudioCMS_SDK_Error('Pagination limit and offset must be non-negative values');
				}
				if (paginate.limit === 0) {
					// Either throw an error or set a default value
					paginate.limit = 10; // Default value
				}
			}
			const pagesRaw = paginate
				? await db
						.select()
						.from(tsPageData)
						.orderBy(asc(tsPageData.title))
						.limit(paginate.limit)
						.offset(paginate.offset)
				: await db.select().from(tsPageData).orderBy(asc(tsPageData.title));

			const pagesFiltered = filterPagesByDraftAndIndex(pagesRaw, includeDrafts, hideDefaultIndex);

			const folders = tree || (await buildFolderTree());

			const pages = await Promise.all(
				pagesFiltered.map(async (page) => await collectPageData(page, folders, metaOnly))
			);

			return pages;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting pages: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting pages: An unknown error occurred.');
		}
	}

	async function _getPagesByID(
		id: string,
		tree?: FolderNode[]
	): Promise<CombinedPageData | undefined>;
	async function _getPagesByID(
		id: string,
		tree?: FolderNode[],
		metaOnly?: boolean
	): Promise<MetaOnlyPageData | undefined>;

	async function _getPagesByID(id: string, tree?: FolderNode[], metaOnly = false) {
		try {
			const page = await db.select().from(tsPageData).where(eq(tsPageData.id, id)).get();

			if (!page) return undefined;
			const folders = tree || (await buildFolderTree());

			const pageData = await collectPageData(page, folders, metaOnly);

			return pageData;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting page by ID: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting page by ID: An unknown error occurred.');
		}
	}

	async function _getPagesByFolderID(
		id: string,
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		tree?: FolderNode[],
		metaOnly?: false,
		paginate?: PaginateInput
	): Promise<CombinedPageData[]>;
	async function _getPagesByFolderID(
		id: string,
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		tree?: FolderNode[],
		metaOnly?: true,
		paginate?: PaginateInput
	): Promise<MetaOnlyPageData[]>;

	async function _getPagesByFolderID(
		id: string,
		includeDrafts = false,
		hideDefaultIndex = false,
		tree?: FolderNode[],
		metaOnly = false,
		paginate?: PaginateInput
	) {
		try {
			if (paginate) {
				if (paginate.limit < 0 || paginate.offset < 0) {
					throw new StudioCMS_SDK_Error('Pagination limit and offset must be non-negative values');
				}
				if (paginate.limit === 0) {
					// Either throw an error or set a default value
					paginate.limit = 10; // Default value
				}
			}
			const pagesRaw = paginate
				? await db
						.select()
						.from(tsPageData)
						.where(eq(tsPageData.parentFolder, id))
						.orderBy(asc(tsPageData.title))
						.limit(paginate.limit)
						.offset(paginate.offset)
				: await db
						.select()
						.from(tsPageData)
						.where(eq(tsPageData.parentFolder, id))
						.orderBy(asc(tsPageData.title));

			const pagesFiltered = filterPagesByDraftAndIndex(pagesRaw, includeDrafts, hideDefaultIndex);

			const folders = tree || (await buildFolderTree());

			const pages = await Promise.all(
				pagesFiltered.map(async (page) => await collectPageData(page, folders, metaOnly))
			);

			return pages;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(
					`Error getting pages by folder ID: ${error.message}`,
					error.stack
				);
			}
			throw new StudioCMS_SDK_Error('Error getting pages by folder ID: An unknown error occurred.');
		}
	}

	async function _getPagesBySlug(
		slug: string,
		tree?: FolderNode[]
	): Promise<CombinedPageData | undefined>;
	async function _getPagesBySlug(
		slug: string,
		tree?: FolderNode[],
		metaOnly?: boolean
	): Promise<MetaOnlyPageData | undefined>;

	async function _getPagesBySlug(slug: string, tree?: FolderNode[], metaOnly = false) {
		try {
			const page = await db.select().from(tsPageData).where(eq(tsPageData.slug, slug)).get();

			if (!page) return undefined;
			const folders = tree || (await buildFolderTree());

			const pageData = await collectPageData(page, folders, metaOnly);

			return pageData;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting page by slug: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting page by slug: An unknown error occurred.');
		}
	}

	async function _getPackagesPages(
		packageName: string,
		tree?: FolderNode[]
	): Promise<CombinedPageData[]>;
	async function _getPackagesPages(
		packageName: string,
		tree?: FolderNode[],
		metaOnly?: boolean
	): Promise<MetaOnlyPageData[]>;

	async function _getPackagesPages(packageName: string, tree?: FolderNode[], metaOnly = false) {
		try {
			const pagesRaw = await db
				.select()
				.from(tsPageData)
				.where(eq(tsPageData.package, packageName));
			const folders = tree || (await buildFolderTree());

			const pages = await Promise.all(
				pagesRaw.map(async (page) => await collectPageData(page, folders, metaOnly))
			);

			return pages;
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting pages: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting pages: An unknown error occurred.');
		}
	}

	/**
	 * Collects user data by fetching OAuth data and permission data from the database.
	 *
	 * @param user - The user object containing user information.
	 * @returns A promise that resolves to a CombinedUserData object containing the user data, OAuth data, and permissions data.
	 * @throws {StudioCMS_SDK_Error} If an error occurs while collecting user data.
	 */
	async function collectUserData(user: tsUsersSelect): Promise<CombinedUserData> {
		try {
			const [oAuthData, permissionData] = await db.batch([
				db.select().from(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, user.id)),
				db.select().from(tsPermissions).where(eq(tsPermissions.user, user.id)),
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

	const resetTokenBucket = {
		new: async (userId: string) => {
			const token = generateToken(userId);

			return await db
				.insert(tsUserResetTokens)
				.values({ id: crypto.randomUUID(), userId, token })
				.returning()
				.get();
		},
		delete: async (userId: string): Promise<void> => {
			await db.delete(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId));
		},
		check: async (token: string) => {
			const _token = testToken(token);

			if (!_token.isValid) {
				return false;
			}

			if (!_token.userId) {
				return false;
			}

			const resetToken = await db
				.select()
				.from(tsUserResetTokens)
				.where(eq(tsUserResetTokens.userId, _token.userId));

			if (!resetToken) {
				return false;
			}

			return !!resetToken.find((t) => t.token === token);
		},
	};

	async function checkDiffsLengthAndRemoveOldestIfToLong(pageId: string, length: number) {
		const diffs = await db
			.select()
			.from(tsDiffTracking)
			.where(eq(tsDiffTracking.pageId, pageId))
			.orderBy(asc(tsDiffTracking.timestamp));

		if (diffs.length > length) {
			const oldestDiff = diffs[0];

			await db.delete(tsDiffTracking).where(eq(tsDiffTracking.id, oldestDiff.id));
		}
	}

	const REST_API = {
		tokens: {
			get: async (userId: string) => {
				return await db.select().from(tsAPIKeys).where(eq(tsAPIKeys.userId, userId));
			},
			new: async (userId: string, description: string) => {
				// Generate non-expiring token for API key
				const key = generateToken(userId, true);

				return await db
					.insert(tsAPIKeys)
					.values({
						id: crypto.randomUUID(),
						creationDate: new Date(),
						userId,
						key,
						description,
					})
					.returning()
					.get();
			},
			delete: async (userId: string, tokenId: string) => {
				await db
					.delete(tsAPIKeys)
					.where(and(eq(tsAPIKeys.userId, userId), eq(tsAPIKeys.id, tokenId)));
			},
			verify: async (key: string) => {
				const apiKey = await db.select().from(tsAPIKeys).where(eq(tsAPIKeys.key, key)).get();

				if (!apiKey) {
					return false;
				}

				const keyRank = await db
					.select()
					.from(tsPermissions)
					.where(eq(tsPermissions.user, apiKey.userId))
					.get();

				if (!keyRank) {
					return false;
				}

				return {
					userId: apiKey.userId,
					key: apiKey.key,
					rank: keyRank.rank,
				};
			},
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
		) => {
			const diff = createTwoFilesPatch('Content', 'Content', data.content.start, data.content.end);

			await checkDiffsLengthAndRemoveOldestIfToLong(pageId, diffLength);

			const inputted = await db
				.insert(tsDiffTracking)
				.values({
					id: crypto.randomUUID(),
					userId,
					pageId,
					diff,
					timestamp: new Date(),
					pageContentStart: data.content.start,
					pageMetaData: JSON.stringify(data.metaData),
				})
				.returning()
				.get();

			return fixDiff(inputted);
		},
		clear: async (pageId: string) => {
			await db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, pageId));
		},
		get: {
			byPageId: {
				all: async (pageId: string) => {
					const items = await db
						.select()
						.from(tsDiffTracking)
						.where(eq(tsDiffTracking.pageId, pageId))
						.orderBy(desc(tsDiffTracking.timestamp));

					return fixDiff(items);
				},
				latest: async (pageId: string, count: number) => {
					const diffs = await db
						.select()
						.from(tsDiffTracking)
						.where(eq(tsDiffTracking.pageId, pageId))
						.orderBy(desc(tsDiffTracking.timestamp));

					const split = diffs.slice(0, count);

					return fixDiff(split);
				},
			},
			byUserId: {
				all: async (userId: string) => {
					const items = await db
						.select()
						.from(tsDiffTracking)
						.where(eq(tsDiffTracking.userId, userId))
						.orderBy(desc(tsDiffTracking.timestamp));

					return fixDiff(items);
				},
				latest: async (userId: string, count: number) => {
					const diffs = await db
						.select()
						.from(tsDiffTracking)
						.where(eq(tsDiffTracking.userId, userId))
						.orderBy(desc(tsDiffTracking.timestamp));

					const split = diffs.slice(0, count);

					return fixDiff(split);
				},
			},
			single: async (id: string) => {
				const data = await db.select().from(tsDiffTracking).where(eq(tsDiffTracking.id, id)).get();
				if (!data) return;
				return fixDiff(data);
			},
		},
		revertToDiff: async (id: string, type: 'content' | 'data' | 'both') => {
			const diffEntry = await db
				.select()
				.from(tsDiffTracking)
				.where(eq(tsDiffTracking.id, id))
				.get();

			if (!diffEntry) {
				throw new StudioCMS_SDK_Error('Diff not found');
			}

			const shouldRevertData = type === 'data' || type === 'both';
			const shouldRevertContent = type === 'content' || type === 'both';

			if (shouldRevertData) {
				const pageData = JSON.parse(diffEntry.pageMetaData as string);

				await db.update(tsPageData).set(pageData.start).where(eq(tsPageData.id, pageData.end.id));
			}

			if (shouldRevertContent) {
				await db
					.update(tsPageContent)
					.set({ content: diffEntry.pageContentStart })
					.where(eq(tsPageContent.contentId, diffEntry.pageId));
			}

			// purge all diffs after this one
			const allDiffs = await db
				.select()
				.from(tsDiffTracking)
				.where(eq(tsDiffTracking.pageId, diffEntry.pageId))
				.orderBy(desc(tsDiffTracking.timestamp));

			const diffIndex = allDiffs.findIndex((diff) => diff.id === id);

			const diffsToPurge = allDiffs.slice(diffIndex + 1);

			for (const diff of diffsToPurge) {
				await db.delete(tsDiffTracking).where(eq(tsDiffTracking.id, diff.id));
			}

			return fixDiff(diffEntry);
		},
		utils: {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			getMetaDataDifferences<T extends Record<string, any>>(
				obj1: T,
				obj2: T
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			): { label: string; previous: any; current: any }[] {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				const differences: { label: string; previous: any; current: any }[] = [];

				const Labels: Record<string, string> = {
					package: 'Page Type',
					title: 'Page Title',
					description: 'Page Description',
					showOnNav: 'Show in Navigation',
					slug: 'Page Slug',
					contentLang: 'Content Language',
					heroImage: 'Hero/OG Image',
					categories: 'Page Categories',
					tags: 'Page Tags',
					showAuthor: 'Show Author',
					showContributors: 'Show Contributors',
					parentFolder: 'Parent Folder',
					draft: 'Draft',
				};

				function processLabel(label: string) {
					return Labels[label] ? Labels[label] : label;
				}

				for (const label in obj1) {
					const blackListedLabels: string[] = [
						'publishedAt',
						'updatedAt',
						'authorId',
						'contributorIds',
					];
					if (blackListedLabels.includes(label)) continue;

					// biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
					if (obj1.hasOwnProperty(label) && obj2.hasOwnProperty(label)) {
						if (obj1[label] !== obj2[label]) {
							if (Array.isArray(obj1[label]) && Array.isArray(obj2[label])) {
								if (obj1[label].length === obj2[label].length) continue;
							}
							differences.push({
								label: processLabel(label),
								previous: obj1[label],
								current: obj2[label],
							});
						}
					}
				}

				return differences;
			},
			getDiffHTML(diff: string | null, options?: Diff2HtmlConfig) {
				return html(diff || '', {
					diffStyle: 'word',
					matching: 'lines',
					drawFileList: false,
					outputFormat: 'side-by-side',
					...options,
				});
			},
		},
	};

	const AUTH = {
		verifyEmail: {
			get: async (id: string) => {
				const request = await db
					.select()
					.from(tsEmailVerificationTokens)
					.where(eq(tsEmailVerificationTokens.id, id))
					.get();

				if (!request) {
					return null;
				}

				return request;
			},
			create: async (userId: string) => {
				await db
					.delete(tsEmailVerificationTokens)
					.where(eq(tsEmailVerificationTokens.userId, userId));

				const token = generateToken(userId);

				return await db
					.insert(tsEmailVerificationTokens)
					.values({
						id: crypto.randomUUID(),
						userId,
						token,
						expiresAt: new Date(Date.now() + 1000 * 60 * 10),
					})
					.returning()
					.get();
			},
			delete: async (userId: string) => {
				await db
					.delete(tsEmailVerificationTokens)
					.where(eq(tsEmailVerificationTokens.userId, userId));
			},
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
			create: async (data: tsOAuthAccountsSelect): Promise<tsOAuthAccountsSelect> => {
				try {
					return await db.insert(tsOAuthAccounts).values(data).returning().get();
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
					return await db
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
					return await db
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

		/**
		 * Provides various methods to get and update permissions for users in the StudioCMS database.
		 */
		permission: {
			/**
			 * Checks the current status of a user's permissions.
			 */
			currentStatus: async (userId: string): Promise<tsPermissionsSelect | undefined> => {
				try {
					return await db.select().from(tsPermissions).where(eq(tsPermissions.user, userId)).get();
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
					return await db
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
					return await db
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

			/**
			 * Deletes a session from the database.
			 *
			 * @param sessionId - The ID of the session to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the session.
			 */
			delete: async (sessionId: string): Promise<DeletionResponse> => {
				try {
					await db.delete(tsSessionTable).where(eq(tsSessionTable.id, sessionId));
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
					return await db
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
			create: async (
				newUserData: tsUsersInsert,
				rank?: 'visitor' | 'editor' | 'admin' | 'owner'
			): Promise<tsUsersSelect> => {
				try {
					const newUser = await db.insert(tsUsers).values(newUserData).returning().get();
					await db.insert(tsPermissions).values({ user: newUser.id, rank: rank || 'visitor' });
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
					return await db
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
					const [usernameSearch, emailSearch] = await db.batch([
						db.select().from(tsUsers).where(eq(tsUsers.username, username)),
						db.select().from(tsUsers).where(eq(tsUsers.email, email)),
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
						const ghostUser = await db
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

				/**
				 * Creates the ghost user in the database.
				 *
				 * @returns A promise that resolves to the inserted ghost user.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
				 */
				create: async () => {
					try {
						return await db.insert(tsUsers).values(GhostUserDefaults).returning().get();
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
						return await db
							.select()
							.from(tsUsers)
							.where(eq(tsUsers.id, GhostUserDefaults.id))
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

	const INIT = {
		/**
		 * Initializes the StudioCMS SiteConfig table with the provided configuration.
		 *
		 * @param config - The configuration to insert into the SiteConfig table.
		 * @returns A promise that resolves to the inserted site configuration.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the site configuration.
		 */
		siteConfig: async (config: tsSiteConfigInsert): Promise<tsSiteConfigSelect> => {
			try {
				return await db
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
				const ghostUser = await AUTH.user.ghost.verifyExists();

				// If the ghost user does not exist, create it and return the inserted record
				if (!ghostUser) {
					return await AUTH.user.ghost.create();
				}

				const ghostUserRecord = await AUTH.user.ghost.get();

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

	const notificationSettings = {
		site: {
			get: async () => {
				const data = await db
					.select()
					.from(tsNotificationSettings)
					.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
					.get();

				if (!data) {
					return await db
						.insert(tsNotificationSettings)
						.values(NotificationSettingsDefaults)
						.returning()
						.get();
				}

				return data;
			},
			update: async (settings: tsNotificationSettingsInsert) => {
				return await db
					.update(tsNotificationSettings)
					.set(settings)
					.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
					.returning()
					.get();
			},
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
			users: async (): Promise<CombinedUserData[]> => {
				try {
					const combinedUserData: CombinedUserData[] = [];

					const users = await db.select().from(tsUsers);

					for (const user of users) {
						if (user.id === GhostUserDefaults.id) {
							continue;
						}

						const UserData = await collectUserData(user);

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
			config: async (): Promise<tsSiteConfigSelect | undefined> => {
				try {
					return await db
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

			folders: async (): Promise<tsPageFolderSelect[]> => {
				try {
					return await db.select().from(tsPageFolderStructure);
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting folders: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting folders: An unknown error occurred.');
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
						const user = await db.select().from(tsUsers).where(eq(tsUsers.id, id)).get();

						if (!user) return undefined;

						return await collectUserData(user);
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
						const user = await db
							.select()
							.from(tsUsers)
							.where(eq(tsUsers.username, username))
							.get();

						if (!user) return undefined;

						return await collectUserData(user);
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
						const user = await db.select().from(tsUsers).where(eq(tsUsers.email, email)).get();

						if (!user) return undefined;

						return await collectUserData(user);
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

			folder: async (id: string): Promise<tsPageFolderSelect | undefined> => {
				try {
					return await db
						.select()
						.from(tsPageFolderStructure)
						.where(eq(tsPageFolderStructure.id, id))
						.get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error getting folders: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error getting folders: An unknown error occurred.');
				}
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
			users: async () => await db.select().from(tsUsers),

			/**
			 * Retrieves all data from the OAuth accounts table.
			 *
			 * @returns A promise that resolves to an array of OAuth account data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the OAuth accounts.
			 */
			oAuthAccounts: async () => await db.select().from(tsOAuthAccounts),

			/**
			 * Retrieves all data from the session table.
			 *
			 * @returns A promise that resolves to an array of session data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the sessions.
			 */
			sessionTable: async () => await db.select().from(tsSessionTable),

			/**
			 * Retrieves all data from the permissions table.
			 *
			 * @returns A promise that resolves to an array of permission data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the permissions.
			 */
			permissions: async () => await db.select().from(tsPermissions),

			/**
			 * Retrieves all data from the page data table.
			 *
			 * @returns A promise that resolves to an array of page data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the pages.
			 */
			pageData: async () => await db.select().from(tsPageData),

			/**
			 * Retrieves all data from the page data tags table.
			 *
			 * @returns A promise that resolves to an array of page data tags.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page data tags.
			 */
			pageDataTags: async () => await db.select().from(tsPageDataTags),

			/**
			 * Retrieves all data from the page data categories table.
			 *
			 * @returns A promise that resolves to an array of page data categories.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page data categories.
			 */
			pageDataCategories: async () => await db.select().from(tsPageDataCategories),

			/**
			 * Retrieves all data from the page content table.
			 *
			 * @returns A promise that resolves to an array of page content.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page content.
			 */
			pageContent: async () => await db.select().from(tsPageContent),

			/**
			 * Retrieves all data from the site config table.
			 *
			 * @returns A promise that resolves to an array of site configuration data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the site configuration.
			 */
			siteConfig: async () =>
				await db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get(),

			/**
			 * Retrieves all data from the diff tracking table.
			 *
			 * @returns A promise that resolves to an array of diff tracking data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the diff tracking data.
			 */
			diffTracking: async () => await db.select().from(tsDiffTracking),

			/**
			 * Retrieves all data from the page folder structure table.
			 *
			 * @returns A promise that resolves to an array of page folder structure data.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the page folder structure data.
			 */
			pageFolderStructure: async () => await db.select().from(tsPageFolderStructure),

			/**
			 * Retrieves all data from the notification settings table.
			 *
			 * @returns A promise that resolves to an array of notification settings data.
			 */
			notificationSettings: async () =>
				await db
					.select()
					.from(tsNotificationSettings)
					.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
					.get(),

			/**
			 * Retrieves all data from the email verification tokens table.
			 *
			 * @returns A promise that resolves to an array of email verification token data.
			 */
			emailVerificationTokens: async () => await db.select().from(tsEmailVerificationTokens),
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
					const [currentPermittedUsers, existingUsers] = await db.batch([
						db.select().from(tsPermissions),
						db.select().from(tsUsers),
					]);

					const owners = verifyRank(existingUsers, currentPermittedUsers, 'owner');

					const admins = verifyRank(existingUsers, currentPermittedUsers, 'admin');

					const editors = verifyRank(existingUsers, currentPermittedUsers, 'editor');

					const visitors = verifyRank(existingUsers, currentPermittedUsers, 'visitor');

					return [
						...combineRanks('owner', owners),
						...combineRanks('admin', admins),
						...combineRanks('editor', editors),
						...combineRanks('visitor', visitors),
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
					const [currentPermittedUsers, existingUsers] = await db.batch([
						db.select().from(tsPermissions),
						db.select().from(tsUsers),
					]);

					return verifyRank(existingUsers, currentPermittedUsers, 'owner');
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
					const [currentPermittedUsers, existingUsers] = await db.batch([
						db.select().from(tsPermissions),
						db.select().from(tsUsers),
					]);

					return verifyRank(existingUsers, currentPermittedUsers, 'admin');
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
					const [currentPermittedUsers, existingUsers] = await db.batch([
						db.select().from(tsPermissions),
						db.select().from(tsUsers),
					]);

					return verifyRank(existingUsers, currentPermittedUsers, 'editor');
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
					const [currentPermittedUsers, existingUsers] = await db.batch([
						db.select().from(tsPermissions),
						db.select().from(tsUsers),
					]);

					return verifyRank(existingUsers, currentPermittedUsers, 'visitor');
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
			pages: async (
				pageData: tsPageDataInsert,
				pageContent: CombinedInsertContent
			): Promise<addDatabaseEntryInsertPage> => {
				try {
					const newContentID = pageData.id || crypto.randomUUID().toString();

					const {
						id = newContentID,
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
						categories = [],
						tags = [],
						contributorIds = [],
						draft = false,
						parentFolder = null,
					} = pageData;

					const stringified = {
						categories: categories || [],
						tags: tags || [],
						contributorIds: contributorIds || [],
					};

					const contentData = {
						id: crypto.randomUUID().toString(),
						contentId: newContentID,
						contentLang: contentLang,
						content: pageContent.content || '',
					};

					const NOW = new Date();

					const [newPageData, newPageContent] = await db.batch([
						db
							.insert(tsPageData)
							.values({
								id,
								title,
								slug,
								description,
								authorId,
								contentLang,
								heroImage,
								showAuthor,
								showContributors,
								showOnNav,
								draft,
								parentFolder,
								package: packageName,
								publishedAt: NOW,
								updatedAt: NOW,
								...stringified,
							})
							.returning({ id: tsPageData.id }),
						db.insert(tsPageContent).values(contentData).returning({ id: tsPageContent.id }),
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
			 * Inserts new page content into the database.
			 *
			 * @param pageContent - The data to insert into the page content table.
			 * @returns A promise that resolves to the inserted page content.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the page content.
			 */
			pageContent: async (pageContent: tsPageContentInsert): Promise<PageContentReturnId[]> => {
				try {
					return await db
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
					return await db
						.insert(tsPageDataTags)
						.values({
							name: tag.name,
							description: tag.description,
							slug: tag.slug,
							meta: JSON.stringify(tag.meta),
							id: tag.id || generateRandomIDNumber(9),
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
					return await db
						.insert(tsPageDataCategories)
						.values({
							name: category.name,
							description: category.description,
							slug: category.slug,
							meta: JSON.stringify(category.meta),
							id: category.id || generateRandomIDNumber(9),
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
					const userAlreadyExists = await db
						.select()
						.from(tsPermissions)
						.where(eq(tsPermissions.user, userId))
						.get();

					if (userAlreadyExists) {
						throw new StudioCMS_SDK_Error(
							'User already is already assigned a rank, please update the existing rank instead.'
						);
					}

					return await db
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
			 * Inserts a new diff tracking entry into the database.
			 *
			 * @param diff - The data to insert into the diff tracking table.
			 * @returns A promise that resolves to the inserted diff tracking entry.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the diff tracking entry.
			 */
			diffTracking: async (diff: tsDiffTrackingInsert): Promise<tsDiffTrackingSelect[]> => {
				try {
					return await db
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

			/**
			 * Inserts a new folder into the database.
			 *
			 * @param folder - The data to insert into the page folder structure table.
			 * @returns A promise that resolves to the inserted folder.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the folder.
			 */
			folder: async (folder: tsPageFolderInsert): Promise<tsPageFolderSelect> => {
				try {
					return await db
						.insert(tsPageFolderStructure)
						.values({
							id: folder.id || crypto.randomUUID().toString(),
							name: folder.name,
							parent: folder.parent || null,
						})
						.returning()
						.get();
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error inserting folder: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error inserting folder: An unknown error occurred.');
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
					return await db
						.insert(tsPageDataTags)
						.values(
							data.map((tag) => {
								return {
									id: tag.id || generateRandomIDNumber(9),
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
					return await db
						.insert(tsPageDataCategories)
						.values(
							data.map((category) => {
								return {
									id: category.id || generateRandomIDNumber(9),
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
					const currentPermittedUsers = await db.select().from(tsPermissions);

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

					return await db
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
							categories = [],
							tags = [],
							contributorIds = [],
							draft = false,
							parentFolder = null,
							id = newContentID,
						} = pageData;

						const stringified = {
							categories: categories || [],
							tags: tags || [],
							contributorIds: contributorIds || [],
						};

						const contentData = {
							id: crypto.randomUUID().toString(),
							contentId: newContentID,
							contentLang: pageContent.contentLang || 'default',
							content: pageContent.content || '',
						};

						const NOW = new Date();

						queries.push(
							db
								.insert(tsPageData)
								.values({
									id,
									title,
									slug,
									description,
									authorId,
									contentLang,
									heroImage,
									showAuthor,
									showContributors,
									showOnNav,
									draft,
									parentFolder,
									package: packageName,
									publishedAt: NOW,
									updatedAt: NOW,
									...stringified,
								})
								.returning(),
							db.insert(tsPageContent).values(contentData).returning()
						);
					}

					const [head, ...tail] = queries;

					if (head) {
						await db.batch([head, ...tail]);
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

	const UPDATE = {
		/**
		 * Updates a page in the database.
		 *
		 * @param data - The data to update in the page data table.
		 * @returns A promise that resolves to the updated page data.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the page.
		 */
		page: async (data: tsPageDataSelect): Promise<tsPageDataSelect> => {
			try {
				return await db
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

		/**
		 * Updates a page content in the database.
		 *
		 * @param data - The data to update in the page content table.
		 * @returns A promise that resolves to the updated page content.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the page content.
		 */
		pageContent: async (data: tsPageContentSelect): Promise<tsPageContentSelect> => {
			try {
				return await db
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

		/**
		 * Updates a tag in the database.
		 *
		 * @param data - The data to update in the page data tags table.
		 * @returns A promise that resolves to the updated tag.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the tag.
		 */
		tags: async (data: tsPageDataTagsSelect): Promise<tsPageDataTagsSelect> => {
			try {
				return await db
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

		/**
		 * Updates a category in the database.
		 *
		 * @param data - The data to update in the page data categories table.
		 * @returns A promise that resolves to the updated category.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the category.
		 */
		categories: async (data: tsPageDataCategoriesSelect): Promise<tsPageDataCategoriesSelect> => {
			try {
				return await db
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

		/**
		 * Updates a permission in the database.
		 *
		 * @param data - The data to update in the permissions table.
		 * @returns A promise that resolves to the updated permission.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the permission.
		 */
		permissions: async (data: tsPermissionsSelect): Promise<tsPermissionsSelect> => {
			try {
				return await db
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

		/**
		 * Updates a site configuration in the database.
		 *
		 * @param data - The data to update in the site config table.
		 * @returns A promise that resolves to the updated site configuration.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the site configuration.
		 */
		siteConfig: async (data: tsSiteConfigSelect): Promise<tsSiteConfigSelect> => {
			try {
				return await db
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

		folder: async (data: tsPageFolderSelect): Promise<tsPageFolderSelect> => {
			try {
				return await db
					.update(tsPageFolderStructure)
					.set(data)
					.where(eq(tsPageFolderStructure.id, data.id))
					.returning()
					.get();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error updating folder: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error updating folder: An unknown error occurred.');
			}
		},
	};

	const DELETE = {
		/**
		 * Deletes a page from the database.
		 *
		 * @param id - The ID of the page to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page.
		 */
		page: async (id: string): Promise<DeletionResponse> => {
			try {
				return await db
					.batch([
						db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, id)),
						db.delete(tsPageContent).where(eq(tsPageContent.contentId, id)),
						db.delete(tsPageData).where(eq(tsPageData.id, id)),
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
				return await db
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
				return await db
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

		/**
		 * Deletes a tag from the database.
		 *
		 * @param id - The ID of the tag to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the tag.
		 */
		tags: async (id: number): Promise<DeletionResponse> => {
			try {
				return await db
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

		/**
		 * Deletes a category from the database.
		 *
		 * @param id - The ID of the category to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the category.
		 */
		categories: async (id: number): Promise<DeletionResponse> => {
			try {
				return await db
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

		/**
		 * Deletes a permission from the database.
		 *
		 * @param userId - The ID of the user to delete the permission for.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the permission.
		 */
		permissions: async (userId: string): Promise<DeletionResponse> => {
			try {
				return await db
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

		/**
		 * Deletes a site configuration from the database.
		 *
		 * @param id - The ID of the site configuration to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the site configuration.
		 */
		diffTracking: async (id: string): Promise<DeletionResponse> => {
			try {
				return await db
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

		/**
		 * Deletes a folder from the database.
		 *
		 * @param id - The ID of the folder to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the folder.
		 */
		folder: async (id: string): Promise<DeletionResponse> => {
			try {
				return await db
					.delete(tsPageFolderStructure)
					.where(eq(tsPageFolderStructure.id, id))
					.then(() => {
						return {
							status: 'success',
							message: `Folder with ID ${id} has been deleted successfully`,
						};
					});
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting folder with ID ${id}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting folder with ID ${id}: An unknown error occurred.`
				);
			}
		},

		/**
		 * Deletes a user from the database.
		 *
		 * @param id - The ID of the user to delete.
		 * @returns A promise that resolves to a deletion response.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the user.
		 */
		user: async (id: string): Promise<DeletionResponse> => {
			if (id === GhostUserDefaults.id) {
				throw new StudioCMS_SDK_Error(
					`User with ID ${id} is an internal user and cannot be deleted.`
				);
			}
			try {
				const verifyNoReference = await clearUserReferences(id);

				if (verifyNoReference) {
					return await db
						.delete(tsUsers)
						.where(eq(tsUsers.id, id))
						.then(() => {
							return {
								status: 'success',
								message: `User with ID ${id} has been deleted successfully`,
							};
						});
				}
				throw new StudioCMS_SDK_Error(
					`There was an issue deleting User with ID ${id}. Please manually remove all references before deleting the user. Or try again.`
				);
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(
						`Error deleting user with ID ${id}: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMS_SDK_Error(
					`Error deleting user with ID ${id}: An unknown error occurred.`
				);
			}
		},
	};

	// Return the public methods
	return {
		db, //
		addPageToFolderTree, //
		findNodeById, //
		findNodeByPath, //
		findNodesAlongPath, //
		getFullPath, //
		parseIdNumberArray, //
		parseIdStringArray, //
		generateRandomIDNumber, //
		generateToken, //
		testToken, //
		combineRanks, //
		verifyRank, //
		generateRandomPassword, //
		buildFolderTree, //
		getAvailableFolders, //
		clearUserReferences, //
		collectCategories, //
		collectTags, //
		collectPageData, //
		collectUserData, //
		resetTokenBucket, //
		diffTracking, //
		notificationSettings, //
		AUTH, //
		INIT, //
		DELETE, //
		REST_API, //
		GET,
		POST,
		UPDATE,
	};
}
