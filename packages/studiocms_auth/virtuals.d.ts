/// <reference types="../studiocms_core/virtuals.d.ts" />

declare module 'studiocms:auth/lib/encryption' {
	export const encrypt: typeof import('./src/lib/encryption').encrypt;
	export const encryptString: typeof import('./src/lib/encryption').encryptString;
	export const decrypt: typeof import('./src/lib/encryption').decrypt;
	export const decryptToString: typeof import('./src/lib/encryption').decryptToString;
}

declare module 'studiocms:auth/lib/password' {
	export const hashPassword: typeof import('./src/lib/password').hashPassword;
	export const verifyPasswordHash: typeof import('./src/lib/password').verifyPasswordHash;
	export const verifyPasswordStrength: typeof import('./src/lib/password').verifyPasswordStrength;
}

declare module 'studiocms:auth/lib/rate-limit' {
	export class RefillingTokenBucket<_Key> {
		public max: number;
		public refillIntervalSeconds: number;
		constructor(max: number, refillIntervalSeconds: number);
		private storage;
		public check(key: _Key, cost: number): boolean;
		public consume(key: _Key, cost: number): boolean;
	}

	export class Throttler<_Key> {
		public timeoutSeconds: number[];
		private storage;
		constructor(timeoutSeconds: number[]);
		public consume(key: _Key): boolean;
	}

	export class ExpiringTokenBucket<_Key> {
		public max: number;
		public expirationSeconds: number;
		constructor(max: number, expirationSeconds: number);
		private storage;
		public check(key: _Key, cost: number): boolean;
		public consume(key: _Key, cost: number): boolean;
	}
}

declare module 'studiocms:auth/lib/session' {
	export const generateSessionToken: typeof import('./src/lib/session').generateSessionToken;
	export const sessionCookieName: typeof import('./src/lib/session').sessionCookieName;
	export const createSession: typeof import('./src/lib/session').createSession;
	export const validateSessionToken: typeof import('./src/lib/session').validateSessionToken;
	export const invalidateSession: typeof import('./src/lib/session').invalidateSession;
	export const setSessionTokenCookie: typeof import('./src/lib/session').setSessionTokenCookie;
	export const deleteSessionTokenCookie: typeof import(
		'./src/lib/session'
	).deleteSessionTokenCookie;
	export const setOAuthSessionTokenCookie: typeof import(
		'./src/lib/session'
	).setOAuthSessionTokenCookie;
	export const makeExpirationDate: typeof import('./src/lib/session').makeExpirationDate;
	export const sessionExpTime: typeof import('./src/lib/session').sessionExpTime;
	export const createUserSession: typeof import('./src/lib/session').createUserSession;
}

declare module 'studiocms:auth/lib/types' {
	export type UserTable = import('./src/lib/types').UserTable;
	export type SessionTable = import('./src/lib/types').SessionTable;
	export type OAuthAccountsTable = import('./src/lib/types').OAuthAccountsTable;
	export type PermissionsTable = import('./src/lib/types').PermissionsTable;
	export type UserSessionData = import('./src/lib/types').UserSessionData;
	export type UserSession = import('./src/lib/types').UserSession;
	export type SessionValidationResult = import('./src/lib/types').SessionValidationResult;
	export type RefillBucket = import('./src/lib/types').RefillBucket;
	export type ExpiringBucket = import('./src/lib/types').ExpiringBucket;
	export type ThrottlingCounter = import('./src/lib/types').ThrottlingCounter;
}

declare module 'studiocms:auth/lib/user' {
	export const verifyUsernameInput: typeof import('./src/lib/user').verifyUsernameInput;
	export const createUserAvatar: typeof import('./src/lib/user').createUserAvatar;
	export const createLocalUser: typeof import('./src/lib/user').createLocalUser;
	export const createOAuthUser: typeof import('./src/lib/user').createOAuthUser;
	export const updateUserPassword: typeof import('./src/lib/user').updateUserPassword;
	export const getUserPasswordHash: typeof import('./src/lib/user').getUserPasswordHash;
	export const getUserFromEmail: typeof import('./src/lib/user').getUserFromEmail;
	export const getUserData: typeof import('./src/lib/user').getUserData;
	export const permissionRanksMap: typeof import('./src/lib/user').permissionRanksMap;
	export const verifyUserPermissionLevel: typeof import('./src/lib/user').verifyUserPermissionLevel;
	export const LinkNewOAuthCookieName: typeof import('./src/lib/user').LinkNewOAuthCookieName;
}

declare module 'studiocms:auth/utils/authEnvCheck' {
	export const authEnvCheck: typeof import('./src/utils/authEnvCheck').authEnvCheck;
}

declare module 'studiocms:auth/utils/validImages' {
	export const validImages: typeof import('./src/utils/validImages').validImages;
}

declare module 'studiocms:auth/utils/getLabelForPermissionLevel' {
	export const validImages: typeof import(
		'./src/utils/getLabelForPermissionLevel'
	).getLabelForPermissionLevel;
}

declare module 'studiocms:auth/scripts/three' {
	/**
	 * This module should be imported within a script tag.
	 * @example <script>import "studiocms:auth/scripts/three";</script>
	 */

	// biome-ignore lint/suspicious/noExplicitAny: this is a module without exports, see example above for usage. (The export is not real and this is just to present the module in the type definitions)
	const mod: any;
	export default mod;
}

declare module 'studiocms:auth/scripts/formListener' {
	export const formListener: typeof import('./src/scripts/formListener').formListener;
}

// // // // // End of Auth Module // // // // //
