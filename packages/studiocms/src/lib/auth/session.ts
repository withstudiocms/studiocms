import studioCMS_SDK from 'studiocms:sdk';
import type { tsSessionTableSelect } from 'studiocms:sdk/types';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import type { APIContext, AstroGlobal } from 'astro';
import type { SessionValidationResult, UserSession } from './types.js';

/**
 * Generates a session token.
 *
 * This function creates a random 20-byte array and encodes it using
 * base32 encoding without padding. The resulting string is used as
 * a session token.
 *
 * @returns {string} The generated session token.
 */
export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

/**
 * The session expiration time in milliseconds.
 * This value represents 14 days.
 */
export const sessionExpTime = 1000 * 60 * 60 * 24 * 14;

/**
 * Represents half of the session expiration time.
 * This value is used to determine the midpoint of the session's lifespan.
 */
const expTimeHalf = sessionExpTime / 2;

/**
 * Generates a new expiration date for a session.
 *
 * @returns {Date} The expiration date calculated by adding the session expiration time to the current date and time.
 */
export function makeExpirationDate(): Date {
	return new Date(Date.now() + sessionExpTime);
}

/**
 * The name of the cookie used to store the authentication session.
 *
 * @constant {string}
 */
export const sessionCookieName = 'auth_session';

/**
 * Creates a new session for a user.
 *
 * @param token - The token used to create the session.
 * @param userId - The ID of the user for whom the session is being created.
 * @returns A promise that resolves to the created session object.
 */
export async function createSession(token: string, userId: string): Promise<tsSessionTableSelect> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: tsSessionTableSelect = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + sessionExpTime),
	};
	return await studioCMS_SDK.AUTH.session.create(session);
}

/**
 * Validates a session token by checking its existence and expiration in the database.
 * If the session is valid but close to expiration, it extends the session expiration time.
 * If the session is expired, it deletes the session from the database.
 *
 * @param token - The session token to validate.
 * @returns A promise that resolves to an object containing the session and user information.
 *          If the session is invalid or expired, both session and user will be null.
 */
export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const result = await studioCMS_SDK.AUTH.session.sessionWithUser(sessionId);

	if (result.length < 1) {
		return { session: null, user: null };
	}

	const userSession = result[0];

	if (!userSession) {
		return { session: null, user: null };
	}

	const { user, session }: UserSession = userSession;

	if (Date.now() >= session.expiresAt.getTime()) {
		await studioCMS_SDK.AUTH.session.delete(session.id);
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - expTimeHalf) {
		session.expiresAt = new Date(Date.now() + sessionExpTime);
		await studioCMS_SDK.AUTH.session.update(session.id, session.expiresAt);
	}

	return { session, user };
}

/**
 * Invalidates a session by deleting it from the database.
 *
 * @param sessionId - The unique identifier of the session to be invalidated.
 * @returns A promise that resolves when the session has been successfully deleted.
 */
export async function invalidateSession(sessionId: string): Promise<void> {
	await studioCMS_SDK.AUTH.session.delete(sessionId);
}

/**
 * Sets a session token cookie in the provided API context.
 *
 * @param context - The API context where the cookie will be set.
 * @param token - The session token to be stored in the cookie.
 * @param expiresAt - The expiration date of the cookie.
 */
export function setSessionTokenCookie(context: APIContext, token: string, expiresAt: Date): void {
	context.cookies.set(sessionCookieName, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		expires: expiresAt,
		path: '/',
	});
}

/**
 * Deletes the session token cookie by setting it with an empty value and a max age of 0.
 *
 * @param context - The context in which the cookie is being set. This can be either an APIContext or AstroGlobal.
 */
export function deleteSessionTokenCookie(context: APIContext | AstroGlobal): void {
	context.cookies.set(sessionCookieName, '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 0,
		path: '/',
	});
}

/**
 * Sets an OAuth session token cookie in the given API context.
 *
 * @param context - The API context which contains the cookies object.
 * @param key - The name of the cookie to set.
 * @param value - The value of the cookie to set.
 */
export function setOAuthSessionTokenCookie(context: APIContext, key: string, value: string): void {
	context.cookies.set(key, value, {
		path: '/',
		secure: false,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax',
	});
}

/**
 * Creates a new user session.
 *
 * @param userId - The ID of the user for whom the session is being created.
 * @param context - The API context which includes request and response objects.
 * @returns A promise that resolves when the session has been successfully created.
 */
export async function createUserSession(userId: string, context: APIContext): Promise<void> {
	const sessionToken = generateSessionToken();
	await createSession(sessionToken, userId);
	setSessionTokenCookie(context, sessionToken, makeExpirationDate());
}
