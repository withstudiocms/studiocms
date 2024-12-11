/// <reference types="@astrojs/db" />
import { db } from 'astro:db';
import { tsPermissions, tsUsers } from '../tables';
import type { STUDIOCMS_SDK } from '../types';
import { StudioCMS_SDK_Error, combineRanks, verifyRank } from '../utils';

/**
 * Provides methods to retrieve lists of users with different permission levels.
 *
 * @property {Function} all - Retrieves all users categorized by their permission levels.
 * @property {Function} owners - Retrieves users with 'owner' permission level.
 * @property {Function} admins - Retrieves users with 'admin' permission level.
 * @property {Function} editors - Retrieves users with 'editor' permission level.
 * @property {Function} visitors - Retrieves users with 'visitor' permission level.
 *
 * @returns {Promise<Array>} - A promise that resolves to an array of users with the specified permission level.
 */
export const getPermissionsLists: STUDIOCMS_SDK['GET']['permissionsLists'] = {
	all: async () => {
		try {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);

			const owners = verifyRank(existingUsers, currentPermittedUsers, 'owner');

			const admins = verifyRank(existingUsers, currentPermittedUsers, 'admin');

			const editors = verifyRank(existingUsers, currentPermittedUsers, 'editor');

			const visitors = verifyRank(existingUsers, currentPermittedUsers, 'visitor');

			return [
				...combineRanks('owner', owners),
				...combineRanks('admin', admins),
				...combineRanks('editor', editors),
				...combineRanks('visitor', visitors),
			];
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.', `${error}`);
		}
	},
	owners: async () => {
		try {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);
			return verifyRank(existingUsers, currentPermittedUsers, 'owner');
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.', `${error}`);
		}
	},
	admins: async () => {
		try {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);
			return verifyRank(existingUsers, currentPermittedUsers, 'admin');
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.', `${error}`);
		}
	},
	editors: async () => {
		try {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);
			return verifyRank(existingUsers, currentPermittedUsers, 'editor');
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.', `${error}`);
		}
	},
	visitors: async () => {
		try {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);
			return verifyRank(existingUsers, currentPermittedUsers, 'visitor');
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error getting users: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error getting users: An unknown error occurred.', `${error}`);
		}
	},
};

export default getPermissionsLists;
