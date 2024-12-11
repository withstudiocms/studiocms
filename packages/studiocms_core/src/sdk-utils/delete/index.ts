import { and, db, eq } from 'astro:db';
import {
	tsDiffTracking,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
} from '../tables';
import type { STUDIOCMS_SDK } from '../types';
import { StudioCMS_SDK_Error } from '../utils';

/**
 * StudioCMS_SDK_DELETE provides methods to delete various entities in the StudioCMS system.
 * Each method returns a promise that resolves to an object indicating the status and message of the operation.
 *
 * @type {STUDIOCMS_SDK['DELETE']}
 *
 * @property {Function} page - Deletes a page by its ID.
 * @param {string} id - The ID of the page to delete.
 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
 *
 * @property {Function} pageContent - Deletes page content by its ID.
 * @param {string} id - The ID of the page content to delete.
 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
 *
 * @property {Function} pageContentLang - Deletes page content by its ID and language.
 * @param {string} id - The ID of the page content to delete.
 * @param {string} lang - The language of the page content to delete.
 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
 *
 * @property {Function} tags - Deletes a tag by its ID.
 * @param {string} id - The ID of the tag to delete.
 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
 *
 * @property {Function} categories - Deletes a category by its ID.
 * @param {string} id - The ID of the category to delete.
 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
 *
 * @property {Function} permissions - Deletes permissions for a user by their ID.
 * @param {string} userId - The ID of the user whose permissions to delete.
 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
 *
 * @property {Function} diffTracking - Deletes diff tracking by its ID.
 * @param {string} id - The ID of the diff tracking to delete.
 * @returns {Promise<{status: string, message: string}>} - The result of the delete operation.
 */
export const studioCMS_SDK_DELETE: STUDIOCMS_SDK['DELETE'] = {
	page: async (id) => {
		try {
			return await db
				.batch([
					db.delete(tsPageContent).where(eq(tsPageContent.contentId, id)),
					db.delete(tsPageData).where(eq(tsPageData.id, id)),
				])
				.then(() => {
					return { status: 'success', message: `Page with ID ${id} has been deleted successfully` };
				});
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(
					`Error deleting page with ID ${id}: ${error.message}`,
					error.stack
				);
			}
			throw new StudioCMS_SDK_Error(
				`Error deleting page with ID ${id}: An unknown error occurred.`,
				`${error}`
			);
		}
	},
	pageContent: async (id) => {
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
				`Error deleting page content with ID ${id}: An unknown error occurred.`,
				`${error}`
			);
		}
	},
	pageContentLang: async (id, lang) => {
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
				`Error deleting page content with ID ${id} and lang ${lang}: An unknown error occurred.`,
				`${error}`
			);
		}
	},
	tags: async (id) => {
		try {
			return await db
				.delete(tsPageDataTags)
				.where(eq(tsPageDataTags.id, id))
				.then(() => {
					return { status: 'success', message: `Tag with ID ${id} has been deleted successfully` };
				});
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(
					`Error deleting tag with ID ${id}: ${error.message}`,
					error.stack
				);
			}
			throw new StudioCMS_SDK_Error(
				`Error deleting tag with ID ${id}: An unknown error occurred.`,
				`${error}`
			);
		}
	},
	categories: async (id) => {
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
				`Error deleting category with ID ${id}: An unknown error occurred.`,
				`${error}`
			);
		}
	},
	permissions: async (userId) => {
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
				`Error deleting permissions for user with ID ${userId}: An unknown error occurred.`,
				`${error}`
			);
		}
	},
	diffTracking: async (id) => {
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
				`Error deleting diff tracking with ID ${id}: An unknown error occurred.`,
				`${error}`
			);
		}
	},
};

export default studioCMS_SDK_DELETE;
