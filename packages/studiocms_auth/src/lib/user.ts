import { db, eq } from 'astro:db';
import { checkIfUnsafe } from '@matthiesenxyz/integration-utils/securityUtils';
import { tsOAuthAccounts, tsPermissions, tsUsers } from '@studiocms/core/db/tsTables';
import type { APIContext, AstroGlobal } from 'astro';
import { hashPassword } from './password';
import { deleteSessionTokenCookie, sessionCookieName, validateSessionToken } from './session';
import type { UserSessionData, UserTable } from './types';

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
export function verifyUsernameInput(username: string): boolean {
	// Check if the username is between 3 and 32 characters
	if (username.length < 3 || username.length > 32) {
		return false;
	}

	// Check if the username only contains lowercase letters, numbers, -, and _
	if (!/^[a-z0-9_-]+$/.test(username)) {
		return false;
	}

	// Check if the username is unsafe
	if (checkIfUnsafe(username).username()) {
		return false;
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
	const safeemail = email.trim().toLowerCase();
	// encode as (utf-8) Uint8Array
	const msgUint8 = new TextEncoder().encode(safeemail);
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
): Promise<UserTable> {
	const passwordHash = hashPassword(password);

	const avatar = await createUserAvatar(email);

	const newUserData: typeof tsUsers.$inferInsert = {
		id: crypto.randomUUID(),
		name,
		username,
		email,
		password: passwordHash,
		createdAt: new Date(),
		avatar,
	};

	const newUser = await db.insert(tsUsers).values(newUserData).returning().get();

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
	userFields: typeof tsUsers.$inferInsert,
	oAuthFields: { provider: string; providerUserId: string }
) {
	try {
		const newUser = await db.insert(tsUsers).values(userFields).returning().get();

		await db.insert(tsOAuthAccounts).values({
			userId: newUser.id,
			provider: oAuthFields.provider,
			providerUserId: oAuthFields.providerUserId,
		});

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

	await db.update(tsUsers).set({ password: passwordHash }).where(eq(tsUsers.id, userId));
}

/**
 * Retrieves the password hash for a given user by their user ID.
 *
 * @param userId - The unique identifier of the user whose password hash is to be retrieved.
 * @returns A promise that resolves to the password hash of the user.
 * @throws Will throw an error if the user is not found or if the user does not have a password.
 */
export async function getUserPasswordHash(userId: string): Promise<string> {
	const user = await db.select().from(tsUsers).where(eq(tsUsers.id, userId)).get();

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
export async function getUserFromEmail(email: string): Promise<UserTable | null> {
	return (await db.select().from(tsUsers).where(eq(tsUsers.email, email)).get()) ?? null;
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
export async function getUserData(Astro: AstroGlobal | APIContext): Promise<UserSessionData> {
	const { cookies } = Astro;

	const sessionToken = cookies.get(sessionCookieName)?.value ?? null;

	if (!sessionToken) {
		return { isLoggedIn: false, user: null, permissionLevel: 'unknown' };
	}

	const { session, user } = await validateSessionToken(sessionToken);

	if (session === null) {
		deleteSessionTokenCookie(Astro);
		return { isLoggedIn: false, user: null, permissionLevel: 'unknown' };
	}

	if (!user || user === null) {
		return { isLoggedIn: false, user: null, permissionLevel: 'unknown' };
	}

	const result = await db.select().from(tsPermissions).where(eq(tsPermissions.user, user.id)).get();

	if (!result) {
		return { isLoggedIn: true, user, permissionLevel: 'unknown' };
	}

	let permissionLevel: UserSessionData['permissionLevel'] = 'unknown';

	switch (result.rank) {
		case 'owner':
			permissionLevel = 'owner';
			break;
		case 'admin':
			permissionLevel = 'admin';
			break;
		case 'editor':
			permissionLevel = 'editor';
			break;
		case 'visitor':
			permissionLevel = 'visitor';
			break;
		default:
			permissionLevel = 'unknown';
			break;
	}

	return {
		isLoggedIn: true,
		user,
		permissionLevel,
	};
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
 */
export async function verifyUserPermissionLevel(
	userData: UserSessionData,
	requiredPermission: AvailablePermissionRanks
): Promise<boolean> {
	const { permissionLevel } = userData;
	return permissionRanksMap[requiredPermission].includes(permissionLevel);
}
