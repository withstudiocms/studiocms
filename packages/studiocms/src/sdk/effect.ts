import { asc, desc, eq } from 'astro:db';
import { createTwoFilesPatch } from 'diff';
import { type Diff2HtmlConfig, html } from 'diff2html';
import { Effect } from 'effect';
import { CMSNotificationSettingsId, NotificationSettingsDefaults } from '../consts.js';
import {
	AstroDB,
	SDKCore_Collectors,
	SDKCore_FolderTree,
	SDKCore_Generators,
	SDKCore_Parsers,
	SDKCore_Users,
} from './effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from './errors.js';
import {
	tsDiffTracking,
	tsNotificationSettings,
	tsPageContent,
	tsPageData,
	tsUserResetTokens,
} from './tables.js';
import type {
	CombinedPageData,
	CombinedUserData,
	FolderNode,
	MetaOnlyPageData,
	tsNotificationSettingsInsert,
	tsPageDataSelect,
	tsUserResetTokensSelect,
	tsUsersSelect,
} from './types/index.js';

export class SDKCore extends Effect.Service<SDKCore>()('studiocms/sdk/SDKCore', {
	effect: Effect.gen(function* () {
		// Get Services
		const dbService = yield* AstroDB;
		const folderTreeService = yield* SDKCore_FolderTree;
		const generatorService = yield* SDKCore_Generators;
		const parseService = yield* SDKCore_Parsers;
		const userService = yield* SDKCore_Users;
		const collectors = yield* SDKCore_Collectors;

		// Breakout service functions that need to be returned in this.
		const { db } = dbService;

		const {
			getFullPath,
			findNodeByPath,
			findNodesAlongPath,
			findNodesAlongPathToId,
			findNodeById,
			addPageToFolderTree,
			buildFolderTree,
			getAvailableFolders,
		} = folderTreeService;

		const { generateRandomIDNumber, generateRandomPassword, generateToken, testToken } =
			generatorService;

		const { parseIdNumberArray, parseIdStringArray } = parseService;

		const { combineRanks, verifyRank, clearUserReferences } = userService;

		const { collectCategories, collectTags, collectPageData, collectUserData } = collectors;

		const resetTokenBucket = {
			new: (userId: string): Effect.Effect<tsUserResetTokensSelect, SDKCoreError, never> =>
				Effect.gen(function* () {
					const token = yield* generateToken(userId);

					return yield* dbService.execute((db) =>
						db
							.insert(tsUserResetTokens)
							.values({ id: crypto.randomUUID(), userId, token })
							.returning()
							.get()
					);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`resetTokenBucket New Error: ${cause}`),
								})
							),
					})
				),
			delete: (userId: string): Effect.Effect<void, SDKCoreError, never> =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId))
					);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`resetTokenBucket Delete Error: ${cause}`),
								})
							),
					})
				),
			check: (token: string): Effect.Effect<boolean, SDKCoreError, never> =>
				Effect.gen(function* () {
					const { isValid, userId } = yield* testToken(token);

					if (!isValid) return false;
					if (!userId) return false;

					const resetToken = yield* dbService.execute((db) =>
						db.select().from(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId))
					);

					if (!resetToken || resetToken.length === 0) return false;

					return !!resetToken.find((t) => t.token === token);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`resetTokenBucket Check Error: ${cause}`),
								})
							),
					})
				),
		};

		const checkDiffsLengthAndRemoveOldestIfToLong = (
			pageId: string,
			length: number
		): Effect.Effect<void, SDKCoreError, never> =>
			Effect.gen(function* () {
				const diffs = yield* dbService.execute((db) =>
					db
						.select()
						.from(tsDiffTracking)
						.where(eq(tsDiffTracking.pageId, pageId))
						.orderBy(asc(tsDiffTracking.timestamp))
				);

				if (diffs.length > length) {
					const oldestDiff = diffs[0];

					yield* dbService.execute((db) =>
						db.delete(tsDiffTracking).where(eq(tsDiffTracking.id, oldestDiff.id))
					);
				}
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						Effect.fail(
							new SDKCoreError({
								type: 'LibSQLDatabaseError',
								cause: new StudioCMS_SDK_Error(
									`checkDiffsLengthAndRemoveOldestIfToLong Error: ${cause}`
								),
							})
						),
				})
			);

		const diffTracking = {
			insert: (
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
			) =>
				Effect.gen(function* () {
					const diff = yield* Effect.try({
						try: () =>
							createTwoFilesPatch('Content', 'Content', data.content.start, data.content.end),
						catch: (error) =>
							new SDKCoreError({
								type: 'UNKNOWN',
								cause: new StudioCMS_SDK_Error(
									`diffTracking.insert:createTwoFilesPatch Error: ${error}`
								),
							}),
					});

					yield* checkDiffsLengthAndRemoveOldestIfToLong(pageId, diffLength);

					const inputted = yield* dbService.execute((db) =>
						db
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
							.get()
					);

					return yield* parseService.fixDiff(inputted);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`diffTracking.insert Error: ${cause}`),
								})
							),
					})
				),
			clear: (pageId: string) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, pageId))
					);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`diffTracking.clear Error: ${cause}`),
								})
							),
					})
				),
			get: {
				byPageId: {
					all: (pageId: string) =>
						Effect.gen(function* () {
							const items = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsDiffTracking)
									.where(eq(tsDiffTracking.pageId, pageId))
									.orderBy(desc(tsDiffTracking.timestamp))
							);

							return yield* parseService.fixDiff(items);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`diffTracking.get.byPageId.all Error: ${cause}`
											),
										})
									),
							})
						),
					latest: (pageId: string, count: number) =>
						Effect.gen(function* () {
							const items = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsDiffTracking)
									.where(eq(tsDiffTracking.pageId, pageId))
									.orderBy(desc(tsDiffTracking.timestamp))
							);

							const split = items.slice(0, count);

							return yield* parseService.fixDiff(split);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`diffTracking.get.byPageId.latest Error: ${cause}`
											),
										})
									),
							})
						),
				},
				byUserId: {
					all: (userId: string) =>
						Effect.gen(function* () {
							const items = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsDiffTracking)
									.where(eq(tsDiffTracking.userId, userId))
									.orderBy(desc(tsDiffTracking.timestamp))
							);

							return yield* parseService.fixDiff(items);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`diffTracking.get.byUserId.all Error: ${cause}`
											),
										})
									),
							})
						),
					latest: (userId: string, count: number) =>
						Effect.gen(function* () {
							const items = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsDiffTracking)
									.where(eq(tsDiffTracking.userId, userId))
									.orderBy(desc(tsDiffTracking.timestamp))
							);

							const split = items.slice(0, count);

							return parseService.fixDiff(split);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`diffTracking.get.byUserId.latest Error: ${cause}`
											),
										})
									),
							})
						),
				},
				single: (id: string) =>
					Effect.gen(function* () {
						const data = yield* dbService.execute((db) =>
							db.select().from(tsDiffTracking).where(eq(tsDiffTracking.id, id)).get()
						);
						if (!data) return;
						return yield* parseService.fixDiff(data);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`diffTracking.get.single Error: ${cause}`),
									})
								),
						})
					),
			},
			revertToDiff: (id: string, type: 'content' | 'data' | 'both') =>
				Effect.gen(function* () {
					const diffEntry = yield* dbService.execute((db) =>
						db.select().from(tsDiffTracking).where(eq(tsDiffTracking.id, id)).get()
					);

					if (!diffEntry) {
						return yield* Effect.fail(
							new SDKCoreError({
								type: 'UNKNOWN',
								cause: new StudioCMS_SDK_Error('Diff not found'),
							})
						);
					}

					const shouldRevertData = type === 'data' || type === 'both';
					const shouldRevertContent = type === 'content' || type === 'both';

					if (shouldRevertData) {
						const pageData = yield* Effect.try(() => JSON.parse(diffEntry.pageMetaData as string));

						yield* dbService.execute((db) =>
							db.update(tsPageData).set(pageData.start).where(eq(tsPageData.id, pageData.end.id))
						);
					}

					if (shouldRevertContent) {
						yield* dbService.execute((db) =>
							db
								.update(tsPageContent)
								.set({ content: diffEntry.pageContentStart })
								.where(eq(tsPageContent.contentId, diffEntry.pageId))
						);
					}

					const allDiffs = yield* dbService.execute((db) =>
						db
							.select()
							.from(tsDiffTracking)
							.where(eq(tsDiffTracking.pageId, diffEntry.pageId))
							.orderBy(desc(tsDiffTracking.timestamp))
					);

					const diffIndex = allDiffs.findIndex((diff) => diff.id === id);

					const diffsToPurge = allDiffs.slice(diffIndex + 1);

					const purgeDiff = dbService.makeQuery((ex, id: string) =>
						ex((db) => db.delete(tsDiffTracking).where(eq(tsDiffTracking.id, id)))
					);

					for (const { id } of diffsToPurge) {
						yield* purgeDiff(id);
					}

					return yield* parseService.fixDiff(diffEntry);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`diffTracking.revertToDiff Error: ${cause}`),
								})
							),
						UnknownException: (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'UNKNOWN',
									cause: new StudioCMS_SDK_Error(`diffTracking.revertToDiff Error: ${cause}`),
								})
							),
					})
				),
			utils: {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				getMetaDataDifferences: <T extends Record<string, any>>(obj1: T, obj2: T) =>
					Effect.gen(function* () {
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

						const processLabel = (label: string) =>
							Effect.try(() => (Labels[label] ? Labels[label] : label));

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
										label: yield* processLabel(label),
										previous: obj1[label],
										current: obj2[label],
									});
								}
							}
						}

						return differences;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'UNKNOWN',
										cause: new StudioCMS_SDK_Error(
											`diffTracking.utils.getMetaDataDifferences Error: ${cause}`
										),
									})
								),
						})
					),
				getDiffHTML: (diff: string | null, options?: Diff2HtmlConfig) =>
					Effect.try({
						try: () =>
							html(diff || '', {
								diffStyle: 'word',
								matching: 'lines',
								drawFileList: false,
								outputFormat: 'side-by-side',
								...options,
							}),
						catch: (cause) =>
							new SDKCoreError({
								type: 'UNKNOWN',
								cause: new StudioCMS_SDK_Error(`diffTracking.utils.getDiffHTML Error: ${cause}`),
							}),
					}),
			},
		};

		const notificationSettings = {
			site: {
				get: () =>
					Effect.gen(function* () {
						const data = yield* dbService.execute((db) =>
							db
								.select()
								.from(tsNotificationSettings)
								.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
								.get()
						);

						if (!data) {
							return yield* dbService.execute((db) =>
								db
									.insert(tsNotificationSettings)
									.values(NotificationSettingsDefaults)
									.returning()
									.get()
							);
						}

						return data;
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`notificationSettings.site.get Error: ${cause}`),
									})
								),
						})
					),
				update: dbService.makeQuery((ex, settings: tsNotificationSettingsInsert) =>
					ex((db) =>
						db
							.update(tsNotificationSettings)
							.set(settings)
							.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
							.returning()
							.get()
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(
											`notificationSettings.site.update Error: ${cause}`
										),
									})
								),
						})
					)
				),
			},
		};

		return {
			db,
			dbService,
			getFullPath,
			findNodeByPath,
			findNodesAlongPath,
			findNodesAlongPathToId,
			findNodeById,
			addPageToFolderTree,
			generateRandomIDNumber,
			generateRandomPassword,
			generateToken,
			testToken,
			parseIdNumberArray,
			parseIdStringArray,
			combineRanks,
			verifyRank,
			buildFolderTree,
			getAvailableFolders,
			clearUserReferences,
			collectCategories,
			collectTags,
			collectPageData,
			collectUserData,
			resetTokenBucket,
			diffTracking,
			notificationSettings,
		};
	}),
	dependencies: [
		AstroDB.Default,
		SDKCore_FolderTree.Default,
		SDKCore_Generators.Default,
		SDKCore_Parsers.Default,
		SDKCore_Users.Default,
		SDKCore_Collectors.Default,
	],
}) {}

/**
 * Test Effect for testing how SDKCore is shaped
 */
const testProgram = Effect.gen(function* () {
	const sdkC = yield* SDKCore;
	return sdkC;
}).pipe(Effect.provide(SDKCore.Default));

// const program = await convertToVanilla(testProgram, true);
