/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Effect, runEffect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt, ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import { describe, expect, it } from 'vitest';
import { User } from '../../src/modules/user.js';
import { type UserConfig, UserPermissionLevel } from '../../src/types.js';
import { makeSessionId } from '../../src/utils/session.js';

// Minimal fake user tools for testing
const fakeUser = {
	id: 'user-id',
	name: 'Test User',
	url: null,
	email: 'test@example.com',
	avatar: null,
	username: 'testuser',
	password: 'hashed-password',
	updatedAt: null,
	createdAt: null,
	emailVerified: true,
	notifications: null,
};
const fakeSession = {
	id: await runEffect(makeSessionId('valid-session-token')),
	userId: 'user-id',
	expiresAt: new Date(Date.now() + 1000 * 60 * 60),
};
const fakeSessionAndUser = {
	session: fakeSession,
	user: fakeUser,
};

const sessionTools = {
	createSession: async (params: any) => params,
	sessionAndUserData: async (sessionId: string) => {
		if (sessionId === fakeSessionAndUser.session.id) {
			return [fakeSessionAndUser];
		}
		return [];
	},
	deleteSession: async (_sessionId: string) => {},
	updateSession: async (_sessionId: string, data: any) => [{ ...fakeSession, ...data }],
};

// Generate a 16-byte base64 key for AES-128-GCM
const keyBytes = new Uint8Array(16);
for (let i = 0; i < 16; i++) keyBytes[i] = i + 1;
const CMS_ENCRYPTION_KEY = Buffer.from(keyBytes).toString('base64');

const scrypt = ScryptConfigOptions({
	encryptionKey: CMS_ENCRYPTION_KEY,
	keylen: 64,
	options: {
		N: 16384,
		r: 8,
		p: 1,
	},
});
/**
 * Scrypt Effect processor
 * @private
 */
const Scrypt = Effect.gen(function* () {
	const { run } = yield* _Scrypt;
	return { run };
}).pipe(Effect.provide(_Scrypt.makeLive(scrypt)));

const userTools: UserConfig['userTools'] = {
	createLocalUser: async (data) => ({ ...fakeUser, ...data }),
	// @ts-expect-error - type mock
	createOAuthUser: async (_data) => ({ ...fakeUser }),
	getCurrentPermissions: async (id: string) =>
		id === fakeUser.id ? { rank: 'admin', user: fakeUser.id } : null,
	getUserByEmail: async (email: string) =>
		email === fakeUser.email
			? { ...fakeUser, oAuthData: [], permissionsData: { rank: 'admin', user: fakeUser.id } }
			: undefined,
	getUserById: async (id: string) =>
		id === fakeUser.id
			? { ...fakeUser, oAuthData: [], permissionsData: { rank: 'admin', user: fakeUser.id } }
			: undefined,
	idGenerator: () => 'user-id',
	updateLocalUser: async (_userId: string, data) => ({ ...fakeUser, ...data }),
	notifier: {
		admin: async (_event: string, _username: string) => {},
	},
};

const userConfig: UserConfig = {
	Scrypt,
	session: {
		expTime: 1000 * 60 * 60,
		cookieName: 'auth_session',
		sessionTools,
	},
	userTools,
};

const serviceBuilder = Effect.gen(function* () {
	const _service = yield* User(userConfig);
	return _service;
});

describe('User Module', () => {
	it('verifyUsernameInput returns true for valid username', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const result = await runEffect(service.verifyUsernameInput('valid_user'));
		expect(result).toBe(true);
	});

	it('verifyUsernameInput returns error string for invalid username', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const result = await runEffect(service.verifyUsernameInput('ab'));
		expect(result).toMatch(/between 3 and 32 characters/);
	});

	it('createUserAvatar returns a valid Libravatar URL', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const url = await runEffect(service.createUserAvatar('test@example.com'));
		expect(typeof url).toBe('string');
		expect(url).toMatch(/^https:\/\/seccdn\.libravatar\.org\/avatar\/[a-f0-9]+/);
	});

	it('createLocalUser returns a user object', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const user = await runEffect(
			service.createLocalUser('Test User', 'testuser', 'test@example.com', 'password')
		);
		expect(user.username).toBe('testuser');
		expect(user.email).toBe('test@example.com');
	});

	it('createOAuthUser returns a user object', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const user = await runEffect(
			service.createOAuthUser(fakeUser, { provider: 'github', providerUserId: '123' })
		);
		expect(user.id).toBe(fakeUser.id);
	});

	it('getUserPasswordHash returns the user password', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const hash = await runEffect(service.getUserPasswordHash('user-id'));
		expect(hash).toBe(fakeUser.password);
	});

	it('getUserPasswordHash fails if user not found', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		let err: any;
		try {
			await runEffect(service.getUserPasswordHash('notfound'));
		} catch (e) {
			err = e;
		}
		expect(JSON.stringify(err)).toMatch(/Fail/);
	});

	it('getUserPasswordHash fails if user has no password', async () => {
		const userToolsNoPass = {
			...userTools,
			getUserById: async () => ({ ...fakeUser, password: null }),
		};
		const config = { ...userConfig, userTools: userToolsNoPass };
		// @ts-expect-error mock
		const serviceNoPass = await Effect.runPromise(User(config));
		let err: any;
		try {
			await runEffect(serviceNoPass.getUserPasswordHash('user-id'));
		} catch (e) {
			err = e;
		}
		expect(JSON.stringify(err)).toMatch(/Fail/);
	});

	it('getUserFromEmail returns user for valid email', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const user = await runEffect(service.getUserFromEmail('test@example.com'));
		expect(user).toBeTruthy();
		expect(user?.email).toBe('test@example.com');
	});

	it('getUserFromEmail returns undefined for invalid email', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const user = await runEffect(service.getUserFromEmail('notfound@example.com'));
		expect(user).toBeUndefined();
	});

	it('getUserData returns logged out session if no token', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const context = { cookies: { get: () => undefined } };
		// @ts-expect-error - mocked type
		const result = await runEffect(service.getUserData(context));
		expect(result.isLoggedIn).toBe(false);
		expect(result.user).toBe(null);
	});

	it('getUserData returns logged in session for valid token', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const context = { cookies: { get: (_name: string) => ({ value: 'valid-session-token' }) } };
		// @ts-expect-error - mocked type
		const result = await runEffect(service.getUserData(context));
		expect(result.isLoggedIn).toBe(true);
		expect(result.user).toBeTruthy();
		expect(result.permissionLevel).toBe('admin');
	});

	it('getUserData returns logged out session if session invalid', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		let cookieDeleted = false;
		const context = {
			cookies: {
				get: () => ({ value: 'invalid-session-token' }),
				set: () => {
					cookieDeleted = true;
				},
			},
		};
		// @ts-expect-error - mocked type
		const result = await runEffect(service.getUserData(context));
		expect(result.isLoggedIn).toBe(false);
		expect(cookieDeleted).toBe(true);
	});

	it('getUserPermissionLevel returns correct enum', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const userData = { permissionLevel: 'admin' as const };
		// @ts-expect-error - mocked type
		const level = await runEffect(service.getUserPermissionLevel(userData));
		expect(level).toBe(UserPermissionLevel.admin);
	});

	it('isUserAllowed returns true if user has required permission', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const userData = { permissionLevel: 'admin' as const };
		// @ts-expect-error - mocked type
		const allowed = await runEffect(service.isUserAllowed(userData, 'editor'));
		expect(allowed).toBe(true);
	});

	it('isUserAllowed returns false if user does not have required permission', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const userData = { permissionLevel: 'visitor' as const };
		// @ts-expect-error - mocked type
		const allowed = await runEffect(service.isUserAllowed(userData, 'admin'));
		expect(allowed).toBe(false);
	});
});
