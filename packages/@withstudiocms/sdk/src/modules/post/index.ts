import { Effect, pipe, Schema } from '@withstudiocms/effect';
import { DBCallbackFailure } from '@withstudiocms/kysely/client';
import CacheService from '../../cache.js';
import { cacheTags } from '../../consts.js';
import { DBClientLive } from '../../context.js';
import {
	StudioCMSDiffTracking,
	StudioCMSPageContent,
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPageFolderStructure,
	StudioCMSPermissions,
} from '../../tables.js';
import type { CombinedInsertContent, tsPageDataCategories, tsPageDataTags } from '../../types.js';
import SDKClearModule from '../clear/index.js';
import SDKGetModule from '../get/index.js';
import SDKUpdateModule from '../update/index.js';
import { SDKGenerators } from '../util/generators.js';

/**
 * Represents the data required to insert a new page.
 */
export interface PageInsert {
	pageData: OptionalId<string, (typeof StudioCMSPageData)['Insert']['Type']>;
	pageContent: CombinedInsertContent;
}

/**
 * Represents an array of PageInsert objects.
 */
export type MultiPageInsert = PageInsert[];

/**
 * Utility type to make the 'id' property optional in a given type T.
 *
 * @template IDType - The type of the 'id' property.
 * @template T - The original type containing the 'id' property.
 */
export type OptionalId<IDType, T> = Omit<T, 'id'> & { id?: IDType };

/**
 * Error class representing an existing permission for a user.
 */
export class PermissionExistsError {
	readonly _tag = 'PermissionExistsError';
}

/**
 * SDKPostModule
 *
 * Effect generator that builds and returns the post/page-related SDK surface for database
 * insert operations and related helpers. This module wires together database client and
 * auxiliary services (clear/update/get/generator/cache) and exposes both single- and
 * batch-oriented insertion APIs plus higher-level "main" operations that also trigger
 * cache invalidation and UI updates.
 *
 * Remarks
 * - The generator yields the following dependencies: DBClientLive, SDKClearModule,
 *   SDKUpdateModule, SDKGetModule, SDKGenerators, CacheService.
 * - Low-level DB insert wrappers are created with `withCodec` and perform SQL operations
 *   against tables such as StudioCMSPageData, StudioCMSPageContent, StudioCMSPageDataTags,
 *   StudioCMSPageDataCategories, StudioCMSPermissions, StudioCMSDiffTracking,
 *   StudioCMSPageFolderStructure.
 * - Helpers use Effect primitives (pipe, flatMap, tap, all, catchTag, succeed, fail)
 *   and utilities such as `crypto.randomUUID()` and a numeric id generator
 *   (`generateRandomIDNumber`) to ensure IDs when not provided.
 * - Cache invalidation is performed via `invalidateTags(cacheTags.pages)` and certain
 *   operations also call `clear.*` and `update.*` to refresh derived state such as
 *   folder lists/trees.
 * - Duplicate permission insertion is guarded: attempting to insert a permission for a
 *   user that already exists results in a PermissionExistsError which is mapped to a
 *   DBCallbackFailure with a descriptive message.
 *
 * Exposed API (returned object)
 * - databaseEntry: object containing single-entry insert effects:
 *   - pages(pageData, pageContent): insert a page and its content (returns inserted ids)
 *   - pageContent(data): insert page content entry
 *   - tags(tag): insert a tag (ensures id)
 *   - categories(category): insert a category (ensures id)
 *   - permissions(userId, rank): insert a permission for a user (fails if already exists)
 *   - diffTracking(data): insert diff-tracking entry (ensures id)
 *   - folder(data): insert a folder structure entry (ensures id)
 * - databaseEntries: object containing batch insert effects:
 *   - tags(array): insert multiple tags
 *   - categories(array): insert multiple categories
 *   - permissions(array): insert multiple permissions
 *   - pages(array): insert multiple pages with content
 * - folder: higher-level folder insert that triggers update.folderList and update.folderTree
 * - page: higher-level page insert that clears folder caches, invalidates page cache tags,
 *   and returns the freshly-read page via GET.page.byId
 *
 * Errors
 * - DB operations propagate database-level errors from the SQL client.
 * - Permission insertion collides are translated to DBCallbackFailure with a human-friendly
 *   cause string.
 *
 * Returns
 * - An Effect that, when executed, yields the assembled API object described above.
 */
export const SDKPostModule = Effect.gen(function* () {
	const [{ withCodec }, clear, update, GET, { generateRandomIDNumber }, { invalidateTags }] =
		yield* Effect.all([
			DBClientLive,
			SDKClearModule,
			SDKUpdateModule,
			SDKGetModule,
			SDKGenerators,
			CacheService,
		]);

	// ==============================================
	// DB Operations
	// ==============================================

	/**
	 * Inserts a new page data entry into the database.
	 *
	 * @param data - The page data to be inserted.
	 * @returns An effect that resolves to the ID of the newly inserted page data.
	 */
	const _insertPageData = withCodec({
		encoder: StudioCMSPageData.Insert,
		decoder: Schema.Struct({
			id: Schema.String,
		}),
		callbackFn: (db, data) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx.insertInto('StudioCMSPageData').values(data).executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSPageData')
						.select(['id'])
						.where('id', '=', data.id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	/**
	 * Inserts a new page content entry into the database.
	 *
	 * @param data - The page content data to be inserted.
	 * @returns An effect that resolves to the ID of the newly inserted page content.
	 */
	const _insertPageContent = withCodec({
		encoder: StudioCMSPageContent.Insert,
		decoder: Schema.Struct({
			id: Schema.String,
		}),
		callbackFn: (db, data) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx.insertInto('StudioCMSPageContent').values(data).executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSPageContent')
						.select(['id'])
						.where('id', '=', data.id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	/**
	 * Inserts a new page data tag entry into the database.
	 *
	 * @param data - The page data tag to be inserted.
	 * @returns An effect that resolves to the ID of the newly inserted page data tag.
	 */
	const _insertTagData = withCodec({
		encoder: StudioCMSPageDataTags.Insert,
		decoder: Schema.Struct({
			id: Schema.Number,
		}),
		callbackFn: (db, data) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx.insertInto('StudioCMSPageDataTags').values(data).executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSPageDataTags')
						.select(['id'])
						.where('id', '=', data.id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	/**
	 * Inserts a new page data category entry into the database.
	 *
	 * @param data - The page data category to be inserted.
	 * @returns An effect that resolves to the ID of the newly inserted page data category.
	 */
	const _insertCategoryData = withCodec({
		encoder: StudioCMSPageDataCategories.Insert,
		decoder: Schema.Struct({
			id: Schema.Number,
		}),
		callbackFn: (db, data) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx
						.insertInto('StudioCMSPageDataCategories')
						.values(data)
						.executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSPageDataCategories')
						.select(['id'])
						.where('id', '=', data.id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	/**
	 * Retrieves the permissions for a specific user.
	 *
	 * @param userId - The ID of the user whose permissions are to be retrieved.
	 * @returns An effect that resolves to the user's permissions.
	 */
	const _getUserPermission = withCodec({
		encoder: Schema.String,
		decoder: StudioCMSPermissions.Select,
		callbackFn: (db, userId: string) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPermissions')
					.selectAll()
					.where('user', '=', userId)
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Inserts a new permission entry for a user into the database.
	 *
	 * @param data - The permission data to be inserted.
	 * @returns An effect that resolves to the newly inserted permission entry.
	 */
	const _insertNewUserPermission = withCodec({
		encoder: StudioCMSPermissions.Insert,
		decoder: StudioCMSPermissions.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx.insertInto('StudioCMSPermissions').values(data).executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSPermissions')
						.selectAll()
						.where('user', '=', data.user)
						.executeTakeFirstOrThrow();
				})
			),
	});

	/**
	 * Inserts a new diff tracking entry into the database.
	 *
	 * @param data - The diff tracking data to be inserted.
	 * @returns An effect that resolves to the newly inserted diff tracking entry.
	 */
	const _insertNewDiffTracking = withCodec({
		encoder: StudioCMSDiffTracking.Insert,
		decoder: StudioCMSDiffTracking.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx.insertInto('StudioCMSDiffTracking').values(data).executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSDiffTracking')
						.selectAll()
						.where('id', '=', data.id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	/**
	 * Inserts a new folder structure entry into the database.
	 *
	 * @param data - The folder structure data to be inserted.
	 * @returns An effect that resolves to the newly inserted folder structure entry.
	 */
	const _insertNewFolder = withCodec({
		encoder: StudioCMSPageFolderStructure.Insert,
		decoder: StudioCMSPageFolderStructure.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx
						.insertInto('StudioCMSPageFolderStructure')
						.values(data)
						.executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSPageFolderStructure')
						.selectAll()
						.where('id', '=', data.id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	// ==============================================
	// Helpers
	// ==============================================

	/**
	 * Generate a random UUID string.
	 *
	 * @returns An effect that resolves to a random UUID string.
	 */
	const _randomUUIDString = Effect.fn(() => Effect.succeed(crypto.randomUUID().toString()));

	/**
	 * Picks the ID from the provided page data or generates a new one if not present.
	 *
	 * @param data - The page data which may or may not contain an ID.
	 * @returns An effect that resolves to the page data with an ensured ID.
	 */
	const _pageDataIdOrGenerateUUID = Effect.fn(function* (
		data: OptionalId<string, (typeof StudioCMSPageData)['Insert']['Type']>
	) {
		const id = data.id || (yield* _randomUUIDString());
		return { id, ...data };
	});

	/**
	 * Inserts a new page along with its content into the database.
	 *
	 * @param pageData - The data for the new page, excluding the ID.
	 * @param pageContent - The content for the new page.
	 * @returns An effect that resolves to an object containing the IDs of the newly inserted page data and content.
	 */
	const _insertNewPageWithContent = Effect.fn(
		(
			pageData: OptionalId<string, (typeof StudioCMSPageData)['Insert']['Type']>,
			pageContent: CombinedInsertContent
		) =>
			Effect.all({
				pageData: _pageDataIdOrGenerateUUID(pageData),
				pageContent: Effect.succeed(pageContent),
			}).pipe(
				Effect.flatMap(({ pageData: { id, contentLang, ...basePageData }, pageContent }) =>
					Effect.all({
						pageData: _insertPageData({
							...basePageData,
							id,
							contentLang,
						}),
						pageContent: _insertPageContent({
							id: crypto.randomUUID().toString(),
							contentId: id,
							contentLang: contentLang,
							content: pageContent.content || '',
						}),
					})
				),
				Effect.tap(() => invalidateTags(cacheTags.pages))
			)
	);

	/**
	 * Inserts an array of new pages along with their content into the database.
	 *
	 * @param data - An array of PageInsert objects containing page data and content.
	 * @returns An effect that resolves to an array of objects containing the IDs of the newly inserted page data and content for each page.
	 */
	const _insertPageWithContentArray = Effect.fn((pages: MultiPageInsert) =>
		Effect.all(
			pages.map(({ pageData, pageContent }) => _insertNewPageWithContent(pageData, pageContent))
		)
	);

	/**
	 * Picks the ID from the provided data or generates a new one if not present.
	 *
	 * @param data - The data which may or may not contain an ID.
	 * @returns An effect that resolves to the data with an ensured ID.
	 */
	const _pickIdOrGenerate = Effect.fn(function* <T extends { id?: number }>(
		data: OptionalId<number, T>
	) {
		let id: number;
		if ('id' in data && typeof data.id === 'number' && !Number.isNaN(data.id) && data.id > 0) {
			id = data.id;
		} else {
			id = yield* generateRandomIDNumber(9);
		}
		return { id, ...data };
	});

	/**
	 * Inserts a new tag into the database, ensuring it has an ID.
	 *
	 * @param tag - The tag data to be inserted.
	 * @returns An effect that resolves to the ID of the newly inserted tag.
	 */
	const _insertNewTag = Effect.fn((tag: OptionalId<number, tsPageDataTags['Insert']['Type']>) =>
		_pickIdOrGenerate(tag).pipe(
			Effect.flatMap(_insertTagData),
			Effect.tap(() => invalidateTags(cacheTags.tags))
		)
	);

	/**
	 * Inserts an array of new tags into the database.
	 *
	 * @param tags - The array of tag data to be inserted.
	 * @returns An effect that resolves to an array of IDs of the newly inserted tags.
	 */
	const _insertTagArray = Effect.fn(
		(tags: OptionalId<number, tsPageDataTags['Insert']['Type']>[]) =>
			Effect.all(tags.map((tag) => _insertNewTag(tag)))
	);

	/**
	 * Inserts a new category into the database, ensuring it has an ID.
	 *
	 * @param category - The category data to be inserted.
	 * @returns An effect that resolves to the ID of the newly inserted category.
	 */
	const _insertNewCategory = Effect.fn(
		(category: OptionalId<number, tsPageDataCategories['Insert']['Type']>) =>
			_pickIdOrGenerate(category).pipe(
				Effect.flatMap(_insertCategoryData),
				Effect.tap(() => invalidateTags(cacheTags.categories))
			)
	);

	/**
	 * Inserts an array of new categories into the database.
	 *
	 * @param categories - The array of category data to be inserted.
	 * @returns An effect that resolves to an array of IDs of the newly inserted categories.
	 */
	const _insertCategoryArray = Effect.fn(
		(categories: OptionalId<number, tsPageDataCategories['Insert']['Type']>[]) =>
			Effect.all(categories.map((category) => _insertNewCategory(category)))
	);

	/**
	 * Inserts a new permission entry for a user into the database.
	 *
	 * @param userId - The ID of the user for whom the permission is to be created.
	 * @param rank - The rank of the permission to be assigned.
	 * @returns An effect that resolves to the newly inserted permission entry.
	 */
	const _insertNewPermission = Effect.fn(
		(userId: string, rank: (typeof StudioCMSPermissions.Insert.Type)['rank']) =>
			_getUserPermission(userId).pipe(
				Effect.flatMap((exists) =>
					exists ? Effect.fail(new PermissionExistsError()) : Effect.succeed({ user: userId, rank })
				),
				Effect.flatMap((data) => _insertNewUserPermission(data)),
				Effect.catchTag('PermissionExistsError', () =>
					Effect.fail(
						new DBCallbackFailure({
							cause: 'Permission for user already exists, Please update instead.',
						})
					)
				)
			)
	);

	/**
	 * Inserts an array of new permissions into the database.
	 *
	 * @param permissions - The array of permission data to be inserted.
	 * @returns An effect that resolves to an array of newly inserted permission entries.
	 */
	const _insertPermissionArray = Effect.fn(
		(permissions: { userId: string; rank: (typeof StudioCMSPermissions.Insert.Type)['rank'] }[]) =>
			Effect.all(permissions.map(({ userId, rank }) => _insertNewPermission(userId, rank)))
	);

	/**
	 * Inserts a new diff tracking entry into the database, ensuring it has an ID.
	 *
	 * @param data - The diff tracking data to be inserted.
	 * @returns An effect that resolves to the newly inserted diff tracking entry.
	 */
	const _insertDiffTracking = Effect.fn(
		(data: OptionalId<string, (typeof StudioCMSDiffTracking)['Insert']['Type']>) =>
			pipe(
				data.id
					? Effect.succeed(data as typeof StudioCMSDiffTracking.Insert.Type)
					: _randomUUIDString().pipe(Effect.map((id) => ({ id, ...data }))),
				Effect.flatMap((dataWithId) => _insertNewDiffTracking(dataWithId))
			)
	);

	/**
	 * Inserts a new folder structure entry into the database, ensuring it has an ID.
	 *
	 * @param data - The folder structure data to be inserted.
	 * @returns An effect that resolves to the newly inserted folder structure entry.
	 */
	const _insertFolder = Effect.fn(
		(data: OptionalId<string, (typeof StudioCMSPageFolderStructure)['Insert']['Type']>) =>
			pipe(
				data.id
					? Effect.succeed(data as typeof StudioCMSPageFolderStructure.Insert.Type)
					: _randomUUIDString().pipe(Effect.map((id) => ({ id, ...data }))),
				Effect.flatMap((dataWithId) => _insertNewFolder(dataWithId))
			)
	);

	/**
	 * Inserts a new folder structure entry into the database, ensuring it has an ID.
	 *
	 * @param data - The folder structure data to be inserted.
	 * @returns An effect that resolves to the newly inserted folder structure entry.
	 */
	const _mainInsertFolder = Effect.fn(
		(data: OptionalId<string, (typeof StudioCMSPageFolderStructure)['Insert']['Type']>) =>
			_insertFolder(data).pipe(Effect.tap(() => Effect.all([update.folderList, update.folderTree])))
	);

	/**
	 * Inserts a new page along with its content into the database.
	 *
	 * @param pageData - The data for the new page, excluding the ID.
	 * @param pageContent - The content for the new page.
	 * @returns An effect that resolves to the newly inserted page data.
	 */
	const _mainInsertPage = Effect.fn(
		({
			pageData,
			pageContent,
		}: {
			pageData: OptionalId<string, (typeof StudioCMSPageData)['Insert']['Type']>;
			pageContent: CombinedInsertContent;
		}) =>
			_insertNewPageWithContent(pageData, pageContent).pipe(
				Effect.flatMap(({ pageData: { id } }) => GET.page.byId(id)),
				Effect.tap(() =>
					Effect.all([
						clear.folderList,
						clear.folderTree,
						invalidateTags([
							...cacheTags.pages,
							...cacheTags.pageFolderTree,
							...cacheTags.folderTree,
						]),
					])
				)
			)
	);

	// ==============================================
	// Exposed API
	// ==============================================

	/**
	 * Database entry point for page-related operations.
	 */
	const databaseEntry = {
		/**
		 * Inserts a new page along with its content into the database.
		 *
		 * @param pageData - The data for the new page, excluding the ID.
		 * @param pageContent - The content for the new page.
		 * @returns An effect that resolves to an object containing the IDs of the newly inserted page data and content.
		 */
		pages: _insertNewPageWithContent,

		/**
		 * Inserts a new page content entry into the database.
		 *
		 * @param data - The page content data to be inserted.
		 * @returns An effect that resolves to the ID of the newly inserted page content.
		 */
		pageContent: _insertPageContent,

		/**
		 * Inserts a new page data tag into the database.
		 *
		 * @param tag - The tag data to be inserted.
		 * @returns An effect that resolves to the ID of the newly inserted tag.
		 */
		tags: _insertNewTag,

		/**
		 * Inserts a new page data category into the database.
		 *
		 * @param category - The category data to be inserted.
		 * @returns An effect that resolves to the ID of the newly inserted category.
		 */
		categories: _insertNewCategory,

		/**
		 * Inserts a new permission entry for a user into the database.
		 *
		 * @param userId - The ID of the user for whom the permission is to be created.
		 * @param rank - The rank of the permission to be assigned.
		 * @returns An effect that resolves to the newly inserted permission entry.
		 */
		permissions: _insertNewPermission,

		/**
		 * Inserts a new diff tracking entry into the database.
		 *
		 * @param data - The diff tracking data to be inserted.
		 * @returns An effect that resolves to the newly inserted diff tracking entry.
		 */
		diffTracking: _insertDiffTracking,

		/**
		 * Inserts a new folder structure entry into the database.
		 *
		 * @param data - The folder structure data to be inserted.
		 * @returns An effect that resolves to the newly inserted folder structure entry.
		 */
		folder: _insertFolder,
	};

	/**
	 * Database entries point for batch operations.
	 */
	const databaseEntries = {
		/**
		 * Inserts an array of new page data tags into the database.
		 *
		 * @param tags - The array of tag data to be inserted.
		 * @returns An effect that resolves to an array of IDs of the newly inserted tags.
		 */
		tags: _insertTagArray,

		/**
		 * Inserts an array of new page data categories into the database.
		 *
		 * @param categories - The array of category data to be inserted.
		 * @returns An effect that resolves to an array of IDs of the newly inserted categories.
		 */
		categories: _insertCategoryArray,

		/**
		 * Inserts an array of new permissions into the database.
		 *
		 * @param permissions - The array of permission data to be inserted.
		 * @returns An effect that resolves to an array of newly inserted permission entries.
		 */
		permissions: _insertPermissionArray,

		/**
		 * Inserts an array of new pages along with their content into the database.
		 *
		 * @param data - An array of PageInsert objects containing page data and content.
		 * @returns An effect that resolves to an array of objects containing the IDs of the newly inserted page data and content for each page.
		 */
		pages: _insertPageWithContentArray,
	};

	return {
		databaseEntry,
		databaseEntries,

		/**
		 * Inserts a new folder structure entry into the database, ensuring it has an ID.
		 *
		 * @param data - The folder structure data to be inserted.
		 * @returns An effect that resolves to the newly inserted folder structure entry.
		 */
		folder: _mainInsertFolder,

		/**
		 * Inserts a new page along with its content into the database.
		 *
		 * @param pageData - The data for the new page, excluding the ID.
		 * @param pageContent - The content for the new page.
		 * @returns An effect that resolves to the newly inserted page data.
		 */
		page: _mainInsertPage,
	};
});

export default SDKPostModule;
