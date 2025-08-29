import { Effect } from '@withstudiocms/effect';
import { useUserError } from '../errors.js';
import {
	type AvailablePermissionRanks,
	type CombinedUserData,
	UserPermissionLevel,
	type UserSessionData,
} from '../types.js';
import { CheckIfUnsafe } from './unsafeCheck.js';

/**
 * Verifies that the provided username meets the required length constraints.
 *
 * @param username - The username string to validate.
 * @returns A user error message if the username is not between 3 and 32 characters long, otherwise `undefined`.
 */
export const verifyUsernameLength = (username: string) =>
	useUserError(() => {
		if (username.length < 3 || username.length > 32) {
			return 'Username must be between 3 and 32 characters long' as string;
		}
		return undefined;
	});

/**
 * Verifies that the provided username contains only allowed characters.
 *
 * Allowed characters are:
 * - Lowercase letters (`a-z`)
 * - Numbers (`0-9`)
 * - Hyphens (`-`)
 * - Underscores (`_`)
 *
 * @param username - The username string to validate.
 * @returns An error message if the username contains invalid characters, otherwise `undefined`.
 */
export const verifyUsernameCharacters = Effect.fn((username: string) =>
	useUserError(() => {
		if (!/^[a-z0-9_-]+$/.test(username)) {
			return 'Username can only contain lowercase letters, numbers, hyphens (-), and underscores (_)' as string;
		}
		return undefined;
	})
);

/**
 * Verifies if the provided username is considered unsafe (e.g., commonly used usernames like "admin", "root", etc.).
 *
 * @param username - The username string to be checked for safety.
 * @returns An `Effect` that yields a string with an error message if the username is unsafe,
 *          or `undefined` if the username is safe.
 *
 * @remarks
 * This function uses the `CheckIfUnsafe` service to determine if the username is unsafe.
 * It is intended to prevent the use of common or reserved usernames.
 */
export const verifyUsernameSafe = (username: string) =>
	Effect.gen(function* () {
		const check = yield* CheckIfUnsafe;
		const isUnsafe = yield* check.username(username);
		if (isUnsafe) {
			return 'Username should not be a commonly used unsafe username (admin, root, etc.)' as string;
		}
		return undefined;
	}).pipe(Effect.provide(CheckIfUnsafe.Default));

/**
 * Returns a default user session wrapped in an Effect.
 *
 * The default session indicates that the user is not logged in,
 * has no user data, and an 'unknown' permission level.
 *
 * @returns {Effect<UserSessionData>} An Effect containing the default UserSessionData.
 */
export const getDefaultUserSession = Effect.fn(() =>
	Effect.succeed({
		isLoggedIn: false,
		user: null,
		permissionLevel: 'unknown',
	} as UserSessionData)
);

/**
 * Determines the user's permission level based on the provided user data.
 *
 * This function checks the `permissionLevel` property if present, otherwise it checks
 * the `permissionsData.rank` property. If neither is available or `userData` is null,
 * it returns `'unknown'`.
 *
 * @param userData - The user session or combined user data object, or null.
 * @returns The user's permission level as an `AvailablePermissionRanks` value, or `'unknown'` if not determinable.
 */
export const getLevel = (userData: UserSessionData | CombinedUserData | null) =>
	useUserError(() => {
		if (!userData) return 'unknown';
		let userPermissionLevel: AvailablePermissionRanks = 'unknown';
		if ('permissionLevel' in userData) {
			userPermissionLevel = userData.permissionLevel;
		}
		if ('permissionsData' in userData) {
			userPermissionLevel = userData.permissionsData?.rank
				? (userData.permissionsData.rank as AvailablePermissionRanks)
				: 'unknown';
		}
		return userPermissionLevel;
	});

/**
 * Parses the given required permission rank and returns the corresponding `UserPermissionLevel`.
 * If the provided permission rank does not match any known value, it returns `UserPermissionLevel.unknown`.
 *
 * @param requiredPerms - The required permission rank to parse. Should be one of the values defined in `AvailablePermissionRanks`.
 * @returns The corresponding `UserPermissionLevel` for the given permission rank.
 */
export const parseRequiredPerms = (requiredPerms: AvailablePermissionRanks) =>
	useUserError(() => {
		switch (requiredPerms) {
			case 'owner':
				return UserPermissionLevel.owner;
			case 'admin':
				return UserPermissionLevel.admin;
			case 'editor':
				return UserPermissionLevel.editor;
			case 'visitor':
				return UserPermissionLevel.visitor;
			default:
				return UserPermissionLevel.unknown;
		}
	});
