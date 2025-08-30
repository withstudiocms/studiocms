import type { BinaryLike } from 'node:crypto';
import type { Effect } from '@withstudiocms/effect';
import type { ScryptError } from '@withstudiocms/effect/scrypt';

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
	username: string;
	id?: string | undefined;
	url?: string | null | undefined;
	email?: string | null | undefined;
	avatar?: string | null | undefined;
	password?: string | null | undefined;
	updatedAt?: Date | null | undefined;
	createdAt?: Date | null | undefined;
	emailVerified?: boolean | undefined;
	notifications?: string | null | undefined;
}

/**
 * Represents the data associated with an OAuth authentication event.
 *
 * @property userId - The unique identifier of the user in the local system.
 * @property provider - The name of the OAuth provider (e.g., 'google', 'github').
 * @property providerUserId - The unique identifier of the user as provided by the OAuth provider.
 */
export interface OAuthData {
	userId: string;
	provider: string;
	providerUserId: string;
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
export const availablePermissionRanks = ['owner', 'admin', 'editor', 'visitor', 'unknown'] as const;

/**
 * Represents the available permission ranks for a user.
 *
 * This type is derived from the `availablePermissionRanks` array,
 * and it includes all the possible values that a user can have as a permission rank.
 */
export type AvailablePermissionRanks = (typeof availablePermissionRanks)[number];

/**
 * Represents the permissions data for a user.
 *
 * @property user - The unique identifier of the user.
 * @property rank - The permission rank assigned to the user.
 */
export interface PermissionsData {
	user: string;
	rank: AvailablePermissionRanks;
}

type Present<T> = { [K in keyof T]-?: Exclude<T[K], undefined> };

/**
 * Represents the session data for a user.
 *
 * @property isLoggedIn - Indicates whether the user is currently logged in.
 * @property user - The user data object, or `null` if no user is logged in.
 * @property permissionLevel - The user's permission level, represented by an available permission rank.
 */
export type UserSessionData = {
	isLoggedIn: boolean;
	user: Present<UserData> | null;
	permissionLevel: AvailablePermissionRanks;
};

/**
 * Represents a user object that combines base user data with optional OAuth and permissions data.
 *
 * @extends UserData
 * @property {OAuthData[] | undefined} oAuthData - An array of OAuth provider data associated with the user, or undefined if not available.
 * @property {PermissionsData | undefined} permissionsData - The permissions data for the user, or undefined if not available.
 */
export interface CombinedUserData extends UserData {
	oAuthData: OAuthData[] | undefined;
	permissionsData: PermissionsData | undefined;
}

/**
 * Represents the combined session and user data.
 *
 * @property session - The current user's session information.
 * @property user - The current user's profile and related data.
 */
export interface SessionAndUserData {
	session: UserSession;
	user: Present<UserData>;
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
	updateSession(sessionId: string, data: UserSession): Promise<UserSession[]>;
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
 * Provides utility methods for user management and notification within the authentication system.
 *
 * @remarks
 * This interface defines methods for creating, updating, and retrieving user data,
 * as well as generating unique IDs and sending notifications to administrators.
 */
export interface UserTools {
	idGenerator(): string;
	notifier?: {
		admin(type: 'new_user', message: string): Promise<void>;
	};
	createLocalUser(data: UserData): Promise<Present<UserData>>;
	createOAuthUser(data: { provider: string; providerUserId: string; userId: string }): Promise<{
		userId: string;
		provider: string;
		providerUserId: string;
	}>;
	updateLocalUser(id: string, data: Partial<UserData>): Promise<Present<UserData>>;
	getUserById(id: string): Promise<CombinedUserData | undefined | null>;
	getUserByEmail(email: string): Promise<CombinedUserData | undefined | null>;
	getCurrentPermissions(userId: string): Promise<PermissionsData | undefined | null>;
}

/**
 * Configuration options for user authentication and session management.
 *
 * @property Scrypt - The Scrypt configuration used for password hashing.
 * @property session - The required session configuration object.
 * @property userTools - Optional utilities or tools related to user management.
 */
export interface UserConfig {
	Scrypt: IScrypt;
	session: Required<SessionConfig>;
	userTools?: UserTools;
}

/**
 * An enumeration representing different user permission levels.
 *
 * The permission levels are defined as follows:
 * - visitor: 1
 * - editor: 2
 * - admin: 3
 * - owner: 4
 * - unknown: 0
 */
export enum UserPermissionLevel {
	visitor = 1,
	editor = 2,
	admin = 3,
	owner = 4,
	unknown = 0,
}
