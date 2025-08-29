import { Effect } from '@withstudiocms/effect';
import type { APIContext, AstroGlobal } from 'astro';
import { UserError, useSessionError, useUserError, useUserErrorPromise } from '../errors.js';
import type {
	AvailablePermissionRanks,
	CombinedUserData,
	UserConfig,
	UserData,
	UserSessionData,
} from '../types.js';
import { UserPermissionLevel } from '../types.js';
import libravatar from '../utils/libravatar.js';
import {
	getDefaultUserSession,
	getLevel,
	parseRequiredPerms,
	verifyUsernameCharacters,
	verifyUsernameLength,
	verifyUsernameSafe,
} from '../utils/user.js';
import { Password as _Password } from './password.js';
import { Session as _Session } from './session.js';

/**
 * Factory function to create user-related operations for authentication and user management.
 *
 * This function initializes and returns a set of user management utilities, including
 * username validation, avatar creation, user creation (local and OAuth), password management,
 * user data retrieval, and permission checks. It requires configuration for password hashing,
 * session management, and user tools.
 *
 * @param config - The configuration object for user management.
 * @param config.Scrypt - The password hashing implementation.
 * @param config.session - The session management configuration.
 * @param config.userTools - Utilities for user data access, creation, and notification.
 * @returns An Effect generator yielding an object with user management methods:
 * - `verifyUsernameInput`: Validates a username against length, character, and safety rules.
 * - `createUserAvatar`: Generates a Libravatar URL for a user's email.
 * - `createLocalUser`: Creates a new local user with the provided details.
 * - `createOAuthUser`: Creates a new user with OAuth credentials.
 * - `updateUserPassword`: Updates a user's password.
 * - `getUserPasswordHash`: Retrieves the password hash for a user.
 * - `getUserFromEmail`: Retrieves a user by their email address.
 * - `getUserData`: Retrieves user session data from the provided context.
 * - `getUserPermissionLevel`: Gets the user's permission level as an enum.
 * - `isUserAllowed`: Checks if a user has the required permission level.
 *
 * @example
 * ```typescript
 * const userModule = User({ Scrypt, session, userTools });
 * ```
 */
export const User = ({ Scrypt, session, userTools }: UserConfig) =>
	Effect.gen(function* () {
		const [Password, Session] = yield* Effect.all([_Password(Scrypt), _Session(session)]);

		if (!userTools) {
			return yield* Effect.fail(new UserError({ cause: 'User tools are not available' }));
		}

		const notifier = userTools.notifier;

		/**
		 * Verifies if the provided username meets the required criteria.
		 *
		 * The username must:
		 * - Be between 3 and 32 characters in length.
		 * - Contain only lowercase letters, numbers, hyphens (-), and underscores (_).
		 * - Not be considered unsafe.
		 *
		 * @param username - The username to verify.
		 * @returns `true` if valid, otherwise a short error string describing the first validation failure.
		 */
		const verifyUsernameInput = Effect.fn(
			'@withstudiocms/AuthKit/modules/user.verifyUsernameInput'
		)(function* (username: string) {
			const [testLength, usernameChars, safeCheck] = yield* Effect.all([
				verifyUsernameLength(username),
				verifyUsernameCharacters(username),
				verifyUsernameSafe(username),
			]);

			if (testLength) return testLength;
			if (usernameChars) return usernameChars;
			if (safeCheck) return safeCheck;

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
		const createUserAvatar = Effect.fn('@withstudiocms/AuthKit/modules/user.createUserAvatar')(
			(email: string) =>
				useUserErrorPromise(async () =>
					libravatar.getAvatarUrl({ email, https: true, size: 400, default: 'retro' })
				)
		);

		/**
		 * Creates a new local user with the provided details.
		 *
		 * @param name - The full name of the user.
		 * @param username - The username for the user.
		 * @param email - The email address of the user.
		 * @param password - The password for the user.
		 * @returns A promise that resolves to the newly created user record.
		 */
		const createLocalUser = Effect.fn('@withstudiocms/AuthKit/modules/user.createLocalUser')(
			function* (name: string, username: string, email: string, password: string) {
				const [passwordHash, avatar, id] = yield* Effect.all([
					Password.hashPassword(password),
					createUserAvatar(email),
					useUserError(() => userTools.idGenerator()),
				]);

				const createdAt = new Date();

				const createdUser = yield* useUserErrorPromise(() =>
					userTools.createLocalUser({
						id,
						name,
						username,
						email,
						createdAt,
						avatar,
						updatedAt: createdAt,
						password: passwordHash,
						emailVerified: false,
						notifications: null,
						url: null,
					})
				);

				if (notifier) {
					yield* useUserErrorPromise(() => notifier.admin('new_user', createdUser.username));
				}

				return createdUser;
			}
		);

		/**
		 * Creates a new user with OAuth credentials.
		 *
		 * @param userFields - The fields required to create a new user.
		 * @param oAuthFields - The OAuth provider information, including the provider name and provider user ID.
		 * @returns The newly created user object or an error object if the creation fails.
		 */
		const createOAuthUser = Effect.fn('@withstudiocms/AuthKit/modules/user.createOAuthUser')(
			function* (data: UserData, oAuthFields: { provider: string; providerUserId: string }) {
				const createdUser = yield* useUserErrorPromise(() => userTools.createLocalUser(data));

				yield* useUserErrorPromise(() =>
					userTools.createOAuthUser({
						userId: createdUser.id,
						...oAuthFields,
					})
				);

				if (notifier) {
					yield* useUserErrorPromise(() => notifier.admin('new_user', createdUser.username));
				}

				return createdUser;
			}
		);

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
		const updateUserPassword = Effect.fn('@withstudiocms/AuthKit/modules/user.updateUserPassword')(
			function* (userId: string, password: string) {
				const newHash = yield* Password.hashPassword(password);
				return yield* useUserErrorPromise(() =>
					userTools.updateLocalUser(userId, { password: newHash })
				);
			}
		);

		/**
		 * Retrieves the password hash for a given user by their user ID.
		 *
		 * @param userId - The unique identifier of the user whose password hash is to be retrieved.
		 * @returns A promise that resolves to the password hash of the user.
		 * @throws Will throw an error if the user is not found or if the user does not have a password.
		 */
		const getUserPasswordHash = Effect.fn(
			'@withstudiocms/AuthKit/modules/user.getUserPasswordHash'
		)(function* (userId: string) {
			const user = yield* useUserErrorPromise(() => userTools.getUserById(userId));

			if (!user) return yield* Effect.fail(new UserError({ cause: 'User not found' }));
			if (!user.password)
				return yield* Effect.fail(new UserError({ cause: 'User has no password' }));

			return user.password;
		});

		/**
		 * Retrieves a user from the database based on their email address.
		 *
		 * @param email - The email address of the user to retrieve.
		 * @returns A promise that resolves to the user data if found, or null if no user is found with the given email.
		 */
		const getUserFromEmail = Effect.fn('@withstudiocms/AuthKit/modules/user.getUserFromEmail')(
			(email: string) => useUserErrorPromise(() => userTools.getUserByEmail(email))
		);

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
		const getUserData = Effect.fn('@withstudiocms/AuthKit/modules/user.getUserData')(function* (
			context: APIContext | AstroGlobal
		) {
			const sessionToken = yield* useSessionError(
				() => context.cookies.get(session.cookieName)?.value
			);

			if (!sessionToken) {
				return yield* getDefaultUserSession();
			}

			const { session: ses, user } = yield* Session.validateSessionToken(sessionToken);

			if (!ses || !user) {
				yield* Session.deleteSessionTokenCookie(context);
				return yield* getDefaultUserSession();
			}

			const rankToPermissionLevel: Record<string, UserSessionData['permissionLevel']> = {
				owner: 'owner',
				admin: 'admin',
				editor: 'editor',
				visitor: 'visitor',
			};

			const result = yield* useUserErrorPromise(() => userTools.getCurrentPermissions(user.id));
			const permissionLevel =
				(result && rankToPermissionLevel[result.rank]) ||
				('unknown' as UserSessionData['permissionLevel']);

			return {
				isLoggedIn: true,
				user,
				permissionLevel,
			};
		});

		/**
		 * Retrieves the user's permission level based on their session data.
		 *
		 * @param userData - The session data of the user, which includes their permission level.
		 * @returns The user's permission level as an enum value.
		 */
		const getUserPermissionLevel = Effect.fn(
			'@withstudiocms/AuthKit/modules/user.getUserPermissionLevel'
		)(function* (userData: UserSessionData | CombinedUserData | null) {
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

		/**
		 * Determines whether a user has the required permission level.
		 *
		 * @param userData - The user session data or combined user data, or null if no user is present.
		 * @param requiredPerms - The required permission rank(s) needed to access a resource.
		 * @returns A boolean indicating if the user's permission level meets or exceeds the required level.
		 */
		const isUserAllowed = Effect.fn('@withstudiocms/AuthKit/modules/user.isUserAllowed')(function* (
			userData: UserSessionData | CombinedUserData | null,
			requiredPerms: AvailablePermissionRanks
		) {
			const [userLevel, neededLevel] = yield* Effect.all([
				getUserPermissionLevel(userData),
				parseRequiredPerms(requiredPerms),
			]);
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
		} as const;
	});
