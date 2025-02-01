import type {
	tsOAuthAccountsSelect,
	tsPermissionsSelect,
	tsSessionTableSelect,
	tsUsersSelect,
	// @ts-ignore
} from 'studiocms:sdk/types';

/**
 * Represents a table of OAuth accounts.
 *
 * @interface OAuthAccountsTable
 * @property {string} provider - The name of the OAuth provider (e.g., Google, Facebook).
 * @property {string} providerUserId - The unique identifier for the user provided by the OAuth provider.
 * @property {string} userId - The unique identifier for the user within the application.
 */
export interface OAuthAccountsTable extends tsOAuthAccountsSelect {}

/**
 * Interface representing a table of user permissions.
 *
 * @property {string} user - The username of the individual.
 * @property {string} rank - The rank or role assigned to the user.
 */
export interface PermissionsTable extends tsPermissionsSelect {}

/**
 * Represents the session data for a user.
 *
 * @property {boolean} isLoggedIn - Indicates whether the user is logged in.
 * @property {UserTable | null} user - The user data, or null if no user is logged in.
 * @property {'owner' | 'admin' | 'editor' | 'visitor' | 'unknown'} permissionLevel - The permission level of the user.
 */
export type UserSessionData = {
	isLoggedIn: boolean;
	user: tsUsersSelect | null;
	permissionLevel: 'owner' | 'admin' | 'editor' | 'visitor' | 'unknown';
};

/**
 * Represents a user session which includes user information and session details.
 *
 * @property {UserTable} user - The user information.
 * @property {SessionTable} session - The session details.
 */
export type UserSession = {
	user: tsUsersSelect;
	session: tsSessionTableSelect;
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
