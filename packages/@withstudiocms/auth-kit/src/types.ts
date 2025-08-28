import type { BinaryLike } from 'node:crypto';
import type { Effect } from '@withstudiocms/effect';
import type { ScryptError } from '@withstudiocms/effect/scrypt';

/**
 * Represents a user session with expiration information.
 *
 * @property expiresAt - The date and time when the session expires.
 * @property id - The unique identifier for the session.
 * @property userId - The unique identifier of the user associated with the session.
 */
export interface UserSession {
	expiresAt: Date;
	id: string;
	userId: string;
}

/**
 * Represents the user data structure for authentication and profile management.
 *
 * @property name - The full name of the user.
 * @property id - The unique identifier for the user.
 * @property url - The user's personal or profile URL, if available.
 * @property email - The user's email address, or null if not set.
 * @property avatar - The URL to the user's avatar image, or null if not set.
 * @property username - The user's unique username.
 * @property password - The user's password (hashed or plain), or null if not set.
 * @property updatedAt - The date and time when the user was last updated, or null if not set.
 * @property createdAt - The date and time when the user was created, or null if not set.
 * @property emailVerified - Indicates whether the user's email has been verified.
 * @property notifications - Notification settings or preferences for the user, or null if not set.
 */
export interface UserData {
	name: string;
	id: string;
	url: string | null;
	email: string | null;
	avatar: string | null;
	username: string;
	password: string | null;
	updatedAt: Date | null;
	createdAt: Date | null;
	emailVerified: boolean;
	notifications: string | null;
}

/**
 * Represents the combined session and user data.
 *
 * @property session - The current user's session information.
 * @property user - The current user's profile and related data.
 */
export interface SessionAndUserData {
	session: UserSession;
	user: UserData;
}

/**
 * Represents the result of validating a session.
 *
 * This type is either a valid session and user data (`SessionAndUserData`),
 * or an object indicating that there is no valid session or user.
 *
 * - If the session is valid, it returns `SessionAndUserData`.
 * - If the session is invalid or not found, it returns an object with both `session` and `user` set to `null`.
 */
export type SessionValidationResult =
	| SessionAndUserData
	| {
			session: null;
			user: null;
	  };

/**
 * Provides methods for managing user sessions.
 *
 * @interface SessionTools
 */
export interface SessionTools {
	createSession(params: UserSession): Promise<UserSession>;
	sessionAndUserData(sessionId: string): Promise<SessionAndUserData[]>;
	deleteSession(sessionId: string): Promise<void>;
	updateSession(sessionId: string, data: Partial<UserSession>): Promise<UserSession[]>;
}

/**
 * Configuration options for managing user sessions.
 *
 * @property expTime - The expiration time for the session, in milliseconds.
 * @property cookieName - The name of the cookie used to store the session identifier.
 * @property sessionTools - Utilities or tools for session management.
 */
export interface SessionConfig {
	expTime: number;
	cookieName: string;
	sessionTools?: SessionTools;
}

/**
 * Mocked internal Scrypt type
 */
export type IScrypt = Effect.Effect<
	{
		run: (password: BinaryLike) => Effect.Effect<Buffer<ArrayBufferLike>, ScryptError, never>;
	},
	never,
	never
>;
