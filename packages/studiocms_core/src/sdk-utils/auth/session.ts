import { db, eq } from 'astro:db';
import { tsSessionTable, tsUsers } from '../tables';
import type { STUDIOCMS_SDK } from '../types';
import { StudioCMS_SDK_Error } from '../utils';

/**
 * StudioCMS_SDK_authSession provides methods to manage authentication sessions.
 *
 * @property {Function} create - Creates a new session.
 * @param {tsSessionTableInsert} data - The data to insert into the session table.
 * @returns {Promise<Object>} The created session object.
 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the session.
 *
 * @property {Function} sessionWithUser - Retrieves a session along with the associated user.
 * @param {string} sessionId - The ID of the session to retrieve.
 * @returns {Promise<Object>} The session and associated user object.
 * @throws {StudioCMS_SDK_Error} If an error occurs while retrieving the session with user.
 *
 * @property {Function} delete - Deletes a session.
 * @param {string} sessionId - The ID of the session to delete.
 * @returns {Promise<Object>} An object indicating the status of the deletion.
 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the session.
 *
 * @property {Function} update - Updates the expiration date of a session.
 * @param {string} sessionId - The ID of the session to update.
 * @param {Date} newDate - The new expiration date.
 * @returns {Promise<Object>} The updated session object.
 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the session.
 */
export const StudioCMS_SDK_AUTHSession: STUDIOCMS_SDK['AUTH']['session'] = {
	create: async (data) => {
		try {
			return await db
				.insert(tsSessionTable)
				.values(data)
				.returning({
					id: tsSessionTable.id,
					userId: tsSessionTable.userId,
					expiresAt: tsSessionTable.expiresAt,
				})
				.get();
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error creating session: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error(
				'Error creating session: An unknown error occurred.',
				`${error}`
			);
		}
	},
	sessionWithUser: async (sessionId) => {
		try {
			return await db
				.select({ user: tsUsers, session: tsSessionTable })
				.from(tsSessionTable)
				.innerJoin(tsUsers, eq(tsSessionTable.userId, tsUsers.id))
				.where(eq(tsSessionTable.id, sessionId));
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(
					`Error getting session with user: ${error.message}`,
					error.stack
				);
			}
			throw new StudioCMS_SDK_Error(
				'Error getting session with user: An unknown error occurred.',
				`${error}`
			);
		}
	},
	delete: async (sessionId) => {
		try {
			await db.delete(tsSessionTable).where(eq(tsSessionTable.id, sessionId));
			return {
				status: 'success',
				message: 'Session deleted',
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error deleting session: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error(
				'Error deleting session: An unknown error occurred.',
				`${error}`
			);
		}
	},
	update: async (sessionId, newDate) => {
		try {
			return await db
				.update(tsSessionTable)
				.set({ expiresAt: newDate })
				.where(eq(tsSessionTable.id, sessionId))
				.returning();
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error updating session: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error(
				'Error updating session: An unknown error occurred.',
				`${error}`
			);
		}
	},
};

export default StudioCMS_SDK_AUTHSession;
