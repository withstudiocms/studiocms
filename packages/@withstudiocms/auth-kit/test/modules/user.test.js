import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Effect, runEffect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt, ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import { User } from '../../dist/modules/user.js';
import { UserPermissionLevel } from '../../dist/types.js';
import { makeSessionId } from '../../dist/utils/session.js';

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
	createSession: async (params) => params,
	sessionAndUserData: async (sessionId) => {
		if (sessionId === fakeSessionAndUser.session.id) {
			return await Promise.resolve([fakeSessionAndUser]);
		}
		return await Promise.resolve([]);
	},
	deleteSession: async (_sessionId) => {},
	updateSession: async (_sessionId, data) => [{ ...fakeSession, ...data }],
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

const userTools = {
	createLocalUser: async (data) => ({ ...fakeUser, ...data }),
	createOAuthUser: async (_data) => ({ ...fakeUser }),
	getCurrentPermissions: async (id) =>
		id === fakeUser.id ? { rank: 'admin', user: fakeUser.id } : null,
	getUserByEmail: async (email) =>
		email === fakeUser.email
			? { ...fakeUser, oAuthData: [], permissionsData: { rank: 'admin', user: fakeUser.id } }
			: undefined,
	getUserById: async (id) =>
		id === fakeUser.id
			? { ...fakeUser, oAuthData: [], permissionsData: { rank: 'admin', user: fakeUser.id } }
			: undefined,
	idGenerator: () => 'user-id',
	updateLocalUser: async (_userId, data) => ({ ...fakeUser, ...data }),
	notifier: {
		admin: async (_event, _username) => {},
	},
};

const userConfig = {
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
	test('verifyUsernameInput returns true for valid username', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const result = await runEffect(service.verifyUsernameInput('valid_user'));
		assert.equal(result, true);
	});

	test('verifyUsernameInput returns error string for invalid username', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const result = await runEffect(service.verifyUsernameInput('ab'));
		assert.match(result, /between 3 and 32 characters/);
	});

	test('createUserAvatar returns a valid Libravatar URL', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const url = await runEffect(service.createUserAvatar('test@example.com'));
		assert.equal(typeof url, 'string');
		assert.match(url, /^https:\/\/seccdn\.libravatar\.org\/avatar\/[a-f0-9]+/);
	});

	test('createLocalUser returns a user object', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const user = await runEffect(
			service.createLocalUser('Test User', 'testuser', 'test@example.com', 'password')
		);
		assert.equal(user.username, 'testuser');
		assert.equal(user.email, 'test@example.com');
	});

	test('createOAuthUser returns a user object', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const user = await runEffect(
			service.createOAuthUser(fakeUser, { provider: 'github', providerUserId: '123' })
		);
		assert.equal(user.id, fakeUser.id);
	});

	test('getUserPasswordHash returns the user password', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const hash = await runEffect(service.getUserPasswordHash('user-id'));
		assert.equal(hash, fakeUser.password);
	});

	test('getUserPasswordHash fails if user not found', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const err = await runEffect(service.getUserPasswordHash('notfound')).catch((e) =>
			JSON.stringify(e)
		);
		const parsedErr = JSON.parse(err);
		assert.match(parsedErr.cause._tag, /Fail/);
	});

	test('getUserPasswordHash fails if user has no password', async () => {
		const userToolsNoPass = {
			...userTools,
			getUserById: async () => ({ ...fakeUser, password: null }),
		};
		const config = { ...userConfig, userTools: userToolsNoPass };
		const serviceNoPass = await Effect.runPromise(User(config));
		const err = await runEffect(serviceNoPass.getUserPasswordHash('user-id')).catch((e) =>
			JSON.stringify(e)
		);
		const parsedErr = JSON.parse(err);
		assert.match(parsedErr.cause._tag, /Fail/);
	});

	test('getUserFromEmail returns user for valid email', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const user = await runEffect(service.getUserFromEmail('test@example.com'));
		assert(user);
		assert.equal(user.email, 'test@example.com');
	});

	test('getUserFromEmail returns undefined for invalid email', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const user = await runEffect(service.getUserFromEmail('notfound@example.com'));
		assert.equal(user, undefined);
	});

	test('getUserData returns logged out session if no token', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const context = { cookies: { get: () => undefined } };
		const result = await runEffect(service.getUserData(context));
		assert.equal(result.isLoggedIn, false);
		assert.equal(result.user, null);
	});

	test('getUserData returns logged in session for valid token', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const context = { cookies: { get: (_name) => ({ value: 'valid-session-token' }) } };
		const result = await runEffect(service.getUserData(context));
		assert.equal(result.isLoggedIn, true);
		assert(result.user);
		assert.equal(result.permissionLevel, 'admin');
	});

	test('getUserData returns logged out session if session invalid', async () => {
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
		const result = await runEffect(service.getUserData(context));
		assert.equal(result.isLoggedIn, false);
		assert(cookieDeleted);
	});

	test('getUserPermissionLevel returns correct enum', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const userData = { permissionLevel: 'admin' };
		const level = await runEffect(service.getUserPermissionLevel(userData));
		assert.equal(level, UserPermissionLevel.admin);
	});

	test('isUserAllowed returns true if user has required permission', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const userData = { permissionLevel: 'admin' };
		const allowed = await runEffect(service.isUserAllowed(userData, 'editor'));
		assert.equal(allowed, true);
	});

	test('isUserAllowed returns false if user does not have required permission', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const userData = { permissionLevel: 'visitor' };
		const allowed = await runEffect(service.isUserAllowed(userData, 'admin'));
		assert.equal(allowed, false);
	});
});
