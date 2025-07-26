import { SDKCoreJs as sdk } from 'studiocms:sdk';
import type { tsSessionTableSelect } from 'studiocms:sdk/types';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import type { APIContext, AstroGlobal } from 'astro';
import { Data, Effect, pipe } from 'effect';
import { genLogger, pipeLogger } from '../effects/logger.js';
import type { SessionValidationResult, UserSession } from './types.js';

export class SessionError extends Data.TaggedError('SessionError')<{ message: string }> {}

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
 * The name of the cookie used to store the authentication session.
 *
 * @constant {string}
 */
export const sessionCookieName = 'auth_session';

/**
 * The `Session` class provides a set of methods for managing user sessions, including
 * creating, validating, and invalidating sessions, as well as handling session cookies.
 *
 * This class is built using the `Effect.Service` pattern and relies on the `SDKCore`
 * dependency for database interactions. It includes utility functions for generating
 * session tokens, managing expiration dates, and interacting with session-related
 * cookies in an API context.
 *
 * ### Methods:
 * - `generateSessionToken`: Generates a random session token using base32 encoding.
 * - `makeExpirationDate`: Creates a new expiration date for a session.
 * - `createSession`: Creates a new session for a user and stores it in the database.
 * - `validateSessionToken`: Validates a session token, extending its expiration if valid
 *   or deleting it if expired.
 * - `invalidateSession`: Deletes a session from the database by its ID.
 * - `setSessionTokenCookie`: Sets a session token cookie in the provided API context.
 * - `deleteSessionTokenCookie`: Deletes the session token cookie by setting it with an
 *   empty value and a max age of 0.
 * - `setOAuthSessionTokenCookie`: Sets an OAuth session token cookie in the given API context.
 * - `createUserSession`: Creates a new user session, including generating a token, storing
 *   it in the database, and setting a cookie.
 *
 *
 * ### Usage:
 * This class is designed to be used in the context of a web application where user
 * authentication and session management are required. It provides a robust and
 * extensible framework for handling session-related operations.
 */
export class Session extends Effect.Service<Session>()('studiocms/lib/auth/session/Session', {
	effect: genLogger('studiocms/lib/auth/session/Session.effect')(function* () {
		/**
		 * Generates a session token.
		 *
		 * This function creates a random 20-byte array and encodes it using
		 * base32 encoding without padding. The resulting string is used as
		 * a session token.
		 */
		const generateSessionToken = () =>
			pipeLogger('studiocms/lib/auth/session/Session.generateSessionToken')(
				Effect.try({
					try: () => {
						const data = new Uint8Array(20);
						const random = crypto.getRandomValues(data);
						const returnable = encodeBase32LowerCaseNoPadding(random);
						return returnable;
					},
					catch: (cause) =>
						new SessionError({
							message: `There was an error generating a session token: ${cause}`,
						}),
				})
			);

		/**
		 * Generates a new expiration date for a session.
		 */
		const makeExpirationDate = () =>
			pipeLogger('studiocms/lib/auth/session/Session.makeExpirationDate')(
				Effect.try({
					try: () => new Date(Date.now() + sessionExpTime),

					catch: (cause) =>
						new SessionError({
							message: `There was an error generating a session token: ${cause}`,
						}),
				})
			);

		/**
		 * @private
		 */
		const makeSessionId = (token: string) =>
			pipeLogger('studiocms/lib/auth/session/Session.makeSessionId')(
				Effect.try({
					try: () => pipe(new TextEncoder().encode(token), sha256, encodeHexLowerCase),
					catch: (cause) =>
						new SessionError({
							message: `There was an error generating a session id: ${cause}`,
						}),
				})
			);

		/**
		 * Creates a new session for a user.
		 *
		 * @param token - The token used to create the session.
		 * @param userId - The ID of the user for whom the session is being created.
		 * @returns A promise that resolves to the created session object.
		 */
		const createSession = (token: string, userId: string) =>
			genLogger('studiocms/lib/auth/session/Session.createSession')(function* () {
				const sessionId = yield* makeSessionId(token);

				const session: tsSessionTableSelect = {
					id: sessionId,
					userId,
					expiresAt: new Date(Date.now() + sessionExpTime),
				};
				return yield* sdk.AUTH.session.create(session);
			});

		/**
		 * Validates a session token by checking its existence and expiration in the database.
		 * If the session is valid but close to expiration, it extends the session expiration time.
		 * If the session is expired, it deletes the session from the database.
		 *
		 * @param token - The session token to validate.
		 * @returns A promise that resolves to an object containing the session and user information.
		 *          If the session is invalid or expired, both session and user will be null.
		 */
		const validateSessionToken = (token: string) =>
			genLogger('studiocms/lib/auth/session/Session.validateSessionToken')(function* () {
				const sessionId = yield* makeSessionId(token);

				const nullSession: SessionValidationResult = { session: null, user: null };

				const result = yield* sdk.AUTH.session.sessionWithUser(sessionId);

				if (result.length < 1) {
					return nullSession;
				}

				const userSession = result[0];

				if (!userSession) {
					return nullSession;
				}

				const { user, session }: UserSession = userSession;

				if (Date.now() >= session.expiresAt.getTime()) {
					yield* sdk.AUTH.session.delete(session.id);
					return nullSession;
				}

				if (Date.now() >= session.expiresAt.getTime() - expTimeHalf) {
					session.expiresAt = new Date(Date.now() + sessionExpTime);
					yield* sdk.AUTH.session.update(session.id, session.expiresAt);
				}

				return { session, user } as SessionValidationResult;
			});

		/**
		 * Invalidates a session by deleting it from the database.
		 *
		 * @param sessionId - The unique identifier of the session to be invalidated.
		 * @returns A promise that resolves when the session has been successfully deleted.
		 */
		const invalidateSession = (sessionId: string) =>
			pipeLogger('studiocms/lib/auth/session/Session.invalidateSession')(
				sdk.AUTH.session.delete(sessionId)
			);

		/**
		 * Sets a session token cookie in the provided API context.
		 *
		 * @param context - The API context where the cookie will be set.
		 * @param token - The session token to be stored in the cookie.
		 * @param expiresAt - The expiration date of the cookie.
		 */
		const setSessionTokenCookie = (context: APIContext, token: string, expiresAt: Date) =>
			pipeLogger('studiocms/lib/auth/session/Session.setSessionTokenCookie')(
				Effect.try({
					try: () =>
						context.cookies.set(sessionCookieName, token, {
							httpOnly: true,
							sameSite: 'lax',
							secure: import.meta.env.PROD,
							expires: expiresAt,
							path: '/',
						}),
					catch: (cause) =>
						new SessionError({
							message: `There was an error setting the session token cookie: ${cause}`,
						}),
				})
			);

		/**
		 * Deletes the session token cookie by setting it with an empty value and a max age of 0.
		 *
		 * @param context - The context in which the cookie is being set. This can be either an APIContext or AstroGlobal.
		 */
		const deleteSessionTokenCookie = (context: APIContext | AstroGlobal) =>
			pipeLogger('studiocms/lib/auth/session/Session.deleteSessionTokenCookie')(
				Effect.try({
					try: () =>
						context.cookies.set(sessionCookieName, '', {
							httpOnly: true,
							sameSite: 'lax',
							secure: import.meta.env.PROD,
							maxAge: 0,
							path: '/',
						}),
					catch: (cause) =>
						new SessionError({
							message: `There was an error deleting the session token cookie: ${cause}`,
						}),
				})
			);

		/**
		 * Sets an OAuth session token cookie in the given API context.
		 *
		 * @param context - The API context which contains the cookies object.
		 * @param key - The name of the cookie to set.
		 * @param value - The value of the cookie to set.
		 */
		const setOAuthSessionTokenCookie = (context: APIContext, key: string, value: string) =>
			pipeLogger('studiocms/lib/auth/session/Session.setOAuthSessionTokenCookie')(
				Effect.try({
					try: () =>
						context.cookies.set(key, value, {
							path: '/',
							secure: import.meta.env.PROD,
							httpOnly: true,
							maxAge: 60 * 10,
							sameSite: 'lax',
						}),
					catch: (cause) =>
						new SessionError({
							message: `There was an error setting the session token cookie: ${cause}`,
						}),
				})
			);

		/**
		 * Creates a new user session.
		 *
		 * @param userId - The ID of the user for whom the session is being created.
		 * @param context - The API context which includes request and response objects.
		 * @returns A promise that resolves when the session has been successfully created.
		 */
		const createUserSession = (userId: string, context: APIContext) =>
			genLogger('studiocms/lib/auth/session/Session.createUserSession')(function* () {
				const sessionToken = yield* generateSessionToken();
				const expiration = yield* makeExpirationDate();
				yield* createSession(sessionToken, userId);
				yield* setSessionTokenCookie(context, sessionToken, expiration);
			});

		return {
			generateSessionToken,
			makeExpirationDate,
			createSession,
			validateSessionToken,
			invalidateSession,
			setSessionTokenCookie,
			deleteSessionTokenCookie,
			setOAuthSessionTokenCookie,
			createUserSession,
		};
	}),
	dependencies: [],
}) {
	static Provide = Effect.provide(this.Default);
	static sessionCookieName = sessionCookieName;
	static sessionExpTime = sessionExpTime;
}

/**
 * Generates a session token.
 *
 * This function creates a random 20-byte array and encodes it using
 * base32 encoding without padding. The resulting string is used as
 * a session token.
 *
 * @returns {string} The generated session token.
 * @deprecated use the Effect instead
 */
export function generateSessionToken(): string {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.generateSessionToken();
	}).pipe(Effect.provide(Session.Default));

	return Effect.runSync(program);
}

/**
 * Generates a new expiration date for a session.
 *
 * @returns {Date} The expiration date calculated by adding the session expiration time to the current date and time.
 * @deprecated use the Effect instead
 */
export function makeExpirationDate(): Date {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.makeExpirationDate();
	}).pipe(Effect.provide(Session.Default));

	return Effect.runSync(program);
}

/**
 * Creates a new session for a user.
 *
 * @param token - The token used to create the session.
 * @param userId - The ID of the user for whom the session is being created.
 * @returns A promise that resolves to the created session object.
 * @deprecated use the Effect instead
 */
export async function createSession(token: string, userId: string): Promise<tsSessionTableSelect> {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.createSession(token, userId);
	}).pipe(Effect.provide(Session.Default));

	return await Effect.runPromise(program);
}

/**
 * Validates a session token by checking its existence and expiration in the database.
 * If the session is valid but close to expiration, it extends the session expiration time.
 * If the session is expired, it deletes the session from the database.
 *
 * @param token - The session token to validate.
 * @returns A promise that resolves to an object containing the session and user information.
 *          If the session is invalid or expired, both session and user will be null.
 * @deprecated use the Effect instead
 */
export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.validateSessionToken(token);
	}).pipe(Effect.provide(Session.Default));

	return await Effect.runPromise(program);
}

/**
 * Invalidates a session by deleting it from the database.
 *
 * @param sessionId - The unique identifier of the session to be invalidated.
 * @returns A promise that resolves when the session has been successfully deleted.
 * @deprecated use the Effect instead
 */
export async function invalidateSession(sessionId: string): Promise<void> {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.invalidateSession(sessionId);
	}).pipe(Effect.provide(Session.Default));

	await Effect.runPromise(program);
}

/**
 * Sets a session token cookie in the provided API context.
 *
 * @param context - The API context where the cookie will be set.
 * @param token - The session token to be stored in the cookie.
 * @param expiresAt - The expiration date of the cookie.
 * @deprecated use the Effect instead
 */
export function setSessionTokenCookie(context: APIContext, token: string, expiresAt: Date): void {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.setSessionTokenCookie(context, token, expiresAt);
	}).pipe(Effect.provide(Session.Default));

	Effect.runSync(program);
}

/**
 * Deletes the session token cookie by setting it with an empty value and a max age of 0.
 *
 * @param context - The context in which the cookie is being set. This can be either an APIContext or AstroGlobal.
 * @deprecated use the Effect instead
 */
export function deleteSessionTokenCookie(context: APIContext | AstroGlobal): void {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.deleteSessionTokenCookie(context);
	}).pipe(Effect.provide(Session.Default));

	Effect.runSync(program);
}

/**
 * Sets an OAuth session token cookie in the given API context.
 *
 * @param context - The API context which contains the cookies object.
 * @param key - The name of the cookie to set.
 * @param value - The value of the cookie to set.
 * @deprecated use the Effect instead
 */
export function setOAuthSessionTokenCookie(context: APIContext, key: string, value: string): void {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.setOAuthSessionTokenCookie(context, key, value);
	}).pipe(Effect.provide(Session.Default));

	Effect.runSync(program);
}

/**
 * Creates a new user session.
 *
 * @param userId - The ID of the user for whom the session is being created.
 * @param context - The API context which includes request and response objects.
 * @returns A promise that resolves when the session has been successfully created.
 * @deprecated use the Effect instead
 */
export async function createUserSession(userId: string, context: APIContext): Promise<void> {
	const program = Effect.gen(function* () {
		const session = yield* Session;
		return yield* session.createUserSession(userId, context);
	}).pipe(Effect.provide(Session.Default));

	await Effect.runPromise(program);
}
