import { StudioCMS_SDK_Error } from '../errors';
import type { CombinedRank, SingleRank, tsPermissionsSelect, tsUsersSelect } from '../types';

/**
 * Verifies the rank of users based on the provided permissions and rank.
 *
 * @param users - An array of user objects to be verified.
 * @param permissions - An array of permission objects that include user ranks.
 * @param rank - The rank to be verified against the permissions.
 * @returns An array of objects containing the id and name of users with the specified rank.
 * @throws {StudioCMS_SDK_Error} If an error occurs during the verification process.
 */
export function verifyRank(
	users: tsUsersSelect[],
	permissions: tsPermissionsSelect[],
	rank: string
): SingleRank[] {
	try {
		const filteredUsers = permissions.filter((user) => user.rank === rank);
		const permitted: { id: string; name: string }[] = [];

		for (const user of filteredUsers) {
			const foundUser = users.find((u) => u.id === user.user);

			if (foundUser) {
				permitted.push({ id: foundUser.id, name: foundUser.name });
			}
		}

		return permitted;
	} catch (error) {
		if (error instanceof Error) {
			throw new StudioCMS_SDK_Error(`Error verifying rank: ${error.message}`, error.stack);
		}
		throw new StudioCMS_SDK_Error('Error verifying rank: An unknown error occurred.');
	}
}

/**
 * Combines a given rank with an array of user ranks.
 *
 * @param rank - The rank to be combined with each user.
 * @param users - An array of user ranks to be combined with the given rank.
 * @returns An array of combined ranks, where each element includes the given rank and the properties of a user rank.
 */
export function combineRanks(rank: string, users: SingleRank[]): CombinedRank[] {
	return users.map((user) => ({ rank, ...user }));
}
