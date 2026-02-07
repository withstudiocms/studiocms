import { Effect, Schema } from '@withstudiocms/effect';
import type { DBCallbackFailure } from '@withstudiocms/kysely/client';
import type { DatabaseError, QueryError, QueryParseError } from '@withstudiocms/kysely/core/errors';
import CacheService from '../../cache.js';
import { cacheTags } from '../../consts.js';
import { DBClientLive, SDKDefaults } from '../../context.js';
import SDKClearModule from '../clear/index.js';
import SDKUpdateModule from '../update/index.js';
import { SDKUsers } from '../util/users.js';

/**
 * Response type for deletion operations.
 */
type DeletionResponse = Effect.Effect<
	{
		status: 'success' | 'error';
		message: string;
	},
	never,
	never
>;

/**
 * Custom error class for ghost user deletion attempts.
 */
class GhostUserError {
	readonly _tag = 'GhostUserError';
}

/**
 * Handles errors that may occur during database operations.
 *
 * @param cause - The error cause.
 * @returns An effect that represents the error handling operation.
 */
const _handleErrors = Effect.catchTags<
	DBCallbackFailure | DatabaseError,
	{
		DBCallbackFailure: (cause: DBCallbackFailure) => Effect.Effect<
			{
				status: 'error';
				message: string;
			},
			never,
			never
		>;
		NotFoundError: () => Effect.Effect<
			{
				status: 'error';
				message: string;
			},
			never,
			never
		>;
		QueryError: (cause: QueryError) => Effect.Effect<
			{
				status: 'error';
				message: string;
			},
			never,
			never
		>;
		QueryParseError: (cause: QueryParseError) => Effect.Effect<
			{
				status: 'error';
				message: string;
			},
			never,
			never
		>;
	}
>({
	DBCallbackFailure: (cause) =>
		Effect.succeed({
			status: 'error' as const,
			message: cause.message,
		}),
	NotFoundError: () =>
		Effect.succeed({
			status: 'error' as const,
			message: 'database entry not found',
		}),
	QueryError: (cause) =>
		Effect.succeed({
			status: 'error' as const,
			message: cause.message,
		}),
	QueryParseError: (cause) =>
		Effect.succeed({
			status: 'error' as const,
			message: cause.message,
		}),
});

/**
 * SDKDeleteModule
 *
 * Effect generator that builds and returns the Delete API for the StudioCMS SDK.
 *
 * This module wires together low-level database delete operations, input validation
 * (via encoders), cache clearing and higher-level helpers to provide a cohesive
 * deletion surface for pages, page content, tags, categories, permissions, diff
 * tracking, folders and users.
 *
 * Remarks
 * - All low-level DB deletes are wrapped with a validation encoder (withEncoder)
 *   and execute the underlying query using executeTakeFirstOrThrow; absent rows
 *   will surface as errors which are handled by the module's error pipeline.
 * - High-level helpers compose these low-level operations into meaningful flows:
 *   - Page deletion clears diff tracking, page content and page data, then clears relevant caches.
 *   - Folder deletion triggers subsequent updates to folder list and folder tree views.
 *   - User deletion clears user references and prevents deletion of the platform
 *     "ghost" (internal) user.
 * - The module uses a shared error handler (_handleErrors) to normalize errors into
 *   DeletionResponse values where possible.
 *
 * Error handling
 * - DB-level errors (not found / constraint failures) thrown by executeTakeFirstOrThrow
 *   are propagated into the module's error-handling pipeline and converted into
 *   DeletionResponse values by _handleErrors.
 * - Ghost user protection surfaces a GhostUserError that is caught and turned into
 *   an appropriate DeletionResponse explaining that the internal user cannot be deleted.
 * - Folder update failures are specially caught and returned with an explanatory message.
 *
 * Side effects
 * - Cache/derived-data clearing routines are invoked where appropriate (e.g. page cache
 *   clearing after deleting page content).
 * - Folder deletion triggers background updates to folder list and folder tree.
 *
 * Returns
 * - An Effect that, when executed, yields an object containing the DELETE API
 *   described above. Each method itself is an Effect producing a DeletionResponse
 *   describing success or a mapped error.
 *
 * Example
 * - const deleteModule = yield* SDKDeleteModule;
 * - yield* deleteModule.page('page-id-123') // returns a DeletionResponse effect
 */
export const SDKDeleteModule = Effect.gen(function* () {
	const [{ withEncoder }, clear, users, update, { GhostUserDefaults }, { invalidateTags }] =
		yield* Effect.all([
			DBClientLive,
			SDKClearModule,
			SDKUsers,
			SDKUpdateModule,
			SDKDefaults,
			CacheService,
		]);

	// ===========================================
	// DB Operations
	// ===========================================

	/**
	 * Deletes diff tracking entries by page ID.
	 *
	 * @param pageId - The ID of the page whose diff tracking entries are to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deleteDiffTrackingByPageId = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, pageId) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSDiffTracking')
					.where('pageId', '=', pageId)
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes diff tracking entry by diff ID.
	 *
	 * @param diffId - The ID of the diff tracking entry to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deleteDiffTrackingByDiffId = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, diffId) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSDiffTracking')
					.where('id', '=', diffId)
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes page content entries by page ID.
	 *
	 * @param pageId - The ID of the page whose content entries are to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deletePageContentByPageId = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, pageId) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSPageContent')
					.where('contentId', '=', pageId)
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes page data by page ID.
	 *
	 * @param pageId - The ID of the page to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deletePageDataById = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, pageId) =>
			db((client) =>
				client.deleteFrom('StudioCMSPageData').where('id', '=', pageId).executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes page content for a specific language by page ID and language.
	 *
	 * @param params - An object containing the page ID and language.
	 * @param params.id - The ID of the page content to be deleted.
	 * @param params.lang - The language of the page content to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deletePageContentLangByIdAndLang = withEncoder({
		encoder: Schema.Struct({
			id: Schema.String,
			lang: Schema.String,
		}),
		callbackFn: (db, { id, lang }) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSPageContent')
					.where((eb) => eb.and([eb('contentId', '=', id), eb('contentLang', '=', lang)]))
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes tags associated with a page by page ID.
	 *
	 * @param pageId - The ID of the page whose tags are to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deleteTagsById = withEncoder({
		encoder: Schema.Number,
		callbackFn: (db, id) =>
			db((client) =>
				client.deleteFrom('StudioCMSPageDataTags').where('id', '=', id).executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes categories associated with a page by page ID.
	 *
	 * @param pageId - The ID of the page whose categories are to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deleteCategoriesById = withEncoder({
		encoder: Schema.Number,
		callbackFn: (db, id) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSPageDataCategories')
					.where('id', '=', id)
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes permission data associated with a user by user ID.
	 *
	 * @param userId - The ID of the user whose permission data is to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deletePermissionDataByUserId = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, userId) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSPermissions')
					.where('user', '=', userId)
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes a folder by its ID.
	 *
	 * @param folderId - The ID of the folder to delete.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deleteFolderById = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, folderId) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSPageFolderStructure')
					.where('id', '=', folderId)
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes a user by their ID.
	 *
	 * @param userId - The ID of the user to delete.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deleteUserById = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, userId) =>
			db((client) =>
				client.deleteFrom('StudioCMSUsersTable').where('id', '=', userId).executeTakeFirstOrThrow()
			),
	});

	// ===========================================
	// Helpers
	// ===========================================

	/**
	 * Deletes a page by its ID, handling related deletions and cache clearing.
	 *
	 * @param id - The ID of the page to delete.
	 * @returns An effect that resolves to a success or error message.
	 */
	const _deletePageById = Effect.fn(
		(id: string): DeletionResponse =>
			_deleteDiffTrackingByPageId(id).pipe(
				Effect.flatMap(() => _deletePageContentByPageId(id)),
				Effect.flatMap(() => _deletePageDataById(id)),
				Effect.flatMap(() => clear.page.byId(id)),
				Effect.map(() => ({
					status: 'success' as const,
					message: `Page with ID ${id} has been deleted successfully`,
				})),
				_handleErrors
			)
	);

	/**
	 * Deletes page content by its ID.
	 *
	 * @param id - The ID of the page content to delete.
	 * @returns An effect that resolves to a success or error message.
	 */
	const _deletePageContent = Effect.fn(
		(id: string): DeletionResponse =>
			_deletePageContentByPageId(id).pipe(
				Effect.flatMap(() => clear.page.byId(id)),
				Effect.map(() => ({
					status: 'success' as const,
					message: `Page content with ID ${id} has been deleted successfully`,
				})),
				_handleErrors
			)
	);

	/**
	 * Deletes page content for a specific language by its ID and language.
	 *
	 * @param id - The ID of the page content to delete.
	 * @param lang - The language of the page content to delete.
	 * @returns An effect that resolves to a success or error message.
	 */
	const _deletePageContentLang = Effect.fn(
		(id: string, lang: string): DeletionResponse =>
			_deletePageContentLangByIdAndLang({ id, lang }).pipe(
				Effect.flatMap(() => clear.page.byId(id)),
				Effect.map(() => ({
					status: 'success' as const,
					message: `Page content with ID ${id} and language ${lang} has been deleted successfully`,
				})),
				_handleErrors
			)
	);

	/**
	 * Deletes a tag by its ID.
	 *
	 * @param id - The ID of the tag to delete.
	 * @returns An effect that resolves to a success or error message.
	 */
	const _deletePageTag = Effect.fn(
		(id: number): DeletionResponse =>
			_deleteTagsById(id).pipe(
				Effect.tap(() => invalidateTags(cacheTags.tags)),
				Effect.map(() => ({
					status: 'success' as const,
					message: `Tag with ID ${id} has been deleted successfully`,
				})),
				_handleErrors
			)
	);

	/**
	 * Deletes a category by its ID.
	 *
	 * @param id - The ID of the category to delete.
	 * @returns An effect that resolves to a success or error message.
	 */
	const _deletePageCategory = Effect.fn(
		(id: number): DeletionResponse =>
			_deleteCategoriesById(id).pipe(
				Effect.tap(() => invalidateTags(cacheTags.categories)),
				Effect.map(() => ({
					status: 'success' as const,
					message: `Category with ID ${id} has been deleted successfully`,
				})),
				_handleErrors
			)
	);

	/**
	 * Deletes permissions for a specific user by their ID.
	 *
	 * @param userId - The ID of the user whose permissions to delete.
	 * @returns An effect that resolves to a success or error message.
	 */
	const _deletePermission = Effect.fn(
		(userId: string): DeletionResponse =>
			_deletePermissionDataByUserId(userId).pipe(
				Effect.map(() => ({
					status: 'success' as const,
					message: `Permissions for user with ID ${userId} have been deleted successfully`,
				})),
				_handleErrors
			)
	);

	/**
	 * Deletes diff tracking entry by diff ID.
	 *
	 * @param id - The ID of the diff tracking entry to be deleted.
	 * @returns An effect that represents the deletion operation.
	 */
	const _deleteDiffTracking = Effect.fn(
		(id: string): DeletionResponse =>
			_deleteDiffTrackingByDiffId(id).pipe(
				Effect.map(() => ({
					status: 'success' as const,
					message: `Diff tracking entry with ID ${id} has been deleted successfully`,
				})),
				_handleErrors
			)
	);

	/**
	 * Deletes a folder by its ID.
	 *
	 * @param folderId - The ID of the folder to delete.
	 * @returns An effect that resolves to a success or error message.
	 */
	const _deleteFolder = Effect.fn(
		(folderId: string): DeletionResponse =>
			_deleteFolderById(folderId).pipe(
				Effect.tap(() => Effect.all([update.folderList, update.folderTree])),
				Effect.map(() => ({
					status: 'success' as const,
					message: `Folder with ID ${folderId} has been deleted successfully`,
				})),
				Effect.catchTag('FolderTreeError', (cause) =>
					Effect.succeed({
						status: 'error' as const,
						message: `Failed to update folder tree after deleting folder with ID ${folderId}: ${cause.message}`,
					})
				),
				_handleErrors
			)
	);

	/**
	 * Checks if the user ID is not the Ghost user ID.
	 *
	 * @param userId - The ID of the user to check.
	 * @returns An effect that fails with GhostUserError if the user ID is the Ghost user ID, otherwise succeeds with false.
	 */
	const _isNotGhostUser = (userId: string): Effect.Effect<boolean, GhostUserError, never> =>
		userId !== GhostUserDefaults.id ? Effect.fail(new GhostUserError()) : Effect.succeed(false);

	/**
	 * Deletes a user by their ID.
	 *
	 * @param userId - The ID of the user to delete.
	 * @returns An effect that resolves to a success or error message.
	 */
	const _deleteUser = Effect.fn(
		(userId: string): DeletionResponse =>
			_isNotGhostUser(userId).pipe(
				Effect.flatMap(() => users.clearUserReferences(userId)),
				Effect.flatMap(() => _deleteUserById(userId)),
				Effect.map(() => ({
					status: 'success' as const,
					message: `User with ID ${userId} has been deleted successfully`,
				})),
				Effect.catchTag('GhostUserError', () =>
					Effect.succeed({
						status: 'error' as const,
						message: `User with ID ${userId} is an internal user and cannot be deleted.`,
					})
				),
				_handleErrors
			)
	);

	// ===========================================
	// Exposed API
	// ===========================================

	/**
	 * Delete Module
	 */
	const DELETE = {
		/**
		 * Deletes a page by its ID.
		 *
		 * @param id - The ID of the page to delete.
		 * @returns An effect that resolves to a success or error message.
		 */
		page: _deletePageById,

		/**
		 * Deletes page content by its ID.
		 *
		 * @param id - The ID of the page content to delete.
		 * @returns An effect that resolves to a success or error message.
		 */
		pageContent: _deletePageContent,

		/**
		 * Deletes page content for a specific language by its ID and language.
		 *
		 * @param id - The ID of the page content to delete.
		 * @param lang - The language of the page content to delete.
		 * @returns An effect that resolves to a success or error message.
		 */
		pageContentLang: _deletePageContentLang,

		/**
		 * Deletes a tag by its ID.
		 *
		 * @param id - The ID of the tag to delete.
		 * @returns An effect that resolves to a success or error message.
		 */
		tags: _deletePageTag,

		/**
		 * Deletes a category by its ID.
		 *
		 * @param id - The ID of the category to delete.
		 * @returns An effect that resolves to a success or error message.
		 */
		categories: _deletePageCategory,

		/**
		 * Deletes permissions for a specific user by their ID.
		 *
		 * @param userId - The ID of the user whose permissions to delete.
		 * @returns An effect that resolves to a success or error message.
		 */
		permissions: _deletePermission,

		/**
		 * Deletes diff tracking entry by diff ID.
		 *
		 * @param id - The ID of the diff tracking entry to be deleted.
		 * @returns An effect that represents the deletion operation.
		 */
		diffTracking: _deleteDiffTracking,

		/**
		 * Deletes a folder by its ID.
		 *
		 * @param folderId - The ID of the folder to delete.
		 * @returns An effect that resolves to a success or error message.
		 */
		folder: _deleteFolder,

		/**
		 * Deletes a user by their ID.
		 *
		 * @param userId - The ID of the user to delete.
		 * @returns An effect that resolves to a success or error message.
		 */
		user: _deleteUser,
	};

	return DELETE;
});

export default SDKDeleteModule;
