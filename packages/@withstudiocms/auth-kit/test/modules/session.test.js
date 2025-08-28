import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Effect, runEffect } from '@withstudiocms/effect';
import { Session } from '../../dist/modules/session.js';
import { makeSessionId } from '../../dist/utils/session.js';

// Minimal fake session tools for testing
const now = Date.now();
const fakeSession = {
	id: 'session-id',
	userId: 'user-id',
	expiresAt: new Date(now + 1000 * 60 * 60 * 3),
};
const fakeUser = {
	id: 'user-id',
	name: 'Test User',
	url: null,
	email: 'test@example.com',
	avatar: null,
	username: 'testuser',
	password: null,
	updatedAt: null,
	createdAt: null,
	emailVerified: true,
	notifications: null,
};
const fakeSessionAndUser = {
	session: {
		id: await runEffect(makeSessionId('valid-session-token')),
		userId: fakeSession.userId,
		expiresAt: fakeSession.expiresAt,
	},
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

const config = {
	expTime: 1000 * 60 * 60,
	cookieName: 'auth_session',
	sessionTools,
};

describe('Session Module', () => {
	test('generateSessionToken returns a base32 string', async () => {
		const service = await Effect.runPromise(Session(config));
		const token = await runEffect(service.generateSessionToken());
		assert.equal(typeof token, 'string');
		assert.match(token, /^[a-z2-7]+$/); // base32 chars
		assert(token.length >= 32);
	});

	test('createSession returns a UserSession', async () => {
		const service = await Effect.runPromise(Session(config));
		const token = 'token';
		const userId = 'user-id';
		const session = await runEffect(service.createSession(token, userId));
		assert.equal(session.userId, userId);
		assert(session.expiresAt instanceof Date);
	});

	test('validateSessionToken returns null session for invalid token', async () => {
		const service = await Effect.runPromise(Session(config));
		const result = await runEffect(service.validateSessionToken('invalid-session-id'));
		assert.deepEqual(result, { session: null, user: null });
	});

	test('validateSessionToken returns session and user for valid token', async () => {
		const service = await Effect.runPromise(Session(config));
		// The sessionAndUserData mock returns a session for 'valid-session-id'
		const result = await runEffect(service.validateSessionToken('valid-session-token'));

		assert(result.session && result.user);
		assert.equal(result.session.id, fakeSessionAndUser.session.id);
		assert.equal(result.user.id, fakeUser.id);
	});

	test('invalidateSession calls deleteSession', async () => {
		let called = false;
		const customTools = {
			...sessionTools,
			deleteSession: async () => {
				called = true;
			},
		};
		const service = await Effect.runPromise(Session({ ...config, sessionTools: customTools }));
		await runEffect(service.invalidateSession('session-id'));
		assert.equal(called, true);
	});

	test('setSessionTokenCookie sets cookie on context', async () => {
		let cookieSet = false;
		const context = {
			cookies: {
				set: (name, value, opts) => {
					cookieSet = true;
					assert.equal(name, config.cookieName);
					assert.equal(typeof value, 'string');
					assert(opts.httpOnly);
					assert(opts.path === '/');
				},
			},
		};
		const service = await Effect.runPromise(Session(config));
		await runEffect(
			service.setSessionTokenCookie(context, 'token', new Date(Date.now() + 1000), true)
		);
		assert(cookieSet);
	});

	test('deleteSessionTokenCookie sets cookie with empty value and maxAge 0', async () => {
		let opts = {};
		const context = {
			cookies: {
				set: (_name, value, options) => {
					opts = options;
					assert.equal(value, '');
				},
			},
		};
		const service = await Effect.runPromise(Session(config));
		await runEffect(service.deleteSessionTokenCookie(context, true));
		assert.equal(opts.maxAge, 0);
		assert(opts.httpOnly);
	});

	test('setOAuthSessionTokenCookie sets OAuth cookie', async () => {
		let called = false;
		const context = {
			cookies: {
				set: (key, value, opts) => {
					called = true;
					assert.equal(key, 'oauth_cookie');
					assert.equal(value, 'oauth_value');
					assert(opts.httpOnly);
					assert(opts.maxAge, 600);
				},
			},
		};
		const service = await Effect.runPromise(Session(config));
		await runEffect(
			service.setOAuthSessionTokenCookie(context, 'oauth_cookie', 'oauth_value', true)
		);
		assert(called);
	});

	test('createUserSession creates session and sets cookie', async () => {
		let cookieSet = false;
		const context = {
			cookies: {
				set: () => {
					cookieSet = true;
				},
			},
		};
		const service = await Effect.runPromise(Session(config));
		await runEffect(service.createUserSession('user-id', context, true));
		assert(cookieSet);
	});
});
