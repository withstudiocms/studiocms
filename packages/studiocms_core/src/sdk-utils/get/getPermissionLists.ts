/// <reference types="@astrojs/db" />
import { db } from 'astro:db';
import { tsPermissions, tsUsers } from '../../db/tsTables';
import type { AvailableLists, PermissionsList } from '../types';
import { combineRanks, verifyRank } from '../utils';

/**
 * Retrieves a list of permissions based on the specified list type.
 *
 * @param list - The type of list to retrieve. Can be one of 'all', 'owners', 'admins', 'editors', or 'visitors'.
 * @returns A promise that resolves to an array of permissions lists.
 *
 * The function performs the following actions based on the list type:
 * - 'all': Retrieves all users and their permissions, then categorizes them into owners, admins, editors, and visitors.
 * - 'owners': Retrieves users with 'owner' permissions.
 * - 'admins': Retrieves users with 'admin' permissions.
 * - 'editors': Retrieves users with 'editor' permissions.
 * - 'visitors': Retrieves users with 'visitor' permissions.
 *
 * The function uses the following helper functions:
 * - `verifyRank`: Verifies the rank of users based on the existing users and current permitted users.
 * - `combineRanks`: Combines users of a specific rank into a single list.
 *
 * @example
 * ```typescript
 * const owners = await getPermissionsLists('owners');
 * console.log(owners);
 * ```
 */
export async function getPermissionsLists(list: AvailableLists): Promise<PermissionsList[]> {
	switch (list) {
		case 'all': {
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
		}
		case 'owners': {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);
			return verifyRank(existingUsers, currentPermittedUsers, 'owner');
		}
		case 'admins': {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);
			return verifyRank(existingUsers, currentPermittedUsers, 'admin');
		}
		case 'editors': {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);
			return verifyRank(existingUsers, currentPermittedUsers, 'editor');
		}
		case 'visitors': {
			const [currentPermittedUsers, existingUsers] = await db.batch([
				db.select().from(tsPermissions),
				db.select().from(tsUsers),
			]);
			return verifyRank(existingUsers, currentPermittedUsers, 'visitor');
		}
		default:
			throw new Error(`Unknown list type: ${list}`);
	}
}

export default getPermissionsLists;
