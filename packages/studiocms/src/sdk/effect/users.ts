import { Effect } from 'effect';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import type {
	CombinedRank,
	SingleRank,
	tsPermissionsSelect,
	tsUsersSelect,
} from '../types/index.js';

export class SDKCore_Users extends Effect.Service<SDKCore_Users>()('studiocms/sdk/SDKCore_Users', {
	effect: Effect.gen(function* () {
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
						cause: new StudioCMS_SDK_Error(`verifyRank Error: ${error}`),
					}),
			});

		return {
			verifyRank,
			combineRanks,
		};
	}),
}) {}
