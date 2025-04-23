import { sendAdminNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { CombinedUserData, tsUsersInsert, tsUsersSelect } from 'studiocms:sdk/types';
import type { APIContext, AstroGlobal } from 'astro';
import { hashPassword } from './password.js';
import { deleteSessionTokenCookie, sessionCookieName, validateSessionToken } from './session.js';
import type { UserSessionData } from './types.js';
import checkIfUnsafe from './utils/unsafeCheck.js';

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
	// Check if the username is between 3 and 32 characters
	if (username.length < 3 || username.length > 32) {
		return 'Username must be between 3 and 32 characters';
	}

	// Check if the username only contains lowercase letters, numbers, -, and _
	if (!/^[a-z0-9_-]+$/.test(username)) {
		return 'Username may only contain lowercase letters, numbers, - and _';
	}

	// Check if the username is unsafe
	if (checkIfUnsafe(username).username()) {
		return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
	}

	return true;
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
	// trim and lowercase the email
	const safeEmail = email.trim().toLowerCase();
	// encode as (utf-8) Uint8Array
	const msgUint8 = new TextEncoder().encode(safeEmail);
	// hash the message
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	// convert buffer to byte array
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	// convert bytes to hex string
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	// return the gravatar url
	return `https://seccdn.libravatar.org/avatar/${hashHex}?s=400&d=retro`;
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
	const passwordHash = await hashPassword(password);

	const avatar = await createUserAvatar(email);

	const newUser = await studioCMS_SDK.AUTH.user.create({
		id: crypto.randomUUID(),
		name,
		username,
		email,
		password: passwordHash,
		createdAt: new Date(),
		avatar,
	});

	await sendAdminNotification('new_user', newUser.username);

	return newUser;
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
		const newUser = await studioCMS_SDK.AUTH.user.create(userFields);

		await studioCMS_SDK.AUTH.oAuth.create({
			userId: newUser.id,
			provider: oAuthFields.provider,
			providerUserId: oAuthFields.providerUserId,
		});

		await sendAdminNotification('new_user', newUser.username);

		return newUser;
	} catch (error) {
		console.error(error);
		return { error: 'Error creating user' };
	}
}

/**
 * The name of the cookie used for linking a new OAuth account.
 * This constant is used to identify the specific cookie that handles
 * the linking process for new OAuth accounts.
 */
export const LinkNewOAuthCookieName = 'link-new-o-auth';

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
	const passwordHash = await hashPassword(password);

	await studioCMS_SDK.AUTH.user.update(userId, { password: passwordHash });
}

/**
 * Retrieves the password hash for a given user by their user ID.
 *
 * @param userId - The unique identifier of the user whose password hash is to be retrieved.
 * @returns A promise that resolves to the password hash of the user.
 * @throws Will throw an error if the user is not found or if the user does not have a password.
 */
export async function getUserPasswordHash(userId: string): Promise<string> {
	const user = await studioCMS_SDK.GET.databaseEntry.users.byId(userId);

	if (!user) {
		throw new Error('User not found');
	}

	if (!user.password) {
		throw new Error('User has no password');
	}

	return user.password;
}

/**
 * Retrieves a user from the database based on their email address.
 *
 * @param email - The email address of the user to retrieve.
 * @returns A promise that resolves to the user data if found, or null if no user is found with the given email.
 */
export async function getUserFromEmail(email: string): Promise<tsUsersSelect | null> {
	return (await studioCMS_SDK.GET.databaseEntry.users.byEmail(email)) ?? null;
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
	const getDefaultUserSession = (): UserSessionData => ({
		isLoggedIn: false,
		user: null,
		permissionLevel: 'unknown',
	});

	const rankToPermissionLevel: Record<string, UserSessionData['permissionLevel']> = {
		owner: 'owner',
		admin: 'admin',
		editor: 'editor',
		visitor: 'visitor',
	};

	const sessionToken = context.cookies.get(sessionCookieName)?.value ?? null;

	if (!sessionToken) {
		return getDefaultUserSession();
	}

	const { session, user } = await validateSessionToken(sessionToken);

	if (!session || !user) {
		deleteSessionTokenCookie(context);
		return getDefaultUserSession();
	}

	try {
		const result = await studioCMS_SDK.AUTH.permission.currentStatus(user.id);
		const permissionLevel = result?.rank
			? rankToPermissionLevel[result.rank] || 'unknown'
			: 'unknown';

		return {
			isLoggedIn: true,
			user,
			permissionLevel,
		};
	} catch (error) {
		console.error('Error fetching user permission level:', error);
		return getDefaultUserSession();
	}
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

/**
 * Verifies if the user's permission level meets the required permission rank.
 *
 * @param userData - The session data of the user, which includes their permission level.
 * @param requiredPermission - The required permission rank to be verified against the user's permission level.
 * @returns A promise that resolves to a boolean indicating whether the user's permission level meets the required rank.
 * @deprecated
 * This function is deprecated and will be removed in future versions. Use `getUserPermissionLevel` instead.
 */
export async function verifyUserPermissionLevel(
	userData: UserSessionData | CombinedUserData,
	requiredPermission: AvailablePermissionRanks
): Promise<boolean> {
	let permissionLevel: AvailablePermissionRanks = 'unknown';

	if ('permissionLevel' in userData) {
		permissionLevel = userData.permissionLevel;
	}

	if ('permissionsData' in userData) {
		permissionLevel = userData.permissionsData?.rank
			? (userData.permissionsData.rank as AvailablePermissionRanks)
			: 'unknown';
	}

	return permissionRanksMap[requiredPermission].includes(permissionLevel);
}

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
 * Retrieves the user's permission level based on their session data.
 *
 * @param userData - The session data of the user, which includes their permission level.
 * @returns The user's permission level as an enum value.
 */
export function getUserPermissionLevel(
	userData: UserSessionData | CombinedUserData
): UserPermissionLevel {
	let userPermissionLevel: AvailablePermissionRanks = 'unknown';
	if ('permissionLevel' in userData) {
		userPermissionLevel = userData.permissionLevel;
	}
	if ('permissionsData' in userData) {
		userPermissionLevel = userData.permissionsData?.rank
			? (userData.permissionsData.rank as AvailablePermissionRanks)
			: 'unknown';
	}

	switch (userPermissionLevel) {
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
}
