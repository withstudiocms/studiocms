import { Data, Effect, Schema } from '@withstudiocms/effect';
import { StudioCMSDiffTracking, StudioCMSPageData } from '@withstudiocms/kysely';
import { DBClientLive } from '../../context.js';
import { createTwoFilesPatch, diffHTML } from '../../lib/diff.js';
import type { diffItem, diffReturn, tsPageDataSelect } from '../../types.js';
import { SDKParsers } from '../util/parsers.js';

/**
 * DiffTrackingError
 *
 * Represents an error specific to the Diff Tracking module.
 *
 * This error extends from `Data.TaggedError` with the tag `'DiffTrackingError'`
 * and includes a `message` property to provide additional context about the issue.
 *
 * @example
 * ```typescript
 * throw new DiffTrackingError({ message: 'Diff entry not found' });
 * ```
 *
 * @property message - A descriptive message providing context about the error.
 */
export class DiffTrackingError extends Data.TaggedError('DiffTrackingError')<{ message: string }> {}

/**
 * SDKDiffTrackingModule
 *
 * Effect-based module that provides diff-tracking persistence and utilities for StudioCMS pages.
 *
 * Overview
 * - Exposes a diffTracking API for creating, querying, reverting and clearing page diffs.
 * - Built on top of an Effect runtime and a database client layer with schema codecs/encoders.
 * - Uses unified diffs (created via createTwoFilesPatch), persists them to the StudioCMSDiffTracking table,
 *   and post-processes records with a `fixDiff` parser to attach parsed metadata/structures.
 *
 * Public API (returned object)
 * - insert(userId, pageId, data, diffLength): Effect
 *   Creates a unified diff between data.content.start and data.content.end, persists a new diff record,
 *   enforces a maximum number of diffs per page (diffLength) by removing oldest entries, and returns
 *   the stored diff record after parsing (via fixDiff).
 *
 * - clear(pageId): Effect
 *   Deletes all diff tracking records for the provided pageId.
 *
 * - get
 *   - byPageId.all(pageId): Effect
 *     Returns all diffs for the page (ordered by timestamp ascending) with parsed metadata.
 *   - byPageId.latest(pageId, count): Effect
 *     Returns the latest `count` diffs for the page (after parsing).
 *   - byUserId.all(userId): Effect
 *     Returns all diffs authored by the user with parsed metadata.
 *   - byUserId.latest(userId, count): Effect
 *     Returns the latest `count` diffs authored by the user.
 *   - single(diffId): Effect
 *     Returns a single diff by id with parsed metadata, or undefined if not found.
 *
 * - revertToDiff(id, type): Effect
 *   Reverts a page to the state represented by the diff with the given id. `type` controls what is reverted:
 *   'content' | 'data' | 'both'.
 *   Behavior:
 *     - Validates that the diff entry exists; fails with DiffTrackingError if not found.
 *     - When reverting data, decodes/encodes page metadata with configured schemas and updates StudioCMSPageData.
 *       If required IDs are missing in metadata, fails with DiffTrackingError.
 *     - When reverting content, writes the saved pageContentStart back to StudioCMSPageContent.
 *     - Deletes all diffs that were created after the reverted diff to preserve a linear history.
 *     - Returns the reverted diff entry after parsing.
 *
 * - utils
 *   - getMetaDataDifferences(obj1, obj2): Effect
 *     Compares two metadata objects and returns an array of differences:
 *     { label: string, previous: unknown, current: unknown }.
 *     Ignores a small set of blacklisted fields (publishedAt, updatedAt, authorId, contributorIds),
 *     maps known metadata keys to friendly labels, and performs array-aware comparison to avoid
 *     spurious diffs for deeply-equal arrays.
 *   - getDiffHTML(diff: string): string
 *     Converts a unified diff string into an HTML representation for display.
 *
 * Implementation notes
 * - Database interactions use withCodec/withEncoder wrappers to validate/encode inputs and decode outputs.
 * - insert generates a new UUID for the diff id using crypto.randomUUID().
 * - Query ordering for lists is ascending by timestamp; "latest" helpers slice results accordingly.
 * - All public functions return Effect-based values; callers must run/interpret these via the project's Effect runtime.
 *
 * Error handling
 * - Domain errors (e.g. missing diff entry or invalid metadata for revert) are signaled with DiffTrackingError.
 * - Database errors and codec/schema errors are propagated as failures of the returned Effects.
 *
 * Concurrency and retention
 * - insert enforces retention by deleting the oldest diffs when the per-page count would exceed diffLength.
 * - revertToDiff prunes any diffs that occurred after the reverted entry to maintain a consistent history.
 */
export const SDKDiffTrackingModule = Effect.gen(function* () {
	const [{ withCodec, withEncoder }, { fixDiff }] = yield* Effect.all([DBClientLive, SDKParsers]);

	// ==================================================
	// DB Operations
	// ==================================================

	/**
	 * Selects all diff tracking records for a given page ID, ordered by timestamp ascending.
	 *
	 * @param pageId - The ID of the page to retrieve diff tracking records for.
	 * @returns An array of `StudioCMSDiffTracking.Select` records associated with the specified page ID.
	 */
	const _selectDiffByPageId = withCodec({
		encoder: Schema.String,
		decoder: Schema.Array(StudioCMSDiffTracking.Select),
		callbackFn: (db, pageId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSDiffTracking')
					.selectAll()
					.where('pageId', '=', pageId)
					.orderBy('timestamp', 'asc')
					.execute()
			),
	});

	/**
	 * Selects all diff tracking records for a given user ID, ordered by timestamp ascending.
	 *
	 * @param userId - The ID of the user to retrieve diff tracking records for.
	 * @returns An array of `StudioCMSDiffTracking.Select` records associated with the specified user ID.
	 */
	const _selectDiffByUserId = withCodec({
		encoder: Schema.String,
		decoder: Schema.Array(StudioCMSDiffTracking.Select),
		callbackFn: (db, userId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSDiffTracking')
					.selectAll()
					.where('userId', '=', userId)
					.orderBy('timestamp', 'asc')
					.execute()
			),
	});

	/**
	 * Selects a diff tracking record by its ID.
	 *
	 * @param diffId - The ID of the diff tracking record to retrieve.
	 * @returns The `StudioCMSDiffTracking.Select` record associated with the specified ID, or undefined if not found.
	 */
	const _selectDiffById = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSDiffTracking.Select),
		callbackFn: (db, diffId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSDiffTracking')
					.selectAll()
					.where('id', '=', diffId)
					.executeTakeFirst()
			),
	});

	/**
	 * Deletes a diff tracking record by its ID.
	 *
	 * @param diffId - The ID of the diff tracking record to delete.
	 * @returns The number of rows affected by the delete operation.
	 */
	const _deleteDiffById = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, diffId) =>
			db((client) => client.deleteFrom('StudioCMSDiffTracking').where('id', '=', diffId).execute()),
	});

	/**
	 * Inserts a new diff tracking record into the database.
	 *
	 * @param diff - The diff tracking record to insert.
	 * @returns The inserted `StudioCMSDiffTracking.Select` record.
	 */
	const _insertNewDiff = withCodec({
		encoder: StudioCMSDiffTracking.Insert,
		decoder: StudioCMSDiffTracking.Select,
		callbackFn: (db, diff) =>
			db((client) =>
				client
					.insertInto('StudioCMSDiffTracking')
					.values(diff)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Clears all diff tracking records for a given page ID.
	 *
	 * @param pageId - The ID of the page to clear diff tracking records for.
	 * @returns The number of rows affected by the delete operation.
	 */
	const clearPageDiffs = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, pageId) =>
			db((client) =>
				client.deleteFrom('StudioCMSDiffTracking').where('pageId', '=', pageId).execute()
			),
	});

	/**
	 * Updates the page metadata for a given diff tracking record.
	 *
	 * @param data - An object containing the ID of the diff tracking record and the new page metadata.
	 * @returns The number of rows affected by the update operation.
	 */
	const _setPageData = withEncoder({
		encoder: StudioCMSPageData.Update,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.updateTable('StudioCMSPageData')
					.set(data)
					.where('id', '=', data.id as string)
					.execute()
			),
	});

	/**
	 * Updates the page content for a given diff tracking record.
	 *
	 * @param data - An object containing the ID of the diff tracking record and the new page content.
	 * @returns The number of rows affected by the update operation.
	 */
	const _setPageContent = withEncoder({
		encoder: Schema.Struct({
			contentId: Schema.String,
			content: Schema.String,
		}),
		callbackFn: (db, data) =>
			db((client) =>
				client
					.updateTable('StudioCMSPageContent')
					.set({ content: data.content })
					.where('contentId', '=', data.contentId as string)
					.execute()
			),
	});

	// ==================================================
	// Helpers
	// ==================================================

	/**
	 * Checks the number of diffs for a given page ID and removes the oldest diffs
	 * if the count exceeds the specified maximum.
	 */
	const _checkDiffsLengthAndRemoveOldestIfTooLong = Effect.fn(function* (
		pageId: string,
		maxDiffs: number
	) {
		const diffs = yield* _selectDiffByPageId(pageId);
		if (diffs.length > maxDiffs) {
			// Delete oldest diffs until we are within the limit
			const diffsToDelete = diffs.length - maxDiffs;
			for (let i = 0; i < diffsToDelete; i++) {
				const oldestDiff = diffs[i];
				yield* _deleteDiffById(oldestDiff.id);
			}
		}
	});

	// ==================================================
	// Main Diff Modules
	// ==================================================

	/**
	 * Inserts a new diff tracking record into the database after creating a unified diff
	 * between the start and end content. It also ensures that the number of stored diffs
	 * does not exceed the specified limit.
	 */
	const _insert = Effect.fn(
		(
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
			createTwoFilesPatch((patch) =>
				patch('Content', 'Content', data.content.start, data.content.end)
			).pipe(
				Effect.tap(() => _checkDiffsLengthAndRemoveOldestIfTooLong(pageId, diffLength)),
				Effect.flatMap((diff) =>
					_insertNewDiff({
						id: crypto.randomUUID(),
						pageId,
						userId,
						diff,
						pageContentStart: data.content.start,
						pageMetaData: JSON.stringify(data.metaData),
						timestamp: new Date().toISOString(),
					})
				),
				Effect.flatMap((insertedDiff) => fixDiff(insertedDiff as diffItem))
			)
	);

	/**
	 * Retrieves all diff tracking records for a given page ID, with parsed metadata.
	 *
	 * @param pageId - The ID of the page to retrieve diff tracking records for.
	 * @returns An array of diff tracking records with parsed metadata.
	 */
	const _getByPageIdAll = Effect.fn((pageId: string) =>
		_selectDiffByPageId(pageId).pipe(Effect.flatMap((diffs) => fixDiff(diffs as diffItem[])))
	);

	/**
	 * Retrieves the latest `count` diff tracking records for a given page ID, with parsed metadata.
	 *
	 * @param pageId - The ID of the page to retrieve diff tracking records for.
	 * @param count - The number of latest diff tracking records to retrieve.
	 * @returns An array of the latest diff tracking records with parsed metadata.
	 */
	const _getByPageIdLatest = Effect.fn((pageId: string, count: number) =>
		_getByPageIdAll(pageId).pipe(Effect.map((diffs) => diffs.slice(0, count)))
	);

	/**
	 * Retrieves all diff tracking records for a given user ID, with parsed metadata.
	 *
	 * @param userId - The ID of the user to retrieve diff tracking records for.
	 * @returns An array of diff tracking records with parsed metadata.
	 */
	const _getByUserIdAll = Effect.fn((userId: string) =>
		_selectDiffByUserId(userId).pipe(Effect.flatMap((diffs) => fixDiff(diffs as diffItem[])))
	);

	/**
	 * Retrieves the latest `count` diff tracking records for a given user ID, with parsed metadata.
	 *
	 * @param userId - The ID of the user to retrieve diff tracking records for.
	 * @param count - The number of latest diff tracking records to retrieve.
	 * @returns An array of the latest diff tracking records with parsed metadata.
	 */
	const _getByUserIdLatest = Effect.fn((userId: string, count: number) =>
		_getByUserIdAll(userId).pipe(Effect.map((diffs) => diffs.slice(0, count)))
	);

	/**
	 * Retrieves a single diff tracking record by its ID, with parsed metadata.
	 *
	 * @param diffId - The ID of the diff tracking record to retrieve.
	 * @returns The diff tracking record with parsed metadata, or undefined if not found.
	 */
	const _getSingleDiffById = Effect.fn((diffId: string) =>
		_selectDiffById(diffId).pipe(
			Effect.flatMap((diffOrNull) =>
				diffOrNull ? fixDiff(diffOrNull as diffItem) : Effect.succeed(undefined)
			)
		)
	);

	/**
	 * Reverts a diff tracking record to a previous state.
	 *
	 * @param id - The ID of the diff tracking record to revert.
	 * @param type - The type of revert to perform (content, data, or both).
	 * @returns The reverted diff tracking record with parsed metadata.
	 */
	const _revertToDiff = Effect.fn(function* (id: string, type: 'content' | 'data' | 'both') {
		// Get the diff entry by ID
		const diffEntry = yield* _selectDiffById(id);

		// If not found, fail with an error
		if (!diffEntry) {
			return yield* Effect.fail(new DiffTrackingError({ message: 'Diff entry not found' }));
		}

		// Determine what to revert based on the type
		const shouldRevertData = type === 'data' || type === 'both';
		const shouldRevertContent = type === 'content' || type === 'both';

		// Revert the content if needed
		if (shouldRevertData) {
			// Parse the page metadata
			const pageData = diffEntry.pageMetaData as diffReturn['pageMetaData'];

			// Ensure valid IDs are present
			if (!pageData.end.id || !pageData.start.id) {
				return yield* Effect.fail(
					new DiffTrackingError({ message: 'Invalid page metadata for revert' })
				);
			}

			// Update the page data to the start state
			yield* Schema.encode(StudioCMSPageData.Select)(pageData.start).pipe(
				Effect.flatMap(Schema.decode(StudioCMSPageData.Update)),
				Effect.flatMap(_setPageData)
			);
		}

		// Revert the content if needed
		if (shouldRevertContent) {
			yield* _setPageContent({
				content: diffEntry.pageContentStart,
				contentId: diffEntry.pageId,
			});
		}

		// Get all diffs for the page to determine which diffs to delete
		const allDiffs = yield* _selectDiffByPageId(diffEntry.pageId);

		// Find the index of the current diff
		const diffIndex = allDiffs.findIndex((d) => d.id === id);

		// Delete all diffs that came after this one
		for (let i = diffIndex + 1; i < allDiffs.length; i++) {
			const diffToDelete = allDiffs[i];
			yield* _deleteDiffById(diffToDelete.id);
		}

		// Return the reverted diff entry with parsed metadata
		return yield* fixDiff(diffEntry as diffItem);
	});

	/**
	 * Compares two metadata objects and returns the differences.
	 *
	 * @param obj1 - The first metadata object to compare.
	 * @param obj2 - The second metadata object to compare.
	 * @returns An array of differences, each containing the label, previous value, and current value.
	 */
	const _getMetaDataDifferences = Effect.fn(function* <T extends Record<string, unknown>>(
		obj1: T,
		obj2: T
	) {
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
			Effect.sync(() => (Labels[label] ? Labels[label] : label));

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
						if (arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index]))
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
	});

	return {
		/**
		 * Inserts a new diff tracking record into the database.
		 *
		 * @param userId - The ID of the user making the change.
		 * @param pageId - The ID of the page being changed.
		 * @param data - An object containing the start and end content and metadata.
		 * @param diffLength - The maximum number of diffs to retain for the page.
		 * @returns The inserted diff tracking record with parsed metadata.
		 */
		insert: _insert,

		/**
		 * Clears all diff tracking records for a given page ID.
		 *
		 * @param pageId - The ID of the page to clear diff tracking records for.
		 * @returns The number of rows affected by the delete operation.
		 */
		clear: clearPageDiffs,

		/**
		 * Utility functions for retrieving diff tracking records.
		 */
		get: {
			/**
			 * Retrieves all diff tracking records for a given page ID.
			 */
			byPageId: {
				/**
				 * Retrieves all diff tracking records for a given page ID.
				 */
				all: _getByPageIdAll,

				/**
				 * Retrieves the latest `count` diff tracking records for a given page ID.
				 */
				latest: _getByPageIdLatest,
			},

			/**
			 * Retrieves all diff tracking records for a given user ID.
			 */
			byUserId: {
				/**
				 * Retrieves all diff tracking records for a given user ID.
				 */
				all: _getByUserIdAll,

				/**
				 * Retrieves the latest `count` diff tracking records for a given user ID.
				 */
				latest: _getByUserIdLatest,
			},

			/**
			 * Retrieves a single diff tracking record by its ID.
			 */
			single: _getSingleDiffById,
		},

		/**
		 * Reverts the page data and/or content to the state represented by the specified diff ID.
		 *
		 * @param id - The ID of the diff tracking record to revert to.
		 * @param type - The type of revert operation: 'content', 'data', or 'both'.
		 * @returns The reverted diff tracking record with parsed metadata.
		 */
		revertToDiff: _revertToDiff,

		/**
		 * Utility functions for diff tracking.
		 */
		utils: {
			/**
			 * Compares two metadata objects and returns the differences.
			 *
			 * @param obj1 - The first metadata object to compare.
			 * @param obj2 - The second metadata object to compare.
			 * @returns An array of differences, each containing the label, previous value, and current value.
			 */
			getMetaDataDifferences: _getMetaDataDifferences,

			/**
			 * Generates the HTML representation of a unified diff string.
			 *
			 * @param diff - The unified diff string to convert to HTML.
			 * @returns The HTML representation of the diff.
			 */
			getDiffHTML: diffHTML,
		},
	};
});

export default SDKDiffTrackingModule;
