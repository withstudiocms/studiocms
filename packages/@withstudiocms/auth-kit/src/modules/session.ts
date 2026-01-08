import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';
import { Effect } from '@withstudiocms/effect';
import type { APIContext, AstroGlobal } from 'astro';
import { SessionError, useSessionError, useSessionErrorPromise } from '../errors.js';
import type { SessionConfig, SessionValidationResult } from '../types.js';
import { defaultSessionConfig, makeExpirationDate, makeSessionId } from '../utils/session.js';

/**
 * Creates a session management module with the provided configuration.
 *
 * This factory function returns an object containing various session-related
 * effectful operations, such as generating session tokens, creating and validating
 * sessions, managing session cookies, and handling OAuth session tokens.
 *
 * @param config - The session configuration object. This is merged with the default session configuration.
 * @returns An Effect that yields an object with session management methods:
 * - `generateSessionToken`: Generates a secure random session token.
 * - `createSession`: Creates a new session for a user.
 * - `validateSessionToken`: Validates a session token, extends expiration if needed, and deletes expired sessions.
 * - `invalidateSession`: Deletes a session by its ID.
 * - `setSessionTokenCookie`: Sets a session token cookie in the provided context.
 * - `deleteSessionTokenCookie`: Deletes the session token cookie in the provided context.
 * - `setOAuthSessionTokenCookie`: Sets an OAuth session token cookie in the provided context.
 * - `createUserSession`: Creates a new user session and sets the session token cookie.
 *
 * @throws {SessionError} If required session tools are not provided in the configuration.
 */
export const Session = (config: SessionConfig) =>
	Effect.gen(function* () {
		const { expTime, cookieName, sessionTools } = {
			...defaultSessionConfig,
			...config,
		} as SessionConfig;

		if (!sessionTools) {
			return yield* new SessionError({
				cause: 'Session tools must be provided in the configuration',
			});
		}

		if (!Number.isFinite(expTime) || expTime <= 0) {
			return yield* new SessionError({
				cause: 'Invalid session config: expTime must be a positive number (ms)',
			});
		}
		if (typeof cookieName !== 'string' || cookieName.trim().length === 0) {
			return yield* new SessionError({
				cause: 'Invalid session config: cookieName must be a non-empty string',
			});
		}

		const expTimeHalf = expTime / 2;
		const defaultSecure = process.env.NODE_ENV === 'production';

		/**
		 * Generates a session token.
		 *
		 * This function creates a random 20-byte array and encodes it using
		 * base32 encoding without padding. The resulting string is used as
		 * a session token.
		 */
		const generateSessionToken = Effect.fn(
			'@withstudiocms/AuthKit/modules/session.generateSessionToken'
		)(() =>
			useSessionError(() => {
				const data = new Uint8Array(20);
				const random = crypto.getRandomValues(data);
				const returnable = encodeBase32LowerCaseNoPadding(random);
				return returnable;
			})
		);

		/**
		 * Creates a new session for a user.
		 *
		 * @param token - The token used to create the session.
		 * @param userId - The ID of the user for whom the session is being created.
		 * @returns The created session object.
		 */
		const createSession = Effect.fn('@withstudiocms/AuthKit/modules/session.createSession')(
			function* (token: string, userId: string) {
				const [sessionId, expirationDate] = yield* Effect.all([
					makeSessionId(token),
					makeExpirationDate(expTime),
				]);
				return yield* useSessionErrorPromise(() =>
					sessionTools.createSession({ expiresAt: expirationDate, id: sessionId, userId })
				);
			}
		);

		/**
		 * Validates a session token by checking its existence and expiration in the database.
		 * If the session is valid but close to expiration, it extends the session expiration time.
		 * If the session is expired, it deletes the session from the database.
		 *
		 * @param token - The session token to validate.
		 * @returns A promise that resolves to an object containing the session and user information.
		 *          If the session is invalid or expired, both session and user will be null.
		 */
		const validateSessionToken = Effect.fn(
			'@withstudiocms/AuthKit/modules/session.validateSessionToken'
		)(function* (token: string) {
			const sessionId = yield* makeSessionId(token);

			const nullSession: SessionValidationResult = {
				session: null,
				user: null,
			};

			const userSession = yield* useSessionErrorPromise(() =>
				sessionTools.sessionAndUserData(sessionId)
			);

			if (!userSession) {
				return nullSession;
			}

			const { user, session } = userSession;

			const now = Date.now();
			const expiresAtMs =
				session.expiresAt instanceof Date
					? session.expiresAt.getTime()
					: new Date(session.expiresAt).getTime();

			if (!Number.isFinite(expiresAtMs)) {
				// Corrupt/invalid stored date — invalidate defensively
				yield* useSessionErrorPromise(() => sessionTools.deleteSession(session.id));
				return nullSession;
			}

			if (now >= expiresAtMs) {
				yield* useSessionErrorPromise(() => sessionTools.deleteSession(session.id));
				return nullSession;
			}

			let sessionOut = session;
			if (now >= expiresAtMs - expTimeHalf) {
				const expiresAt = new Date(now + expTime);
				yield* useSessionErrorPromise(() =>
					sessionTools.updateSession(session.id, { ...session, expiresAt })
				);
				sessionOut = { ...session, expiresAt };
			}

			return { session: sessionOut, user } as SessionValidationResult;
		});

		/**
		 * Invalidates a session by deleting it from the database.
		 *
		 * @param sessionId - The unique identifier of the session to be invalidated.
		 * @returns A promise that resolves when the session has been successfully deleted.
		 */
		const invalidateSession = Effect.fn('@withstudiocms/AuthKit/modules/session.invalidateSession')(
			(sessionId: string) => useSessionErrorPromise(() => sessionTools.deleteSession(sessionId))
		);

		/**
		 * Sets a session token cookie in the provided API context.
		 *
		 * @param context - The API context where the cookie will be set.
		 * @param token - The session token to be stored in the cookie.
		 * @param expiresAt - The expiration date of the cookie.
		 * @param secure - Whether the cookie should be marked as secure.
		 */
		const setSessionTokenCookie = Effect.fn(
			'@withstudiocms/AuthKit/modules/session.setSessionTokenCookie'
		)((context: APIContext | AstroGlobal, token: string, expiresAt: Date, secure?: boolean) =>
			useSessionError(() =>
				context.cookies.set(cookieName, token, {
					httpOnly: true,
					sameSite: 'lax',
					secure: secure ?? defaultSecure,
					expires: expiresAt,
					path: '/',
				})
			)
		);

		/**
		 * Deletes the session token cookie by setting it with an empty value and a max age of 0.
		 *
		 * @param context - The context in which the cookie is being set. This can be either an APIContext or AstroGlobal.
		 * @param secure - Whether the cookie should be marked as secure.
		 */
		const deleteSessionTokenCookie = Effect.fn(
			'@withstudiocms/AuthKit/modules/session.deleteSessionTokenCookie'
		)((context: APIContext | AstroGlobal, secure?: boolean) =>
			useSessionError(() =>
				context.cookies.set(cookieName, '', {
					httpOnly: true,
					sameSite: 'lax',
					secure: secure ?? defaultSecure,
					maxAge: 0,
					path: '/',
				})
			)
		);

		/**
		 * Sets an OAuth session token cookie in the given API context.
		 *
		 * @param context - The API context which contains the cookies object.
		 * @param key - The name of the cookie to set.
		 * @param value - The value of the cookie to set.
		 * @param secure - Whether the cookie should be marked as secure.
		 */
		const setOAuthSessionTokenCookie = Effect.fn(
			'@withstudiocms/AuthKit/modules/session.setOAuthSessionTokenCookie'
		)((context: APIContext | AstroGlobal, key: string, value: string, secure?: boolean) =>
			useSessionError(() =>
				context.cookies.set(key, value, {
					httpOnly: true,
					sameSite: 'lax',
					secure: secure ?? defaultSecure,
					maxAge: 60 * 10,
					path: '/',
				})
			)
		);

		/**
		 * Creates a new user session.
		 *
		 * @param userId - The ID of the user for whom the session is being created.
		 * @param context - The API context which includes request and response objects.
		 * @returns A promise that resolves when the session has been successfully created.
		 * @param secure - Whether the cookies should be marked as secure.
		 */
		const createUserSession = Effect.fn('@withstudiocms/AuthKit/modules/session.createUserSession')(
			function* (userId: string, context: APIContext | AstroGlobal, secure?: boolean) {
				const sessionToken = yield* generateSessionToken();
				const expirationDate = yield* makeExpirationDate(expTime);
				yield* createSession(sessionToken, userId);
				yield* setSessionTokenCookie(context, sessionToken, expirationDate, secure);
			}
		);

		return {
			generateSessionToken,
			createSession,
			validateSessionToken,
			invalidateSession,
			setSessionTokenCookie,
			deleteSessionTokenCookie,
			setOAuthSessionTokenCookie,
			createUserSession,
		} as const;
	});
