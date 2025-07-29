import { asc, desc, eq, inArray } from 'astro:db';
import { createTwoFilesPatch } from 'diff';
import { type Diff2HtmlConfig, html } from 'diff2html';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB, SDKCore_Parsers } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { tsDiffTracking, tsPageContent, tsPageData } from '../tables.js';
import type { tsPageDataSelect } from '../types/index.js';

/**
 * Provides diff tracking functionality for StudioCMS SDKCore.
 *
 * This service enables tracking, storing, retrieving, and reverting changes (diffs) made to page content and metadata.
 * It integrates with AstroDB and SDKCore_Parsers, and handles database operations with error management.
 *
 * ## Features
 * - Insert new diffs for page content and metadata.
 * - Limit the number of stored diffs per page, removing the oldest when exceeding the limit.
 * - Clear all diffs for a given page.
 * - Retrieve all or latest diffs by page ID or user ID.
 * - Retrieve a single diff by its ID.
 * - Revert page content and/or metadata to a specific diff, purging newer diffs.
 * - Utility methods for comparing metadata and rendering diffs as HTML.
 *
 * ## Error Handling
 * All database operations are wrapped with error handling, returning `SDKCoreError` on failure.
 *
 * ## Dependencies
 * - AstroDB.Default
 * - SDKCore_Parsers.Default
 *
 * ## Methods
 * - `insert(userId, pageId, data, diffLength)`: Inserts a new diff entry.
 * - `clear(pageId)`: Removes all diffs for a page.
 * - `get.byPageId.all(pageId)`: Gets all diffs for a page.
 * - `get.byPageId.latest(pageId, count)`: Gets the latest N diffs for a page.
 * - `get.byUserId.all(userId)`: Gets all diffs created by a user.
 * - `get.byUserId.latest(userId, count)`: Gets the latest N diffs by a user.
 * - `get.single(id)`: Gets a single diff by ID.
 * - `revertToDiff(id, type)`: Reverts page content and/or metadata to a specific diff and purges newer diffs.
 * - `utils.getMetaDataDifferences(obj1, obj2)`: Compares two metadata objects and returns their differences.
 * - `utils.getDiffHTML(diff, options)`: Renders a diff string as HTML.
 *
 * @remarks
 * This service is intended for internal use within the StudioCMS SDKCore and relies on Drizzle ORM for database operations.
 */
export class SDKCore_DiffTracking extends Effect.Service<SDKCore_DiffTracking>()(
	'studiocms/sdk/SDKCore/modules/diffTracking',
	{
		dependencies: [AstroDB.Default, SDKCore_Parsers.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/diffTracking/effect')(function* () {
			const [dbService, { fixDiff }] = yield* Effect.all([AstroDB, SDKCore_Parsers]);

			/**
			 * Checks the number of diff records for a given page and removes the oldest one if the count exceeds the specified length.
			 *
			 * @param pageId - The unique identifier of the page whose diffs are being checked.
			 * @param length - The maximum allowed number of diff records for the page.
			 * @returns An Effect that completes when the operation is done, or fails with an SDKCoreError if a database error occurs.
			 *
			 * @throws SDKCoreError - If a LibSQL database error occurs during the operation.
			 */
			const checkDiffsLengthAndRemoveOldestIfTooLong = (
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
										`checkDiffsLengthAndRemoveOldestIfTooLong Error: ${cause}`
									),
								})
							),
					})
				);

			const diffTracking = {
				/**
				 * Inserts a new diff entry for a page.
				 * @param userId - The ID of the user who made the changes.
				 * @param pageId - The ID of the page being modified.
				 * @param data - The content and metadata before and after the change.
				 * @param diffLength - The maximum number of diffs to keep for the page.
				 * @returns An Effect that resolves to the fixed diff entry.
				 * @throws {SDKCoreError} If an error occurs during the database operations.
				 * @throws {LibSQLDatabaseError} If an error occurs during the database operations.
				 */
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

						yield* checkDiffsLengthAndRemoveOldestIfTooLong(pageId, diffLength);

						const inputted = yield* dbService.execute((db) =>
							db
								.insert(tsDiffTracking)
								.values({
									// @ts-expect-error Drizzle... removed this from the type?
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

						return yield* fixDiff(inputted);
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

				/**
				 * Clears all diffs for a page.
				 * @param pageId - The ID of the page to clear diffs for.
				 * @returns An Effect that resolves to void.
				 * @throws {SDKCoreError} If an error occurs during the database operations.
				 * @throws {LibSQLDatabaseError} If an error occurs during the database operations.
				 */
				clear: (pageId: string) =>
					dbService
						.execute((db) => db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, pageId)))
						.pipe(
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
						/**
						 * Retrieves all diffs for a page.
						 * @param pageId - The ID of the page to retrieve diffs for.
						 * @returns An Effect that resolves to the fixed diff entries.
						 * @throws {SDKCoreError} If an error occurs during the database operations.
						 * @throws {LibSQLDatabaseError} If an error occurs during the database operations.
						 */
						all: (pageId: string) =>
							Effect.gen(function* () {
								const items = yield* dbService.execute((db) =>
									db
										.select()
										.from(tsDiffTracking)
										.where(eq(tsDiffTracking.pageId, pageId))
										.orderBy(desc(tsDiffTracking.timestamp))
								);

								return yield* fixDiff(items);
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

						/**
						 * Retrieves the latest N diffs for a page.
						 * @param pageId - The ID of the page to retrieve diffs for.
						 * @param count - The number of latest diffs to retrieve.
						 * @returns An Effect that resolves to the fixed diff entries.
						 * @throws {SDKCoreError} If an error occurs during the database operations.
						 * @throws {LibSQLDatabaseError} If an error occurs during the database operations.
						 */
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

								return yield* fixDiff(split);
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
						/**
						 * Retrieves all diffs created by a user.
						 * @param userId - The ID of the user whose diffs to retrieve.
						 * @returns An Effect that resolves to the fixed diff entries.
						 * @throws {SDKCoreError} If an error occurs during the database operations.
						 * @throws {LibSQLDatabaseError} If an error occurs during the database operations.
						 */
						all: (userId: string) =>
							Effect.gen(function* () {
								const items = yield* dbService.execute((db) =>
									db
										.select()
										.from(tsDiffTracking)
										.where(eq(tsDiffTracking.userId, userId))
										.orderBy(desc(tsDiffTracking.timestamp))
								);

								return yield* fixDiff(items);
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

						/**
						 * Retrieves the latest N diffs created by a user.
						 * @param userId - The ID of the user whose diffs to retrieve.
						 * @param count - The number of latest diffs to retrieve.
						 * @returns An Effect that resolves to the fixed diff entries.
						 * @throws {SDKCoreError} If an error occurs during the database operations.
						 * @throws {LibSQLDatabaseError} If an error occurs during the database operations.
						 */
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

								return yield* fixDiff(split);
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

					/**
					 * Retrieves a single diff entry by its ID.
					 * @param id - The ID of the diff entry to retrieve.
					 * @returns An Effect that resolves to the fixed diff entry.
					 * @throws {SDKCoreError} If the diff entry is not found.
					 * @throws {LibSQLDatabaseError} If an error occurs during the database operations.
					 */
					single: (id: string) =>
						Effect.gen(function* () {
							const data = yield* dbService.execute((db) =>
								db.select().from(tsDiffTracking).where(eq(tsDiffTracking.id, id)).get()
							);
							if (!data) return;
							return yield* fixDiff(data);
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

				/**
				 * Reverts page content and/or metadata to a specific diff and purges newer diffs.
				 * @param id - The ID of the diff to revert to.
				 * @param type - The type of data to revert: 'content', 'data', or 'both'.
				 * @returns An Effect that resolves to the fixed diff entry after the revert.
				 * @throws {SDKCoreError} If the diff entry is not found or if the JSON in `pageMetaData` is invalid.
				 * @throws {LibSQLDatabaseError} If an error occurs during the database operations.
				 */
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
							const pageData = yield* Effect.try({
								try: () => JSON.parse(diffEntry.pageMetaData as string),
								catch: (error) =>
									new SDKCoreError({
										type: 'UNKNOWN',
										cause: new StudioCMS_SDK_Error(`Invalid JSON in pageMetaData: ${error}`),
									}),
							});

							// Validate required fields exist
							if (!pageData.end?.id || !pageData.start) {
								return yield* Effect.fail(
									new SDKCoreError({
										type: 'UNKNOWN',
										cause: new StudioCMS_SDK_Error('Invalid pageData structure in diff entry'),
									})
								);
							}

							yield* dbService.execute((db) =>
								db.update(tsPageData).set(pageData.start).where(eq(tsPageData.id, pageData.end.id))
							);
						}

						if (shouldRevertContent) {
							yield* dbService.execute((db) =>
								db
									.update(tsPageContent)
									// @ts-expect-error Drizzle... removed this from the type?
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

						if (diffsToPurge.length > 0) {
							const idsToDelete = diffsToPurge.map((diff) => diff.id);
							yield* dbService.execute((db) =>
								db
									.delete(tsDiffTracking)
									.where(
										idsToDelete.length === 1
											? eq(tsDiffTracking.id, idsToDelete[0])
											: inArray(tsDiffTracking.id, idsToDelete)
									)
							);
						}

						return yield* fixDiff(diffEntry);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`diffTracking.revertToDiff Error: ${cause}`),
									})
								),
						})
					),
				utils: {
					/**
					 * Compares two metadata objects and returns their differences.
					 * @param obj1 - The first metadata object to compare.
					 * @param obj2 - The second metadata object to compare.
					 * @returns An Effect that resolves to an array of differences.
					 * @throws {UnknownException} If an error occurs during the comparison process.
					 */
					getMetaDataDifferences: <T extends Record<string, unknown>>(obj1: T, obj2: T) =>
						Effect.gen(function* () {
							const differences: { label: string; previous: unknown; current: unknown }[] = [];

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

								if (Object.hasOwn(obj1, label) && Object.hasOwn(obj2, label)) {
									if (obj1[label] !== obj2[label]) {
										if (Array.isArray(obj1[label]) && Array.isArray(obj2[label])) {
											// Deep comparison for arrays
											const arr1 = obj1[label] as unknown[];
											const arr2 = obj2[label] as unknown[];
											if (
												arr1.length === arr2.length &&
												arr1.every((val, index) => val === arr2[index])
											)
												continue;
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

					/**
					 * Converts a diff string into HTML format.
					 * @param diff - The diff string to convert.
					 * @param options - Optional configuration for the HTML output.
					 * @returns An Effect that resolves to the HTML representation of the diff.
					 * @throws {UnknownException} If an error occurs during the conversion process.
					 */
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

			return diffTracking;
		}),
	}
) {}
