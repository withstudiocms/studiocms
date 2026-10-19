/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Effect, runEffect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { Session } from '../../src/modules/session.js';
import type { SessionConfig } from '../../src/types.js';
import { makeSessionId } from '../../src/utils/session.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Session Module Tests';

// Minimal fake session tools for testing
const now = Date.now();

const NOW = new Date(now);

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
	updatedAt: NOW,
	createdAt: NOW,
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
			return await Promise.resolve(fakeSessionAndUser);
		}
		return await Promise.resolve(undefined);
	},
	deleteSession: async (_sessionId) => {},
	updateSession: async (_sessionId, data) => ({ ...fakeSession, ...data }),
};

const config: SessionConfig = {
	expTime: 1000 * 60 * 60,
	cookieName: 'auth_session',
	sessionTools,
};

describe(parentSuiteName, async () => {
	const service = await Effect.runPromise(Session(config));

	test('Session Module - generateSessionToken returns a base32 string', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('generateSessionToken Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should return a valid base32 string', async (ctx) => {
			const token = await runEffect(service.generateSessionToken());
			await ctx.parameter('generated token', token);
			expect(typeof token).toBe('string');
			expect(token).toMatch(/^[a-z2-7]+$/); // base32 chars
			expect(token.length).toBeGreaterThanOrEqual(32);
		});
	});

	test('Session Module - createSession returns a UserSession', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createSession Tests');
		await allure.tags(...sharedTags);

		const token = 'token';
		const userId = 'user-id';

		await allure.step('Should create a session with correct userId and expiration', async () => {
			const session = await runEffect(service.createSession(token, userId));
			expect(session.userId).toBe(userId);
			expect(session.expiresAt).toBeInstanceOf(Date);
		});
	});

	test('Session Module - validateSessionToken returns null for invalid session', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('validateSessionToken Invalid Session Tests');
		await allure.tags(...sharedTags);

		const invalidToken = 'invalid-session-id';

		await allure.step('Should return null session and user for invalid token', async () => {
			const result = await runEffect(service.validateSessionToken(invalidToken));
			expect(result.session).toBeNull();
			expect(result.user).toBeNull();
		});
	});

	test('Session Module - validateSessionToken returns session and user for valid session', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('validateSessionToken Valid Session Tests');
		await allure.tags(...sharedTags);

		const validToken = 'valid-session-token';

		await allure.step('Should return session and user for valid token', async () => {
			const result = await runEffect(service.validateSessionToken(validToken));
			expect(result.session).toEqual(fakeSessionAndUser.session);
			expect(result.user).toEqual(fakeSessionAndUser.user);
		});
	});

	test('Session Module - invalidateSession calls deleteSession', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('invalidateSession Tests');
		await allure.tags(...sharedTags);

		let called = false;
		const customTools = {
			...sessionTools,
			deleteSession: async () => {
				called = true;
			},
		};
		const customConfig = { ...config, sessionTools: customTools };
		const customService = await Effect.runPromise(Session(customConfig));

		await allure.step('Should call deleteSession', async () => {
			await runEffect(customService.invalidateSession('session-id'));
			expect(called).toBe(true);
		});
	});

	test('Session Module - setSessionTokenCookie sets cookie on context', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('setSessionTokenCookie Tests');
		await allure.tags(...sharedTags);

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

		await allure.step('Should set the session cookie on context', async () => {
			await runEffect(
				service.setSessionTokenCookie(context as any, 'token', new Date(Date.now() + 1000), true)
			);
			expect(cookieSet).toBe(true);
		});
	});

	test('Session Module - deleteSessionTokenCookie sets cookie with empty value and maxAge 0', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('deleteSessionTokenCookie Tests');
		await allure.tags(...sharedTags);

		let opts: any = {};
		const context = {
			cookies: {
				set: (_name: string, value: string, options: any) => {
					opts = options;
					expect(value).toBe('');
				},
			},
		};

		await allure.step('Should set cookie with empty value and maxAge 0', async () => {
			await runEffect(service.deleteSessionTokenCookie(context as any, true));
			expect(opts.maxAge).toBe(0);
			expect(opts.httpOnly).toBeTruthy();
		});
	});

	test('Session Module - setOAuthSessionTokenCookie sets OAuth cookie', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('setOAuthSessionTokenCookie Tests');
		await allure.tags(...sharedTags);

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

		await allure.step('Should set the OAuth session cookie on context', async () => {
			await runEffect(
				service.setOAuthSessionTokenCookie(context as any, 'oauth_cookie', 'oauth_value', true)
			);
			expect(called).toBe(true);
		});
	});

	test('Session Module - createUserSession creates session and sets cookie', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createUserSession Tests');
		await allure.tags(...sharedTags);

		let cookieSet = false;
		const context = {
			cookies: {
				set: () => {
					cookieSet = true;
				},
			},
		};

		await allure.step('Should create user session and set cookie', async () => {
			const service = await Effect.runPromise(Session(config));
			await runEffect(service.createUserSession('user-id', context as any, true));
			expect(cookieSet).toBe(true);
		});
	});
});
