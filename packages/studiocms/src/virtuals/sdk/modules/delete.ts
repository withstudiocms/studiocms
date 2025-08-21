import { and, eq } from 'astro:db';
import { GhostUserDefaults } from '../../../consts.js';
import { Effect, genLogger } from '../../../effect.js';
import { AstroDB, SDKCore_Users } from '../effect/index.js';
import {
	tsDiffTracking,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
	tsUsers,
} from '../tables.js';
import { _clearLibSQLError } from '../utils.js';
import { SDKCore_CLEAR } from './clear.js';
import { SDKCore_UPDATE } from './update.js';

/**
 * Provides deletion operations for various StudioCMS entities such as pages, page content, tags, categories,
 * permissions, diff tracking, folders, and users. Each deletion method interacts with the database and handles
 * errors specific to LibSQLDatabase.
 *
 * @remarks
 * This service is part of the StudioCMS SDK core and depends on AstroDB, SDKCore_CLEAR, SDKCore_Users, and SDKCore_UPDATE.
 *
 * @example
 * ```typescript
 * const deleteService = new SDKCore_DELETE();
 * await Effect.runPromise(deleteService.page('page-id'));
 * ```
 *
 * @see SDKCore_CLEAR
 * @see SDKCore_Users
 * @see SDKCore_UPDATE
 */
export class SDKCore_DELETE extends Effect.Service<SDKCore_DELETE>()(
	'studiocms/sdk/SDKCore/modules/delete',
	{
		dependencies: [
			AstroDB.Default,
			SDKCore_CLEAR.Default,
			SDKCore_Users.Default,
			SDKCore_UPDATE.Default,
		],
		effect: genLogger('studiocms/sdk/SDKCore/modules/delete/effect')(function* () {
			const [dbService, CLEAR, { clearUserReferences }, UPDATE] = yield* Effect.all([
				AstroDB,
				SDKCore_CLEAR,
				SDKCore_Users,
				SDKCore_UPDATE,
			]);

			const DELETE = {
				/**
				 * Deletes a page from the database.
				 *
				 * @param id - The ID of the page to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page.
				 */
				page: (id: string) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, id))
						);
						yield* dbService.execute((db) =>
							db.delete(tsPageContent).where(eq(tsPageContent.contentId, id))
						);
						yield* dbService.execute((db) => db.delete(tsPageData).where(eq(tsPageData.id, id)));

						yield* CLEAR.pages();
						return {
							status: 'success',
							message: `Page with ID ${id} has been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.page', cause),
						})
					),
				/**
				 * Deletes a page content from the database.
				 *
				 * @param id - The ID of the page content to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page content.
				 */
				pageContent: (id: string) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db.delete(tsPageContent).where(eq(tsPageContent.contentId, id))
						);
						return {
							status: 'success',
							message: `Page content with ID ${id} has been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.pageContent', cause),
						})
					),
				/**
				 * Deletes a page content lang from the database.
				 *
				 * @param id - The ID of the page content to delete.
				 * @param lang - The lang of the page content to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page content lang.
				 */
				pageContentLang: (id: string, lang: string) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db
								.delete(tsPageContent)
								.where(and(eq(tsPageContent.contentId, id), eq(tsPageContent.contentLang, lang)))
						);
						return {
							status: 'success',
							message: `Page content with ID ${id} and lang ${lang} has been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.pageContentLang', cause),
						})
					),
				/**
				 * Deletes a tag from the database.
				 *
				 * @param id - The ID of the tag to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the tag.
				 */
				tags: (id: number) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db.delete(tsPageDataTags).where(eq(tsPageDataTags.id, id))
						);
						return {
							status: 'success',
							message: `Tag with ID ${id} has been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.tags', cause),
						})
					),
				/**
				 * Deletes a category from the database.
				 *
				 * @param id - The ID of the category to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the category.
				 */
				categories: (id: number) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db.delete(tsPageDataCategories).where(eq(tsPageDataCategories.id, id))
						);
						return {
							status: 'success',
							message: `Category with ID ${id} has been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.categories', cause),
						})
					),
				/**
				 * Deletes a permission from the database.
				 *
				 * @param userId - The ID of the user to delete the permission for.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the permission.
				 */
				permissions: (userId: string) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db.delete(tsPermissions).where(eq(tsPermissions.user, userId))
						);
						return {
							status: 'success',
							message: `Permissions for user with ID ${userId} have been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.permissions', cause),
						})
					),
				/**
				 * Deletes a site configuration from the database.
				 *
				 * @param id - The ID of the site configuration to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the site configuration.
				 */
				diffTracking: (id: string) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db.delete(tsDiffTracking).where(eq(tsDiffTracking.id, id))
						);
						return {
							status: 'success',
							message: `Diff tracking with ID ${id} has been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.diffTracking', cause),
						})
					),
				/**
				 * Deletes a folder from the database.
				 *
				 * @param id - The ID of the folder to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the folder.
				 */
				folder: (id: string) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db.delete(tsPageFolderStructure).where(eq(tsPageFolderStructure.id, id))
						);

						yield* CLEAR.folderList();
						yield* CLEAR.folderTree();

						yield* UPDATE.folderList;
						yield* UPDATE.folderTree;

						return {
							status: 'success',
							message: `Folder with ID ${id} has been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.folder', cause),
						})
					),
				/**
				 * Deletes a user from the database.
				 *
				 * @param id - The ID of the user to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the user.
				 */
				user: (id: string) =>
					Effect.gen(function* () {
						if (id === GhostUserDefaults.id) {
							return yield* _clearLibSQLError(
								'DELETE.user',
								`User with ID ${id} is an internal user and cannot be deleted.`
							);
						}

						yield* clearUserReferences(id).pipe(
							Effect.catchAll(() =>
								_clearLibSQLError(
									'DELETE.user',
									`There was an issue deleting User with ID ${id}. Please manually remove all references before deleting the user. Or try again.`
								)
							)
						);

						yield* dbService.execute((db) => db.delete(tsUsers).where(eq(tsUsers.id, id)));

						return {
							status: 'success',
							message: `User with ID ${id} has been deleted successfully`,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('DELETE.user', cause),
						})
					),
			};

			return DELETE;
		}),
	}
) {}
