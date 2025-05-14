import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { CombinedUserData, tsUsersInsert, tsUsersSelect } from 'studiocms:sdk/types';
import type { APIContext, AstroGlobal } from 'astro';
import { Effect, Layer, pipe } from 'effect';
import { Password } from './password.js';
import { Session } from './session.js';
import type { UserSessionData } from './types.js';
import { CheckIfUnsafe } from './utils/unsafeCheck.js';

/**
 * The name of the cookie used for linking a new OAuth account.
 * This constant is used to identify the specific cookie that handles
 * the linking process for new OAuth accounts.
 */
export const LinkNewOAuthCookieName = 'link-new-o-auth';

/**
 * An enumeration representing different user permission levels.
 *
 * The permission levels are defined as follows:
 * - visitor: 1
 * - editor: 2
 * - admin: 3
 * - owner: 4
 * - unknown: 0
 */
export enum UserPermissionLevel {
	visitor = 1,
	editor = 2,
	admin = 3,
	owner = 4,
	unknown = 0,
}

/**
 * An array of available permission ranks for users.
 *
 * The permission ranks are defined as a constant tuple and include the following values:
 * - 'owner': The highest level of permission, typically the creator or primary administrator.
 * - 'admin': A high level of permission, usually for users who manage the system.
 * - 'editor': A mid-level permission, for users who can modify content.
 * - 'visitor': A low-level permission, for users who can view content but not modify it.
 * - 'unknown': A default or fallback permission rank for users with undefined roles.
 */
const availablePermissionRanks = ['owner', 'admin', 'editor', 'visitor', 'unknown'] as const;

/**
 * Represents the available permission ranks for a user.
 *
 * This type is derived from the `availablePermissionRanks` array,
 * and it includes all the possible values that a user can have as a permission rank.
 */
type AvailablePermissionRanks = (typeof availablePermissionRanks)[number];

export const make = Effect.gen(function* () {
	const sdk = yield* SDKCore;

	/**
	 * @private
	 */
	const verifyUsernameLength = (
		username: string
	): Effect.Effect<string | undefined, never, never> =>
		username.length > 3 && username.length < 32
			? Effect.succeed(undefined)
			: Effect.succeed('Username must be between 3 and 32 characters');

	/**
	 * @private
	 */
	const verifyUsernameCharacters = (
		username: string
	): Effect.Effect<string | undefined, never, never> =>
		/^[a-z0-9_-]+$/.test(username)
			? Effect.succeed(undefined)
			: Effect.succeed('Username may only contain lowercase letters, numbers, - and _');

	/**
	 * @private
	 */
	const verifyUsernameSafe = (username: string) =>
		Effect.gen(function* () {
			const check = yield* CheckIfUnsafe;
			if (check.username(username)) {
				return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
			}
			return;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

	/**
	 * Verifies if the provided username meets the required criteria.
	 *
	 * The username must:
	 * - Be between 3 and 32 characters in length.
	 * - Contain only lowercase letters, numbers, hyphens (-), and underscores (_).
	 * - Not be considered unsafe.
	 *
	 * @param username - The username to verify.
	 * @returns `true` if the username is valid, `false` otherwise.
	 */
	const verifyUsernameInput = (username: string) =>
		Effect.gen(function* () {
			const testLength = yield* verifyUsernameLength(username);
			if (testLength) {
				return testLength;
			}

			const usernameChars = yield* verifyUsernameCharacters(username);
			if (usernameChars) {
				return usernameChars;
			}

			const safeCheck = yield* verifyUsernameSafe(username);
			if (safeCheck) {
				return safeCheck;
			}

			return true;
		});

	/**
	 * Creates a user avatar URL based on the provided email.
	 *
	 * This function takes an email address, processes it to generate a unique hash,
	 * and returns a URL for the user's avatar using the Libravatar service.
	 *
	 * @param email - The email address of the user.
	 * @returns A promise that resolves to the URL of the user's avatar.
	 */
	const createUserAvatar = (email: string) =>
		Effect.gen(function* () {
			const msgUint8 = pipe(email.trim().toLowerCase(), new TextEncoder().encode);

			const hashBuffer = yield* Effect.tryPromise(() => crypto.subtle.digest('SHA-256', msgUint8));

			const hashHex = pipe(new Uint8Array(hashBuffer), Array.from, (h: number[]) =>
				h.map((b) => b.toString(16).padStart(2, '0')).join('')
			);

			return `https://seccdn.libravatar.org/avatar/${hashHex}?s=400&d=retro`;
		});

	/**
	 * Creates a new local user with the provided details.
	 *
	 * @param name - The full name of the user.
	 * @param username - The username for the user.
	 * @param email - The email address of the user.
	 * @param password - The password for the user.
	 * @returns A promise that resolves to the newly created user record.
	 */
	const createLocalUser = (name: string, username: string, email: string, password: string) =>
		Effect.gen(function* () {
			const pass = yield* Password;
			const notify = yield* Notifications;
			const passwordHash = yield* pass.hashPassword(password);
			const avatar = yield* createUserAvatar(email);

			const newUser = yield* sdk.AUTH.user.create({
				id: crypto.randomUUID(),
				name,
				username,
				email,
				password: passwordHash,
				createdAt: new Date(),
				avatar,
			});

			yield* notify.sendAdminNotification('new_user', newUser.username);

			return newUser;
		}).pipe(Effect.provide(Password.Default), Effect.provide(Notifications.Default));

	/**
	 * Creates a new user with OAuth credentials.
	 *
	 * @param userFields - The fields required to create a new user.
	 * @param oAuthFields - The OAuth provider information, including the provider name and provider user ID.
	 * @returns The newly created user object or an error object if the creation fails.
	 */
	const createOAuthUser = (
		userFields: tsUsersInsert,
		oAuthFields: { provider: string; providerUserId: string }
	) =>
		Effect.gen(function* () {
			const notify = yield* Notifications;
			const newUser = yield* sdk.AUTH.user.create(userFields);

			yield* sdk.AUTH.oAuth.create({
				userId: newUser.id,
				provider: oAuthFields.provider,
				providerUserId: oAuthFields.providerUserId,
			});

			yield* notify.sendAdminNotification('new_user', newUser.username);

			return newUser;
		}).pipe(Effect.provide(Notifications.Default));

	/**
	 * Updates the password for a user.
	 *
	 * This function hashes the provided password and updates the user's password
	 * in the database with the hashed password.
	 *
	 * @param userId - The unique identifier of the user whose password is to be updated.
	 * @param password - The new password to be set for the user.
	 * @returns A promise that resolves when the password has been successfully updated.
	 */
	const updateUserPassword = (userId: string, password: string) =>
		Effect.gen(function* () {
			const pass = yield* Password;

			const passwordHash = yield* pass.hashPassword(password);

			yield* sdk.AUTH.user.update(userId, { password: passwordHash });
		}).pipe(Effect.provide(Password.Default));

	/**
	 * Retrieves the password hash for a given user by their user ID.
	 *
	 * @param userId - The unique identifier of the user whose password hash is to be retrieved.
	 * @returns A promise that resolves to the password hash of the user.
	 * @throws Will throw an error if the user is not found or if the user does not have a password.
	 */
	const getUserPasswordHash = (userId: string) =>
		Effect.gen(function* () {
			const user = yield* sdk.GET.users.byId(userId);

			if (!user) {
				return yield* Effect.fail(new Error('User not found'));
			}

			if (!user.password) {
				return yield* Effect.fail(new Error('User has no password'));
			}

			return user.password;
		});

	/**
	 * Retrieves a user from the database based on their email address.
	 *
	 * @param email - The email address of the user to retrieve.
	 * @returns A promise that resolves to the user data if found, or null if no user is found with the given email.
	 */
	const getUserFromEmail = (email: string) =>
		Effect.gen(function* () {
			const data = yield* sdk.GET.users.byEmail(email);

			return data ?? null;
		});

	/**
	 * @private
	 */
	const getDefaultUserSession = () =>
		Effect.succeed({
			isLoggedIn: false,
			user: null,
			permissionLevel: 'unknown',
		} as UserSessionData);

	/**
	 * Retrieves user session data based on the provided Astro context.
	 *
	 * @param Astro - The Astro global object or API context containing cookies.
	 * @returns A promise that resolves to the user session data.
	 *
	 * The function performs the following steps:
	 * 1. Extracts the session token from cookies.
	 * 2. If no session token is found, returns an object indicating the user is not logged in.
	 * 3. Validates the session token.
	 * 4. If the session is invalid, deletes the session token cookie and returns an object indicating the user is not logged in.
	 * 5. If the user is not found, returns an object indicating the user is not logged in.
	 * 6. Retrieves the user's permission level from the database.
	 * 7. Returns an object containing the user's login status, user information, and permission level.
	 */
	const getUserData = (context: AstroGlobal | APIContext) =>
		Effect.gen(function* () {
			const sessionInst = yield* Session;
			const sessionToken = yield* Effect.try(
				() => context.cookies.get(Session.sessionCookieName)?.value ?? null
			);

			if (!sessionToken) {
				return yield* getDefaultUserSession();
			}

			const { session, user } = yield* sessionInst.validateSessionToken(sessionToken);

			if (!session || !user) {
				yield* sessionInst.deleteSessionTokenCookie(context);
				return yield* getDefaultUserSession();
			}

			const rankToPermissionLevel: Record<string, UserSessionData['permissionLevel']> = {
				owner: 'owner',
				admin: 'admin',
				editor: 'editor',
				visitor: 'visitor',
			};

			const result = yield* sdk.AUTH.permission.currentStatus(user.id);

			if (!result) {
				console.error('Error fetching user permission level');
				return yield* getDefaultUserSession();
			}

			const permissionLevel = rankToPermissionLevel[result.rank] || 'unknown';

			return {
				isLoggedIn: true,
				user,
				permissionLevel,
			};
		}).pipe(Effect.provide(Session.Default));

	/**
	 * @private
	 */
	const getLevel = (userData: UserSessionData | CombinedUserData) =>
		Effect.try(() => {
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
	 * Retrieves the user's permission level based on their session data.
	 *
	 * @param userData - The session data of the user, which includes their permission level.
	 * @returns The user's permission level as an enum value.
	 */
	const getUserPermissionLevel = (userData: UserSessionData | CombinedUserData) =>
		Effect.gen(function* () {
			const level = yield* getLevel(userData);

			switch (level) {
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

	const parseRequiredPerms = (requiredPerms: AvailablePermissionRanks) => {
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
	};

	const isUserAllowed = (
		userData: UserSessionData | CombinedUserData,
		requiredPerms: AvailablePermissionRanks
	) =>
		Effect.gen(function* () {
			const userLevel = yield* getUserPermissionLevel(userData);
			const neededLevel = parseRequiredPerms(requiredPerms);

			return userLevel >= neededLevel;
		});

	return {
		verifyUsernameInput,
		createUserAvatar,
		createLocalUser,
		createOAuthUser,
		updateUserPassword,
		getUserPasswordHash,
		getUserFromEmail,
		getUserData,
		getUserPermissionLevel,
		isUserAllowed,
	};
}).pipe(Effect.provide(SDKCore.Default));

export class User extends Effect.Tag('studiocms/lib/auth/user/User')<
	User,
	Effect.Effect.Success<typeof make>
>() {
	static Live = make;
	static Layer = Layer.scoped(this, this.Live);
}

/**
 * Verifies if the provided username meets the required criteria.
 *
 * The username must:
 * - Be between 3 and 32 characters in length.
 * - Contain only lowercase letters, numbers, hyphens (-), and underscores (_).
 * - Not be considered unsafe.
 *
 * @param username - The username to verify.
 * @returns `true` if the username is valid, `false` otherwise.
 */
export function verifyUsernameInput(username: string): true | string {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.verifyUsernameInput(username);
	}).pipe(Effect.provide(User.Layer));

	return Effect.runSync(program);
}

/**
 * Creates a user avatar URL based on the provided email.
 *
 * This function takes an email address, processes it to generate a unique hash,
 * and returns a URL for the user's avatar using the Libravatar service.
 *
 * @param email - The email address of the user.
 * @returns A promise that resolves to the URL of the user's avatar.
 */
export async function createUserAvatar(email: string) {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.createUserAvatar(email);
	}).pipe(Effect.provide(User.Layer));

	return await Effect.runPromise(program);
}

/**
 * Creates a new local user with the provided details.
 *
 * @param name - The full name of the user.
 * @param username - The username for the user.
 * @param email - The email address of the user.
 * @param password - The password for the user.
 * @returns A promise that resolves to the newly created user record.
 */
export async function createLocalUser(
	name: string,
	username: string,
	email: string,
	password: string
): Promise<tsUsersSelect> {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.createLocalUser(name, username, email, password);
	}).pipe(Effect.provide(User.Layer));

	return await Effect.runPromise(program);
}

/**
 * Creates a new user with OAuth credentials.
 *
 * @param userFields - The fields required to create a new user.
 * @param oAuthFields - The OAuth provider information, including the provider name and provider user ID.
 * @returns The newly created user object or an error object if the creation fails.
 */
export async function createOAuthUser(
	userFields: tsUsersInsert,
	oAuthFields: { provider: string; providerUserId: string }
) {
	try {
		const program = Effect.gen(function* () {
			const user = yield* User;
			return yield* user.createOAuthUser(userFields, oAuthFields);
		}).pipe(Effect.provide(User.Layer));

		return await Effect.runPromise(program);
	} catch (error) {
		console.error(error);
		return { error: 'Error creating user' };
	}
}

/**
 * Updates the password for a user.
 *
 * This function hashes the provided password and updates the user's password
 * in the database with the hashed password.
 *
 * @param userId - The unique identifier of the user whose password is to be updated.
 * @param password - The new password to be set for the user.
 * @returns A promise that resolves when the password has been successfully updated.
 */
export async function updateUserPassword(userId: string, password: string): Promise<void> {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.updateUserPassword(userId, password);
	}).pipe(Effect.provide(User.Layer));

	return await Effect.runPromise(program);
}

/**
 * Retrieves the password hash for a given user by their user ID.
 *
 * @param userId - The unique identifier of the user whose password hash is to be retrieved.
 * @returns A promise that resolves to the password hash of the user.
 * @throws Will throw an error if the user is not found or if the user does not have a password.
 */
export async function getUserPasswordHash(userId: string): Promise<string> {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.getUserPasswordHash(userId);
	}).pipe(Effect.provide(User.Layer));

	return await Effect.runPromise(program);
}

/**
 * Retrieves a user from the database based on their email address.
 *
 * @param email - The email address of the user to retrieve.
 * @returns A promise that resolves to the user data if found, or null if no user is found with the given email.
 */
export async function getUserFromEmail(email: string): Promise<tsUsersSelect | null> {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.getUserFromEmail(email);
	}).pipe(Effect.provide(User.Layer));

	return await Effect.runPromise(program);
}

/**
 * Retrieves user session data based on the provided Astro context.
 *
 * @param Astro - The Astro global object or API context containing cookies.
 * @returns A promise that resolves to the user session data.
 *
 * The function performs the following steps:
 * 1. Extracts the session token from cookies.
 * 2. If no session token is found, returns an object indicating the user is not logged in.
 * 3. Validates the session token.
 * 4. If the session is invalid, deletes the session token cookie and returns an object indicating the user is not logged in.
 * 5. If the user is not found, returns an object indicating the user is not logged in.
 * 6. Retrieves the user's permission level from the database.
 * 7. Returns an object containing the user's login status, user information, and permission level.
 */
export async function getUserData(context: AstroGlobal | APIContext): Promise<UserSessionData> {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.getUserData(context);
	}).pipe(Effect.provide(User.Layer));

	return await Effect.runPromise(program);
}

/**
 * Retrieves the user's permission level based on their session data.
 *
 * @param userData - The session data of the user, which includes their permission level.
 * @returns The user's permission level as an enum value.
 */
export function getUserPermissionLevel(
	userData: UserSessionData | CombinedUserData
): UserPermissionLevel {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.getUserPermissionLevel(userData);
	}).pipe(Effect.provide(User.Layer));

	return Effect.runSync(program);
}

export function isUserAllowed(
	userData: UserSessionData | CombinedUserData,
	requiredPerms: AvailablePermissionRanks
) {
	const program = Effect.gen(function* () {
		const user = yield* User;
		return yield* user.isUserAllowed(userData, requiredPerms);
	}).pipe(Effect.provide(User.Layer));

	return Effect.runSync(program);
}

/**
 * A mapping of permission ranks to their respective allowed roles.
 *
 * This map defines the hierarchy of permissions, where each rank includes
 * all the roles of the ranks below it. For example, an 'admin' has the roles
 * of both 'owner' and 'admin', while an 'editor' has the roles of 'owner',
 * 'admin', and 'editor'.
 *
 * @property {string[]} owner - The 'owner' rank, which includes only the 'owner' role.
 * @property {string[]} admin - The 'admin' rank, which includes 'owner' and 'admin' roles.
 * @property {string[]} editor - The 'editor' rank, which includes 'owner', 'admin', and 'editor' roles.
 * @property {string[]} visitor - The 'visitor' rank, which includes 'owner', 'admin', 'editor', and 'visitor' roles.
 * @property {string[]} unknown - The 'unknown' rank, which includes all roles: 'owner', 'admin', 'editor', 'visitor', and 'unknown'.
 */
export const permissionRanksMap: Record<AvailablePermissionRanks, string[]> = {
	owner: ['owner'],
	admin: ['owner', 'admin'],
	editor: ['owner', 'admin', 'editor'],
	visitor: ['owner', 'admin', 'editor', 'visitor'],
	unknown: ['owner', 'admin', 'editor', 'visitor', 'unknown'],
};
