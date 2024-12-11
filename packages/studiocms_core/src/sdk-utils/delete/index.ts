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
export const StudioCMS_SDK_DELETE: STUDIOCMS_SDK['DELETE'] = {
	page: async (id) => {
		return await db
			.batch([
				db.delete(tsPageContent).where(eq(tsPageContent.contentId, id)),
				db.delete(tsPageData).where(eq(tsPageData.id, id)),
			])
			.catch((error) => {
				return { status: 'error', message: `Error deleting page with ID ${id}: ${error}` };
			})
			.then(() => {
				return { status: 'success', message: `Page with ID ${id} has been deleted successfully` };
			});
	},
	pageContent: async (id) => {
		return await db
			.delete(tsPageContent)
			.where(eq(tsPageContent.contentId, id))
			.catch((error) => {
				return { status: 'error', message: `Error deleting page content with ID ${id}: ${error}` };
			})
			.then(() => {
				return {
					status: 'success',
					message: `Page content with ID ${id} has been deleted successfully`,
				};
			});
	},
	pageContentLang: async (id, lang) => {
		return await db
			.delete(tsPageContent)
			.where(and(eq(tsPageContent.contentId, id), eq(tsPageContent.contentLang, lang)))
			.catch((error) => {
				return {
					status: 'error',
					message: `Error deleting page content with ID ${id} and lang ${lang}: ${error}`,
				};
			})
			.then(() => {
				return {
					status: 'success',
					message: `Page content with ID ${id} and lang ${lang} has been deleted successfully`,
				};
			});
	},
	tags: async (id) => {
		return await db
			.delete(tsPageDataTags)
			.where(eq(tsPageDataTags.id, id))
			.catch((error) => {
				return { status: 'error', message: `Error deleting tag with ID ${id}: ${error}` };
			})
			.then(() => {
				return { status: 'success', message: `Tag with ID ${id} has been deleted successfully` };
			});
	},
	categories: async (id) => {
		return await db
			.delete(tsPageDataCategories)
			.where(eq(tsPageDataCategories.id, id))
			.catch((error) => {
				return { status: 'error', message: `Error deleting category with ID ${id}: ${error}` };
			})
			.then(() => {
				return {
					status: 'success',
					message: `Category with ID ${id} has been deleted successfully`,
				};
			});
	},
	permissions: async (userId) => {
		return await db
			.delete(tsPermissions)
			.where(eq(tsPermissions.user, userId))
			.catch((error) => {
				return {
					status: 'error',
					message: `Error deleting permissions for user with ID ${userId}: ${error}`,
				};
			})
			.then(() => {
				return {
					status: 'success',
					message: `Permissions for user with ID ${userId} have been deleted successfully`,
				};
			});
	},
	diffTracking: async (id) => {
		return await db
			.delete(tsDiffTracking)
			.where(eq(tsDiffTracking.id, id))
			.catch((error) => {
				return { status: 'error', message: `Error deleting diff tracking with ID ${id}: ${error}` };
			})
			.then(() => {
				return {
					status: 'success',
					message: `Diff tracking with ID ${id} has been deleted successfully`,
				};
			});
	},
};

export default StudioCMS_SDK_DELETE;
