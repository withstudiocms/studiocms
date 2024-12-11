import { and, db, eq } from 'astro:db';
import { tsOAuthAccounts } from '../tables';
import type { STUDIOCMS_SDK } from '../types';
import { StudioCMS_SDK_Error } from '../utils';

/**
 * The `StudioCMS_SDK_authOAuth` object provides methods to handle OAuth authentication
 * within the StudioCMS SDK. It includes methods to create and delete OAuth accounts.
 *
 * @type {STUDIOCMS_SDK['auth']['oAuth']}
 *
 * @property {Function} create - Asynchronously creates a new OAuth account with the provided data.
 * @param {Object} data - The data for the new OAuth account.
 * @returns {Promise<Object>} The created OAuth account.
 * @throws {StudioCMS_SDK_Error} Throws an error if the account creation fails.
 *
 * @property {Function} delete - Asynchronously deletes an existing OAuth account based on user ID and provider.
 * @param {string} userId - The ID of the user whose OAuth account is to be deleted.
 * @param {string} provider - The provider of the OAuth account to be deleted.
 * @returns {Promise<Object>} An object containing the status and message of the deletion operation.
 * @throws {StudioCMS_SDK_Error} Throws an error if the account deletion fails.
 */
export const StudioCMS_SDK_AUTHOAuth: STUDIOCMS_SDK['AUTH']['oAuth'] = {
	create: async (data) => {
		try {
			return await db.insert(tsOAuthAccounts).values(data).returning().get();
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(
					`Error creating OAuth account: ${error.message}`,
					error.stack
				);
			}
			throw new StudioCMS_SDK_Error(
				'Error creating OAuth account: An unknown error occurred.',
				`${error}`
			);
		}
	},
	delete: async (userId, provider) => {
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
			throw new StudioCMS_SDK_Error(
				'Error deleting OAuth account: An unknown error occurred.',
				`${error}`
			);
		}
	},
};

export default StudioCMS_SDK_AUTHOAuth;
