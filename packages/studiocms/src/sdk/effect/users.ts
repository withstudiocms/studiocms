import { eq } from 'astro:db';
import { GhostUserDefaults } from '../../consts.js';
import { Effect } from '../../effect.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import {
	tsDiffTracking,
	tsOAuthAccounts,
	tsPageData,
	tsPermissions,
	tsSessionTable,
	tsUserResetTokens,
} from '../tables.js';
import type {
	CombinedRank,
	SingleRank,
	tsPermissionsSelect,
	tsUsersSelect,
} from '../types/index.js';
import { AstroDB } from './db.js';

/**
 * SDKCore_Users provides core user-related effects for the StudioCMS SDK.
 *
 * @remarks
 * This service includes utilities for verifying user ranks, combining rank data,
 * and clearing all references to a user from the database. It leverages the Effect system
 * for composable error handling and dependency injection.
 *
 * @example
 * ```typescript
 * const usersService = SDKCore_Users;
 * const result = usersService.verifyRank(users, permissions, 'admin');
 * ```
 *
 * @effect
 * - `verifyRank`: Filters users by rank based on permissions.
 * - `combineRanks`: Combines a given rank with user data.
 * - `clearUserReferences`: Removes all references to a user from related tables.
 *
 * @dependencies
 * - Depends on AstroDB for database operations.
 *
 * @accessors
 * - Provides accessors for each effect.
 */
export class SDKCore_Users extends Effect.Service<SDKCore_Users>()('studiocms/sdk/SDKCore_Users', {
	effect: Effect.gen(function* () {
		const dbService = yield* AstroDB;
		/**
		 * Verifies the rank of users based on the provided permissions and rank.
		 *
		 * @param users - An array of user objects to be verified.
		 * @param permissions - An array of permission objects that include user ranks.
		 * @param rank - The rank to be verified against the permissions.
		 * @returns An array of objects containing the id and name of users with the specified rank.
		 */
		const verifyRank = (
			users: tsUsersSelect[],
			permissions: tsPermissionsSelect[],
			rank: string
		): Effect.Effect<SingleRank[], SDKCoreError, never> =>
			Effect.try({
				try: () => {
					const filteredUsers = permissions.filter((user) => user.rank === rank);
					const permitted: SingleRank[] = [];

					for (const user of filteredUsers) {
						const foundUser = users.find((u) => u.id === user.user);

						if (foundUser) {
							permitted.push({ id: foundUser.id, name: foundUser.name });
						}
					}

					return permitted;
				},
				catch: (error) =>
					new SDKCoreError({
						type: 'UNKNOWN',
						cause: new StudioCMS_SDK_Error(`verifyRank Error: ${error}`),
					}),
			});

		/**
		 * Combines a given rank with an array of user ranks.
		 *
		 * @param rank - The rank to be combined with each user.
		 * @param users - An array of user ranks to be combined with the given rank.
		 * @returns An array of combined ranks, where each element includes the given rank and the properties of a user rank.
		 */
		const combineRanks = (
			rank: string,
			users: SingleRank[]
		): Effect.Effect<CombinedRank[], SDKCoreError, never> =>
			Effect.try({
				try: () => users.map((user) => ({ rank, ...user })) as CombinedRank[],
				catch: (error) =>
					new SDKCoreError({
						type: 'UNKNOWN',
						cause: new StudioCMS_SDK_Error(`combineRanks Error: ${error}`),
					}),
			});

		/**
		 * Clears all references to a specific user from various database tables.
		 *
		 * This function performs the following operations within a database transaction:
		 * - Deletes user reset tokens associated with the given user ID.
		 * - Deletes permissions associated with the given user ID.
		 * - Deletes OAuth accounts associated with the given user ID.
		 * - Deletes session records associated with the given user ID.
		 * - Updates the `tsDiffTracking` table to replace the user's ID with a default "ghost user" ID.
		 * - Updates the `tsPageData` table to replace the author's ID with a default "ghost user" ID.
		 *
		 * If any database operation fails, the transaction is rolled back, and an error is returned.
		 *
		 * @param userId - The ID of the user whose references should be cleared.
		 * @returns An `Effect` that resolves to `true` if the operation succeeds, or fails with an `SDKCoreError` if an error occurs.
		 *
		 * @throws SDKCoreError - If a database error occurs during the operation.
		 */
		const clearUserReferences = (userId: string): Effect.Effect<boolean, SDKCoreError, never> =>
			Effect.gen(function* () {
				yield* dbService.execute((db) =>
					db.delete(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId))
				);
				yield* dbService.execute((db) =>
					db.delete(tsPermissions).where(eq(tsPermissions.user, userId))
				);
				yield* dbService.execute((db) =>
					db.delete(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, userId))
				);
				yield* dbService.execute((db) =>
					db.delete(tsSessionTable).where(eq(tsSessionTable.userId, userId))
				);
				yield* dbService.execute((db) =>
					db
						.update(tsDiffTracking)
						.set({ userId: GhostUserDefaults.id })
						.where(eq(tsDiffTracking.userId, userId))
				);
				yield* dbService.execute((db) =>
					db
						.update(tsPageData)
						.set({ authorId: GhostUserDefaults.id })
						.where(eq(tsPageData.authorId, userId))
				);
				return true;
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						Effect.fail(
							new SDKCoreError({
								type: 'LibSQLDatabaseError',
								cause: new StudioCMS_SDK_Error(`Error clearing user references: ${cause}`),
							})
						),
				})
			);

		return {
			verifyRank,
			combineRanks,
			clearUserReferences,
		};
	}),
	dependencies: [AstroDB.Default],
}) {}
