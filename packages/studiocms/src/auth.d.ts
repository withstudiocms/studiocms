declare module 'studiocms:auth/utils/authEnvCheck' {
	export const authEnvCheck: typeof import('./utils/authEnvCheck.js').authEnvCheck;
}

declare module 'studiocms:auth/utils/validImages' {
	export const validImages: typeof import('./utils/validImages.js').validImages;
}

declare module 'studiocms:auth/utils/getLabelForPermissionLevel' {
	export const getLabelForPermissionLevel: typeof import(
		'./utils/getLabelForPermissionLevel.js'
	).getLabelForPermissionLevel;
}

declare module 'studiocms:auth/scripts/three' {
	/**
	 * This module should be imported within a script tag.
	 * @example <script>import "studiocms:auth/scripts/three";</script>
	 */

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const defaultExport: any;
	export default defaultExport;
}

declare module 'studiocms:auth/scripts/formListener' {
	export const formListener: typeof import('./scripts/formListener.js').formListener;
}

declare module 'studiocms:auth/lib/encryption' {
	/**
	 * Encrypts the given data using AES-128-GCM encryption.
	 *
	 * @param data - The data to be encrypted as a Uint8Array.
	 * @returns The encrypted data as a Uint8Array, which includes the initialization vector (IV), the encrypted content, and the authentication tag.
	 */
	export const encrypt: typeof import('./lib/auth/encryption.js').encrypt;
	/**
	 * Encrypts a given string and returns the encrypted data as a Uint8Array.
	 *
	 * @param data - The string to be encrypted.
	 * @returns The encrypted data as a Uint8Array.
	 */
	export const encryptString: typeof import('./lib/auth/encryption.js').encryptString;
	/**
	 * Decrypts the given encrypted data using AES-128-GCM.
	 *
	 * @param encrypted - The encrypted data as a Uint8Array. The data must be at least 33 bytes long.
	 * @returns The decrypted data as a Uint8Array.
	 * @throws Will throw an error if the encrypted data is less than 33 bytes.
	 */
	export const decrypt: typeof import('./lib/auth/encryption.js').decrypt;
	/**
	 * Decrypts the given Uint8Array data and returns the result as a string.
	 *
	 * @param data - The encrypted data as a Uint8Array.
	 * @returns The decrypted data as a string.
	 */
	export const decryptToString: typeof import('./lib/auth/encryption.js').decryptToString;
}

declare module 'studiocms:auth/lib/password' {
	/**
	 * Hashes a plain text password using bcrypt.
	 *
	 * @param password - The plain text password to hash.
	 * @returns A promise that resolves to the hashed password.
	 */
	export const hashPassword: typeof import('./lib/auth/password.js').hashPassword;
	/**
	 * Verifies if the provided password matches the hashed password.
	 *
	 * @param hash - The hashed password to compare against.
	 * @param password - The plain text password to verify.
	 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
	 */
	export const verifyPasswordHash: typeof import('./lib/auth/password.js').verifyPasswordHash;
	/**
	 * Verifies the strength of a given password.
	 *
	 * The password must meet the following criteria:
	 * - Be between 6 and 255 characters in length.
	 * - Not be a known unsafe password.
	 * - Not be found in the pwned password database.
	 *
	 * @param password - The password to verify.
	 * @returns A promise that resolves to `true` if the password is strong/secure enough, otherwise `false`.
	 */
	export const verifyPasswordStrength: typeof import(
		'./lib/auth/password.js'
	).verifyPasswordStrength;
}

declare module 'studiocms:auth/lib/rate-limit' {
	/**
	 * Represents a token bucket that refills tokens at a specified interval.
	 * Used to control access to resources by limiting the number of tokens
	 * that can be consumed over time.
	 *
	 * @template _Key - The type of key used to identify individual token buckets.
	 */
	export class RefillingTokenBucket<_Key> {
		/**
		 * The maximum number of tokens that the bucket can hold.
		 * @type {number}
		 */
		public max: number;
		/**
		 * The interval in seconds at which tokens are refilled.
		 * @type {number}
		 */
		public refillIntervalSeconds: number;
		/**
		 * Initializes a new instance of the RefillingTokenBucket class.
		 *
		 * @param {number} max - The maximum number of tokens the bucket can hold.
		 * @param {number} refillIntervalSeconds - The refill interval in seconds.
		 */
		constructor(max: number, refillIntervalSeconds: number);
		/**
		 * A map storing individual token buckets associated with specific keys.
		 * @private
		 */
		private storage;
		/**
		 * Checks if there are enough tokens available in the bucket for the specified key and cost.
		 *
		 * @param {_Key} key - The key associated with the token bucket.
		 * @param {number} cost - The number of tokens required.
		 * @returns {boolean} - Returns 'true' if there are enough tokens; otherwise, 'false'.
		 */
		public check(key: _Key, cost: number): boolean;
		/**
		 * Consumes tokens from the bucket for the specified key and cost.
		 *
		 * @param {_Key} key - The key associated with the token bucket.
		 * @param {number} cost - The number of tokens to consume.
		 * @returns {boolean} - Returns 'true' if tokens were successfully consumed; otherwise, 'false'.
		 */
		public consume(key: _Key, cost: number): boolean;
	}

	/**
	 * Represents a throttler that limits the frequency of actions performed with a specified key.
	 * Uses incremental timeouts to delay repeated actions.
	 *
	 * @template _Key - The type of key used to identify throttling counters.
	 */
	export class Throttler<_Key> {
		/**
		 * Array of timeout durations (in seconds) for each consecutive attempt.
		 * @type {number[]}
		 */
		public timeoutSeconds: number[];
		/**
		 * A map storing individual throttling counters associated with specific keys.
		 * @private
		 */
		private storage;
		/**
		 * Initializes a new instance of the Throttler class.
		 *
		 * @param {number[]} timeoutSeconds - Array of timeout durations in seconds for each consecutive attempt.
		 */
		constructor(timeoutSeconds: number[]);
		/**
		 * Attempts to consume an action for the specified key.
		 *
		 * @param {_Key} key - The key associated with the throttling counter.
		 * @returns {boolean} - Returns 'true' if the action is allowed; otherwise, 'false'.
		 */
		public consume(key: _Key): boolean;
		/**
		 * Resets the throttling counter for a specified key.
		 *
		 * @param {_Key} key - The key associated with the throttling counter to reset.
		 */
		public reset(key: _Key): void;
	}

	/**
	 * Represents a token bucket with tokens that expire after a specified duration.
	 * Used to control access to resources with tokens that reset after expiration.
	 *
	 * @template _Key - The type of key used to identify individual token buckets.
	 */
	export class ExpiringTokenBucket<_Key> {
		/**
		 * The maximum number of tokens the bucket can hold.
		 * @type {number}
		 */
		public max: number;
		/**
		 * The duration (in seconds) after which tokens in the bucket expire.
		 * @type {number}
		 */
		public expirationSeconds: number;
		/**
		 * A map storing individual expiring token buckets associated with specific keys.
		 * @private
		 */
		constructor(max: number, expirationSeconds: number);
		/**
		 * Initializes a new instance of the ExpiringTokenBucket class.
		 *
		 * @param {number} max - The maximum number of tokens the bucket can hold.
		 * @param {number} expiresInSeconds - The duration in seconds after which tokens expire.
		 */
		private storage;
		/**
		 * Checks if there are enough tokens available in the bucket for the specified key and cost.
		 *
		 * @param {_Key} key - The key associated with the token bucket.
		 * @param {number} cost - The number of tokens required.
		 * @returns {boolean} - Returns 'true' if there are enough tokens or if the tokens have expired; otherwise, 'false'.
		 */
		public check(key: _Key, cost: number): boolean;
		/**
		 * Consumes tokens from the bucket for the specified key and cost.
		 *
		 * @param {_Key} key - The key associated with the token bucket.
		 * @param {number} cost - The number of tokens to consume.
		 * @returns {boolean} - Returns 'true' if tokens were successfully consumed; otherwise, 'false'.
		 */
		public consume(key: _Key, cost: number): boolean;
		/**
		 * Resets the token bucket for a specified key, removing all tokens.
		 *
		 * @param {_Key} key - The key associated with the token bucket to reset.
		 */
		public reset(key: _Key): void;
	}
}
declare module 'studiocms:auth/lib/session' {
	/**
	 * Generates a new session token.
	 *
	 * @returns The generated session token as a string.
	 */
	export const generateSessionToken: typeof import('./lib/auth/session.js').generateSessionToken;
	/**
	 * The name of the cookie used to store the authentication session.
	 *
	 * @constant {string}
	 */
	export const sessionCookieName: typeof import('./lib/auth/session.js').sessionCookieName;
	/**
	 * Creates a new session for a user.
	 *
	 * @param token - The token used to create the session.
	 * @param userId - The ID of the user for whom the session is being created.
	 * @returns A promise that resolves to the created session object.
	 */
	export const createSession: typeof import('./lib/auth/session.js').createSession;
	/**
	 * Validates a session token by checking its existence and expiration in the database.
	 * If the session is valid but close to expiration, it extends the session expiration time.
	 * If the session is expired, it deletes the session from the database.
	 *
	 * @param token - The session token to validate.
	 * @returns A promise that resolves to an object containing the session and user information. If the session is invalid or expired, both session and user will be null.
	 */
	export const validateSessionToken: typeof import('./lib/auth/session.js').validateSessionToken;
	/**
	 * Invalidates a session by deleting it from the database.
	 *
	 * @param token - The session token to invalidate.
	 * @returns A promise that resolves to `true` if the session was successfully invalidated; otherwise, `false`.
	 */
	export const invalidateSession: typeof import('./lib/auth/session.js').invalidateSession;
	/**
	 * Sets the session token cookie in the response object.
	 *
	 * @param context - The context object containing the request and response objects.
	 * @param token - The session token to set in the cookie.
	 * @param expiresAt - The expiration date and time of the session token.
	 */
	export const setSessionTokenCookie: typeof import('./lib/auth/session.js').setSessionTokenCookie;
	/**
	 * Deletes the session token cookie from the response object.
	 *
	 * @param context - The context object containing the request and response objects.
	 */
	export const deleteSessionTokenCookie: typeof import(
		'./lib/auth/session.js'
	).deleteSessionTokenCookie;
	/**
	 * Sets the OAuth session token cookie in the response object.
	 *
	 * @param context - The context object containing the request and response objects.
	 * @param key - The name of the cookie to set.
	 * @param expiresAt - The expiration date and time of the session token.
	 */
	export const setOAuthSessionTokenCookie: typeof import(
		'./lib/auth/session.js'
	).setOAuthSessionTokenCookie;
	/**
	 * Generates a new expiration date for a session.
	 *
	 * @returns The expiration date calculated by adding the session expiration time to the current date and time.
	 */
	export const makeExpirationDate: typeof import('./lib/auth/session.js').makeExpirationDate;
	/**
	 * The session expiration time in milliseconds.
	 * This value represents 14 days.
	 */
	export const sessionExpTime: typeof import('./lib/auth/session.js').sessionExpTime;
	/**
	 * Creates a new user session.
	 *
	 * @param userId - The ID of the user to create the session for.
	 * @param context - The context object containing the request and response objects.
	 * @returns A promise that resolves to the created session object.
	 */
	export const createUserSession: typeof import('./lib/auth/session.js').createUserSession;
}

declare module 'studiocms:auth/lib/types' {
	/**
	 * Represents a table of OAuth accounts.
	 *
	 * @interface OAuthAccountsTable
	 * @property {string} provider - The name of the OAuth provider (e.g., Google, Facebook).
	 * @property {string} providerUserId - The unique identifier for the user provided by the OAuth provider.
	 * @property {string} userId - The unique identifier for the user within the application.
	 */
	export type OAuthAccountsTable = import('./lib/auth/types.js').OAuthAccountsTable;
	/**
	 * Interface representing a table of user permissions.
	 *
	 * @interface PermissionsTable
	 * @property {string} user - The username of the individual.
	 * @property {string} rank - The rank or role assigned to the user.
	 */
	export type PermissionsTable = import('./lib/auth/types.js').PermissionsTable;
	/**
	 * Represents the session data for a user.
	 *
	 * @property {boolean} isLoggedIn - Indicates whether the user is logged in.
	 * @property {UserTable | null} user - The user data, or null if no user is logged in.
	 * @property {'owner' | 'admin' | 'editor' | 'visitor' | 'unknown'} permissionLevel - The permission level of the user.
	 */
	export type UserSessionData = import('./lib/auth/types.js').UserSessionData;
	/**
	 * Represents a user session which includes user information and session details.
	 *
	 * @property {UserTable} user - The user data.
	 * @property {SessionTable} session - The session data.
	 */
	export type UserSession = import('./lib/auth/types.js').UserSession;
	/**
	 * Represents the result of validating a session token.
	 *
	 * This type can either be a valid `UserSession` or an object indicating an invalid session with both `session` and `user` properties set to `null`.
	 */
	export type SessionValidationResult = import('./lib/auth/types.js').SessionValidationResult;
	/**
	 * Represents an individual refillable token bucket.
	 *
	 * @interface RefillBucket
	 * @property {number} count - The current token count in the bucket.
	 * @property {number} refillAt - The time at which the bucket was last refilled.
	 */
	export type RefillBucket = import('./lib/auth/types.js').RefillBucket;
	/**
	 * Represents a bucket with an expiration mechanism.
	 *
	 * @interface ExpiringBucket
	 * @property {number} count - The current token count in the bucket.
	 * @property {number} createdAt - The timestamp when the bucket was created.
	 */
	export type ExpiringBucket = import('./lib/auth/types.js').ExpiringBucket;
	/**
	 * Interface representing a throttling counter.
	 *
	 * @interface ThrottlingCounter
	 * @property {number} timeout - The duration (in milliseconds) for which the throttling is applied.
	 * @property {number} updatedAt - The timestamp (in milliseconds since epoch) when the throttling counter was last updated.
	 */
	export type ThrottlingCounter = import('./lib/auth/types.js').ThrottlingCounter;
}

declare module 'studiocms:auth/lib/user' {
	export const verifyUsernameInput: typeof import('./lib/auth/user.js').verifyUsernameInput;
	export const createUserAvatar: typeof import('./lib/auth/user.js').createUserAvatar;
	export const createLocalUser: typeof import('./lib/auth/user.js').createLocalUser;
	export const createOAuthUser: typeof import('./lib/auth/user.js').createOAuthUser;
	export const updateUserPassword: typeof import('./lib/auth/user.js').updateUserPassword;
	export const getUserPasswordHash: typeof import('./lib/auth/user.js').getUserPasswordHash;
	export const getUserFromEmail: typeof import('./lib/auth/user.js').getUserFromEmail;
	export const getUserData: typeof import('./lib/auth/user.js').getUserData;
	export const permissionRanksMap: typeof import('./lib/auth/user.js').permissionRanksMap;
	export const verifyUserPermissionLevel: typeof import(
		'./lib/auth/user.js'
	).verifyUserPermissionLevel;
	export const LinkNewOAuthCookieName: typeof import('./lib/auth/user.js').LinkNewOAuthCookieName;
}
