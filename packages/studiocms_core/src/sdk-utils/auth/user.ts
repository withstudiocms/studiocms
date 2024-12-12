import { db, eq } from 'astro:db';
import { tsUsers } from '../tables';
import type { STUDIOCMS_SDK } from '../types';
import { StudioCMS_SDK_Error } from '../utils';

/**
 * The `StudioCMS_SDK_authUser` object provides methods for creating and updating user records
 * in the StudioCMS system. It interacts with the database to perform these operations and
 * handles errors by throwing `StudioCMS_SDK_Error` with appropriate messages.
 *
 * @property {Function} create - Asynchronously creates a new user record in the database.
 * @param {tsUsersInsert} newUserData - The data for the new user to be created.
 * @returns {Promise<any>} - A promise that resolves to the created user record.
 * @throws {StudioCMS_SDK_Error} - Throws an error if the creation process fails.
 *
 * @property {Function} update - Asynchronously updates an existing user record in the database.
 * @param {string} userId - The ID of the user to be updated.
 * @param {tsUsersSelect} userData - The new data for the user.
 * @returns {Promise<any>} - A promise that resolves to the updated user record.
 * @throws {StudioCMS_SDK_Error} - Throws an error if the update process fails.
 *
 * @todo Implement the delete function to safely remove user records without causing errors due to references in other tables.
 */
export const authUser: STUDIOCMS_SDK['AUTH']['user'] = {
	create: async (newUserData) => {
		try {
			return await db.insert(tsUsers).values(newUserData).returning().get();
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error creating user: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error creating user: An unknown error occurred.', `${error}`);
		}
	},
	update: async (userId, userData) => {
		try {
			return await db.update(tsUsers).set(userData).where(eq(tsUsers.id, userId)).returning().get();
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error updating user: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error updating user: An unknown error occurred.', `${error}`);
		}
	},
	searchUsersForUsernameOrEmail: async (username, email) => {
		try {
			const [usernameSearch, emailSearch] = await db.batch([
				db.select().from(tsUsers).where(eq(tsUsers.username, username)),
				db.select().from(tsUsers).where(eq(tsUsers.email, email)),
			]);

			return { usernameSearch, emailSearch };
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(
					`Error searching for username or email: ${error.message}`,
					error.stack
				);
			}
			throw new StudioCMS_SDK_Error(
				'Error searching for username or email: An unknown error occurred.',
				`${error}`
			);
		}
	},
	// TODO: Implement delete function that wont error since
	// there could be references to the user in other tables
	// delete: async () => {},
};

export default authUser;
