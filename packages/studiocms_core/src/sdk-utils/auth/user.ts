import { db, eq } from 'astro:db';
import { GhostUserDefaults } from '../../consts';
import { tsPermissions, tsUsers } from '../tables';
import type { STUDIOCMS_SDK_AUTH } from '../types';
import { handleSDKError } from '../utils';

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
export const authUser: STUDIOCMS_SDK_AUTH['user'] = {
	create: async (newUserData) => {
		try {
			const newUser = await db.insert(tsUsers).values(newUserData).returning().get();
			await db.insert(tsPermissions).values({ user: newUser.id, rank: 'visitor' });
			return newUser;
		} catch (error) {
			handleSDKError(error, 'Error creating user: An unknown error occurred.');
		}
	},
	update: async (userId, userData) => {
		try {
			return await db.update(tsUsers).set(userData).where(eq(tsUsers.id, userId)).returning().get();
		} catch (error) {
			handleSDKError(error, 'Error updating user: An unknown error occurred.');
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
			handleSDKError(error, 'Error searching for username or email: An unknown error occurred.');
		}
	},
	ghost: {
		verifyExists: async () => {
			try {
				const ghostUser = await db
					.select()
					.from(tsUsers)
					.where(eq(tsUsers.id, GhostUserDefaults.id))
					.get();
				if (!ghostUser) {
					return false;
				}
				return true;
			} catch (error) {
				handleSDKError(error, 'Error verifying ghost user exists: An unknown error occurred.');
			}
		},
		create: async () => {
			try {
				return await db.insert(tsUsers).values(GhostUserDefaults).returning().get();
			} catch (error) {
				handleSDKError(error, 'Error creating ghost user: An unknown error occurred.');
			}
		},
		get: async () => {
			try {
				return await db.select().from(tsUsers).where(eq(tsUsers.id, GhostUserDefaults.id)).get();
			} catch (error) {
				handleSDKError(error, 'Error getting ghost user: An unknown error occurred.');
			}
		},
	},
	// TODO: Implement delete function that wont error since
	// there could be references to the user in other tables
	// delete: async () => {},
};

export default authUser;
