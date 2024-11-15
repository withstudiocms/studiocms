/**
 * Represents a user in the user table.
 *
 * @interface UserTable
 * @property {string} id - The unique identifier for the user.
 * @property {string | null} url - The URL of the user's profile.
 * @property {string} name - The name of the user.
 * @property {string | null} email - The email address of the user.
 * @property {string | null} avatar - The URL of the user's avatar.
 * @property {string} username - The username of the user.
 * @property {string | null} password - The hashed password of the user.
 * @property {Date | null} updatedAt - The date and time when the user was last updated.
 * @property {Date | null} createdAt - The date and time when the user was created.
 */
export interface UserTable {
	id: string;
	url: string | null;
	name: string;
	email: string | null;
	avatar: string | null;
	username: string;
	password: string | null;
	updatedAt: Date | null;
	createdAt: Date | null;
}

/**
 * Represents a table of OAuth accounts.
 *
 * @interface OAuthAccountsTable
 * @property {string} provider - The name of the OAuth provider (e.g., Google, Facebook).
 * @property {string} providerUserId - The unique identifier for the user provided by the OAuth provider.
 * @property {string} userId - The unique identifier for the user within the application.
 */
export interface OAuthAccountsTable {
	provider: string;
	providerUserId: string;
	userId: string;
}

/**
 * Represents a session table in the authentication system.
 *
 * @interface SessionTable
 * @property {string} id - The unique identifier for the session.
 * @property {string} userId - The unique identifier for the user associated with the session.
 * @property {Date} expiresAt - The expiration date and time of the session.
 */
export interface SessionTable {
	id: string;
	userId: string;
	expiresAt: Date;
}

/**
 * Interface representing a table of user permissions.
 *
 * @property {string} user - The username of the individual.
 * @property {string} rank - The rank or role assigned to the user.
 */
export interface PermissionsTable {
	user: string;
	rank: string;
}

/**
 * Represents the session data for a user.
 *
 * @property {boolean} isLoggedIn - Indicates whether the user is logged in.
 * @property {UserTable | null} user - The user data, or null if no user is logged in.
 * @property {'owner' | 'admin' | 'editor' | 'visitor' | 'unknown'} permissionLevel - The permission level of the user.
 */
export type UserSessionData = {
	isLoggedIn: boolean;
	user: UserTable | null;
	permissionLevel: 'owner' | 'admin' | 'editor' | 'visitor' | 'unknown';
};

/**
 * Represents a user session which includes user information and session details.
 *
 * @property {UserTable} user - The user information.
 * @property {SessionTable} session - The session details.
 */
export type UserSession = {
	user: UserTable;
	session: SessionTable;
};

/**
 * Represents the result of a session validation.
 *
 * This type can either be a valid `UserSession` or an object indicating
 * an invalid session with both `session` and `user` properties set to `null`.
 */
export type SessionValidationResult = UserSession | { session: null; user: null };

/**
 * Represents an individual refillable token bucket.
 *
 * @interface RefillBucket
 * @property {number} count - The current token count in the bucket.
 * @property {number} refilledAt - The last timestamp when tokens were refilled.
 */
export interface RefillBucket {
	count: number;
	refilledAt: number;
}

/**
 * Represents a bucket with an expiration mechanism.
 *
 * @interface ExpiringBucket
 * @property {number} count - The number of items in the bucket.
 * @property {number} createdAt - The timestamp when the bucket was created.
 */
export interface ExpiringBucket {
	count: number;
	createdAt: number;
}

/**
 * Interface representing a throttling counter.
 *
 * @property {number} timeout - The duration (in milliseconds) for which the throttling is applied.
 * @property {number} updatedAt - The timestamp (in milliseconds since epoch) when the throttling counter was last updated.
 */
export interface ThrottlingCounter {
	timeout: number;
	updatedAt: number;
}
