import { Effect } from '@withstudiocms/effect';
import { useUserError } from '../errors.js';
import {
	type AvailablePermissionRanks,
	type CombinedUserData,
	UserPermissionLevel,
	type UserSessionData,
} from '../types.js';
import { CheckIfUnsafe } from './unsafeCheck.js';

export const verifyUsernameLength = (username: string) =>
	useUserError(() => {
		if (username.length < 3 || username.length > 32) {
			return 'Username must be between 3 and 32 characters long' as string;
		}
		return undefined;
	});

export const verifyUsernameCharacters = Effect.fn((username: string) =>
	useUserError(() => {
		if (!/^[a-z0-9_-]+$/.test(username)) {
			return 'Username can only contain lowercase letters, numbers, hyphens (-), and underscores (_)' as string;
		}
		return undefined;
	})
);

export const verifyUsernameSafe = (username: string) =>
	Effect.gen(function* () {
		const check = yield* CheckIfUnsafe;
		const isUnsafe = yield* check.username(username);
		if (isUnsafe) {
			return 'Username should not be a commonly used unsafe username (admin, root, etc.)' as string;
		}
		return undefined;
	}).pipe(Effect.provide(CheckIfUnsafe.Default));

export const getDefaultUserSession = Effect.fn(() =>
	Effect.succeed({
		isLoggedIn: false,
		user: null,
		permissionLevel: 'unknown',
	} as UserSessionData)
);

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
