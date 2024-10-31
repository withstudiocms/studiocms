import { db, eq } from 'astro:db';
import { checkIfUnsafe } from '@matthiesenxyz/integration-utils/securityUtils';
import { tsOAuthAccounts, tsPermissions, tsUsers } from '@studiocms/core/db/tsTables';
import type { APIContext, AstroGlobal } from 'astro';
import { hashPassword } from './password';
import { deleteSessionTokenCookie, sessionCookieName, validateSessionToken } from './session';
import type { UserSessionData, UserTable } from './types';

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

export async function createLocalUser(
	name: string,
	username: string,
	email: string,
	password: string
): Promise<UserTable> {
	const passwordHash = await hashPassword(password);

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

export const LinkNewOAuthCookieName = 'link-new-o-auth';

export async function updateUserPassword(userId: string, password: string): Promise<void> {
	const passwordHash = await hashPassword(password);

	await db.update(tsUsers).set({ password: passwordHash }).where(eq(tsUsers.id, userId));
}

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

export async function getUserFromEmail(email: string): Promise<UserTable | null> {
	return (await db.select().from(tsUsers).where(eq(tsUsers.email, email)).get()) ?? null;
}

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

const availablePermissionRanks = ['owner', 'admin', 'editor', 'visitor', 'unknown'] as const;
type AvailablePermissionRanks = (typeof availablePermissionRanks)[number];

export const permissionRanksMap: Record<AvailablePermissionRanks, string[]> = {
	owner: ['owner'],
	admin: ['owner', 'admin'],
	editor: ['owner', 'admin', 'editor'],
	visitor: ['owner', 'admin', 'editor', 'visitor'],
	unknown: ['owner', 'admin', 'editor', 'visitor', 'unknown'],
};

export async function verifyUserPermissionLevel(
	userData: UserSessionData,
	requiredPermission: AvailablePermissionRanks
): Promise<boolean> {
	const { permissionLevel } = userData;
	return permissionRanksMap[requiredPermission].includes(permissionLevel);
}
