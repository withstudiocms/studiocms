import { Data, Effect } from '@withstudiocms/effect';
import { DBClientLive, SDKDefaults } from '../../context.js';
import type { CombinedRank, SingleRank, tsPermissions, tsUsersSelect } from '../../types.js';

/**
 * Custom error class for user-related operations in the SDK.
 */
export class UsersError extends Data.TaggedError('UsersError')<{ cause: unknown }> {}

/**
 * Helper function to wrap user-related operations with error handling.
 *
 * @param _try - A function that performs the desired operation.
 * @returns An Effect that either succeeds with the result of the operation or fails with a UsersError.
 */
export const useUsersError = <T>(_try: () => T) =>
	Effect.try({
		try: _try,
		catch: (error) => new UsersError({ cause: error }),
	});

/**
 * SDKUsers
 *
 * An Effect-based service that provides user-related utility functions for verifying ranks,
 * combining rank metadata, and clearing all database references to a user.
 *
 * This Effect generator depends on SDKDefaults and DBClientLive to obtain:
 * - GhostUserDefaults: used as the fallback/ghost user id when reassigning records
 * - effectDb: an Effect wrapper around the database client used for queries/updates
 *
 * The yielded object contains the following functions:
 *
 * - verifyRank(users, permissions, rank)
 *   - Purpose: Determine which users from a provided user list hold a specific rank based
 *     on a permissions collection.
 *   - Parameters:
 *     - users: an array of user rows/objects (tsUsersSelect[]), expected to include `id` and `name`.
 *     - permissions: an array of permission rows/objects (tsPermissions['Select']['Type'][]) that include a `user` reference and a `rank` string.
 *     - rank: the rank string to filter by.
 *   - Behavior: Filters the permissions by the provided rank, finds the corresponding user
 *     objects by id from the `users` array, and returns an array of SingleRank objects
 *     ({ id, name }) for the matching users.
 *   - Errors: Execution is wrapped in the users error handling helper (useUsersError), so
 *     input or mapping errors are surfaced through that wrapper.
 *
 * - combineRanks(rank, users)
 *   - Purpose: Attach a rank to a set of SingleRank entries, producing CombinedRank entries.
 *   - Parameters:
 *     - rank: the rank string to assign to each user.
 *     - users: an array of SingleRank objects (each with `id` and `name`).
 *   - Behavior: Returns a new array where each user object is shallow-copied and augmented
 *     with the provided `rank` property. Execution is wrapped in useUsersError for consistent error handling.
 *
 * - clearUserReferences(userId)
 *   - Purpose: Remove or reassign all database references to a user when that user must be
 *     cleaned up (e.g., account deletion).
 *   - Parameters:
 *     - userId: the id of the user whose references should be removed or reassigned.
 *   - Behavior: Performs a sequence of effectful DB operations (via effectDb):
 *     1. Deletes reset tokens from StudioCMSUserResetTokens for the userId.
 *     2. Deletes OAuth accounts from StudioCMSOAuthAccounts for the userId.
 *     3. Deletes permission rows from StudioCMSPermissions for the userId.
 *     4. Deletes session rows from StudioCMSSessionTable for the userId.
 *     5. Updates StudioCMSDiffTracking rows to set `userId` => GhostUserDefaults.id where they referenced the deleted user.
 *     6. Updates StudioCMSPageData rows to set `authorId` => GhostUserDefaults.id where they referenced the deleted user.
 *     - Each DB call uses executeTakeFirstOrThrow semantics, so failures in any step will throw.
 *   - Returns: A boolean true on successful completion of all operations.
 *
 * Notes:
 * - SDKUsers itself is an Effect value; consumers must run/interpret the Effect to obtain the utilities.
 * - verifyRank and combineRanks are lightweight, in-memory operations wrapped with the users error helper;
 *   clearUserReferences performs real database operations and may throw on failure.
 *
 * Example:
 * @example
 * const usersEffect = SDKUsers; // Effect that yields { verifyRank, combineRanks, clearUserReferences }
 * // run the effect in your runtime to access the utilities and then call the functions as needed.
 */
export const SDKUsers = Effect.gen(function* () {
	const [{ GhostUserDefaults }, { effectDb }] = yield* Effect.all([SDKDefaults, DBClientLive]);

	/**
	 * Verifies the rank of users based on the provided permissions and rank.
	 *
	 * @param users - An array of user objects to be verified.
	 * @param permissions - An array of permission objects that include user ranks.
	 * @param rank - The rank to be verified against the permissions.
	 * @returns An array of objects containing the id and name of users with the specified rank.
	 */
	const verifyRank = Effect.fn(
		(
			users: readonly tsUsersSelect[],
			permissions: readonly tsPermissions['Select']['Type'][],
			rank: string
		) =>
			useUsersError(() => {
				const filteredUsers = permissions.filter((user) => user.rank === rank);
				const permitted: SingleRank[] = [];

				for (const user of filteredUsers) {
					const foundUser = users.find((u) => u.id === user.user);

					if (foundUser) {
						permitted.push({ id: foundUser.id, name: foundUser.name });
					}
				}

				return permitted;
			})
	);

	/**
	 * Combines a given rank with an array of user ranks.
	 *
	 * @param rank - The rank to be combined with each user.
	 * @param users - An array of user ranks to be combined with the given rank.
	 * @returns An array of combined ranks, where each element includes the given rank and the properties of a user rank.
	 */
	const combineRanks = Effect.fn((rank: string, users: SingleRank[]) =>
		useUsersError(() => users.map((user) => ({ ...user, rank })) as CombinedRank[])
	);

	/**
	 * Clears all references to a user across various database tables.
	 *
	 * @param userId - The ID of the user whose references are to be cleared.
	 * @returns A boolean indicating whether the operation was successful.
	 */
	const clearUserReferences = Effect.fn(function* (userId: string) {
		// Execute all delete operations
		yield* Effect.all([
			...[
				{
					table: 'StudioCMSUserResetTokens' as const,
					lhs: 'userId' as const,
				},
				{
					table: 'StudioCMSOAuthAccounts' as const,
					lhs: 'userId' as const,
				},
				{
					table: 'StudioCMSPermissions' as const,
					lhs: 'user' as const,
				},
				{
					table: 'StudioCMSSessionTable' as const,
					lhs: 'userId' as const,
				},
			].map(({ table, lhs }) =>
				effectDb((db) => db.deleteFrom(table).where(lhs, '=', userId).executeTakeFirstOrThrow())
			),
			...[
				{
					table: 'StudioCMSDiffTracking' as const,
					lhs: 'userId' as const,
					update: { userId: GhostUserDefaults.id },
				},
				{
					table: 'StudioCMSPageData' as const,
					lhs: 'authorId' as const,
					update: { authorId: GhostUserDefaults.id },
				},
			].map(({ table, lhs, update }) =>
				effectDb((db) =>
					db.updateTable(table).set(update).where(lhs, '=', userId).executeTakeFirstOrThrow()
				)
			),
		]);

		// Indicate successful completion
		return true;
	});

	return {
		verifyRank,
		combineRanks,
		clearUserReferences,
	};
});
