import { db, eq } from 'astro:db';
import { tsPermissions } from '../tables';
import type { STUDIOCMS_SDK_AUTH } from '../types';
import { handleSDKError } from '../utils';

/**
 * An object representing the authentication permissions for the StudioCMS SDK.
 *
 * @property {Function} currentStatus - Asynchronously retrieves the current permissions status for a given user.
 * @param {string} userId - The ID of the user whose permissions are being retrieved.
 * @returns {Promise<any>} - A promise that resolves to the user's permissions.
 * @throws {StudioCMS_SDK_Error} - Throws an error if there is an issue retrieving the user's permissions.
 */
export const authPermission: STUDIOCMS_SDK_AUTH['permission'] = {
	currentStatus: async (userId) => {
		try {
			return await db.select().from(tsPermissions).where(eq(tsPermissions.user, userId)).get();
		} catch (error) {
			handleSDKError(error, 'Error getting user permissions: An unknown error occurred.');
		}
	},
};

export default authPermission;
