import { db, eq } from 'astro:db';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { tsSessionTable, tsUsers } from '@studiocms/core/db/tsTables';
import type { APIContext, AstroGlobal } from 'astro';
import type { SessionTable, SessionValidationResult, UserSession } from './types';

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export const sessionExpTime = 1000 * 60 * 60 * 24 * 14;
const expTimeHalf = sessionExpTime / 2;

export function makeExpirationDate(): Date {
	return new Date(Date.now() + sessionExpTime);
}

export const sessionCookieName = 'auth_session';

export async function createSession(token: string, userId: string): Promise<SessionTable> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: SessionTable = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + sessionExpTime),
	};
	const insertedSession = await db
		.insert(tsSessionTable)
		.values(session)
		.returning({
			id: tsSessionTable.id,
			userId: tsSessionTable.userId,
			expiresAt: tsSessionTable.expiresAt,
		})
		.get();
	return insertedSession;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await db
		.select({ user: tsUsers, session: tsSessionTable })
		.from(tsSessionTable)
		.innerJoin(tsUsers, eq(tsSessionTable.userId, tsUsers.id))
		.where(eq(tsSessionTable.id, sessionId));

	if (result.length < 1) {
		return { session: null, user: null };
	}

	const userSession = result[0];

	if (!userSession) {
		return { session: null, user: null };
	}

	const { user, session }: UserSession = userSession;

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(tsSessionTable).where(eq(tsSessionTable.id, session.id));
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - expTimeHalf) {
		session.expiresAt = new Date(Date.now() + sessionExpTime);
		await db
			.update(tsSessionTable)
			.set({ expiresAt: session.expiresAt })
			.where(eq(tsSessionTable.id, session.id));
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(tsSessionTable).where(eq(tsSessionTable.id, sessionId));
}

export function setSessionTokenCookie(context: APIContext, token: string, expiresAt: Date): void {
	context.cookies.set(sessionCookieName, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		expires: expiresAt,
		path: '/',
	});
}

export function deleteSessionTokenCookie(context: APIContext | AstroGlobal): void {
	context.cookies.set(sessionCookieName, '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		maxAge: 0,
		path: '/',
	});
}

export function setOAuthSessionTokenCookie(context: APIContext, key: string, value: string): void {
	context.cookies.set(key, value, {
		path: '/',
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax',
	});
}
