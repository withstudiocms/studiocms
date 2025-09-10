/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Effect, runEffect } from '@withstudiocms/effect';
import { describe, expect, it } from 'vitest';
import { Session } from '../../src/modules/session.js';
import type { SessionConfig } from '../../src/types.js';
import { makeSessionId } from '../../src/utils/session.js';

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

const sessionTools: SessionConfig['sessionTools'] = {
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

const config: SessionConfig = {
	expTime: 1000 * 60 * 60,
	cookieName: 'auth_session',
	sessionTools,
};

describe('Session Module', () => {
	it('generateSessionToken returns a base32 string', async () => {
		const service = await Effect.runPromise(Session(config));
		const token = await runEffect(service.generateSessionToken());
		expect(typeof token).toBe('string');
		expect(token).toMatch(/^[a-z2-7]+$/); // base32 chars
		expect(token.length).toBeGreaterThanOrEqual(32);
	});

	it('createSession returns a UserSession', async () => {
		const service = await Effect.runPromise(Session(config));
		const token = 'token';
		const userId = 'user-id';
		const session = await runEffect(service.createSession(token, userId));
		expect(session.userId).toBe(userId);
		expect(session.expiresAt).toBeInstanceOf(Date);
	});

	it('validateSessionToken returns null session for invalid token', async () => {
		const service = await Effect.runPromise(Session(config));
		const result = await runEffect(service.validateSessionToken('invalid-session-id'));
		expect(result).toStrictEqual({ session: null, user: null });
	});

	it('validateSessionToken returns session and user for valid token', async () => {
		const service = await Effect.runPromise(Session(config));
		const result = await runEffect(service.validateSessionToken('valid-session-token'));
		expect(result.session && result.user).toBeTruthy();
		expect(result.session?.id).toBe(fakeSessionAndUser.session.id);
		expect(result.user?.id).toBe(fakeUser.id);
	});

	it('invalidateSession calls deleteSession', async () => {
		let called = false;
		const customTools = {
			...sessionTools,
			deleteSession: async () => {
				called = true;
			},
		};
		const service = await Effect.runPromise(Session({ ...config, sessionTools: customTools }));
		await runEffect(service.invalidateSession('session-id'));
		expect(called).toBe(true);
	});

	it('setSessionTokenCookie sets cookie on context', async () => {
		let cookieSet = false;
		const context = {
			cookies: {
				set: (name: string, value: string, opts: any) => {
					cookieSet = true;
					expect(name).toBe(config.cookieName);
					expect(typeof value).toBe('string');
					expect(opts.httpOnly).toBeTruthy();
					expect(opts.path).toBe('/');
				},
			},
		};
		const service = await Effect.runPromise(Session(config));
		await runEffect(
			service.setSessionTokenCookie(context as any, 'token', new Date(Date.now() + 1000), true)
		);
		expect(cookieSet).toBe(true);
	});

	it('deleteSessionTokenCookie sets cookie with empty value and maxAge 0', async () => {
		let opts: any = {};
		const context = {
			cookies: {
				set: (_name: string, value: string, options: any) => {
					opts = options;
					expect(value).toBe('');
				},
			},
		};
		const service = await Effect.runPromise(Session(config));
		await runEffect(service.deleteSessionTokenCookie(context as any, true));
		expect(opts.maxAge).toBe(0);
		expect(opts.httpOnly).toBeTruthy();
	});

	it('setOAuthSessionTokenCookie sets OAuth cookie', async () => {
		let called = false;
		const context = {
			cookies: {
				set: (key: string, value: string, opts: any) => {
					called = true;
					expect(key).toBe('oauth_cookie');
					expect(value).toBe('oauth_value');
					expect(opts.httpOnly).toBeTruthy();
					expect(opts.maxAge).toBe(600);
				},
			},
		};
		const service = await Effect.runPromise(Session(config));
		await runEffect(
			service.setOAuthSessionTokenCookie(context as any, 'oauth_cookie', 'oauth_value', true)
		);
		expect(called).toBe(true);
	});

	it('createUserSession creates session and sets cookie', async () => {
		let cookieSet = false;
		const context = {
			cookies: {
				set: () => {
					cookieSet = true;
				},
			},
		};
		const service = await Effect.runPromise(Session(config));
		await runEffect(service.createUserSession('user-id', context as any, true));
		expect(cookieSet).toBe(true);
	});
});
