/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Effect, runEffect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt, ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { User } from '../../src/modules/user.js';
import { type UserConfig, UserPermissionLevel } from '../../src/types.js';
import { makeSessionId } from '../../src/utils/session.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'User Module Tests';

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

describe(parentSuiteName, async () => {
	const service = await Effect.runPromise(serviceBuilder);

	[
		{
			input: 'valid_user',
			expected: true,
		},
		{
			input: 'ab',
			expected: /between 3 and 32 characters/,
		},
	].forEach(({ input, expected }) => {
		test('User Module - verifyUsernameInput Tests', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('verifyUsernameInput Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', String(expected));

			await allure.step(`Should return ${expected}`, async () => {
				const result = await runEffect(service.verifyUsernameInput(input));
				if (expected === true) {
					expect(result).toBe(true);
				} else {
					expect(result).toMatch(expected as RegExp);
				}
			});
		});
	});

	test('User Module - createUserAvatar returns a valid Libravatar URL', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createUserAvatar Tests');
		await allure.tags(...sharedTags);

		const email = 'test@example.com';
		await allure.step('Should return a valid Libravatar URL', async (ctx) => {
			const url = await runEffect(service.createUserAvatar(email));
			await ctx.parameter('generated URL', url);
			expect(typeof url).toBe('string');
			expect(url).toMatch(/^https:\/\/seccdn\.libravatar\.org\/avatar\/[a-f0-9]+/);
		});
	});

	test('User Module - createLocalUser returns a user object', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createLocalUser Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should return a user object', async () => {
			const user = await runEffect(
				service.createLocalUser('Test User', 'testuser', 'test@example.com', 'password')
			);
			expect(user.username).toBe('testuser');
			expect(user.email).toBe('test@example.com');
		});
	});

	test('User Module - createOAuthUser returns a user object', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createOAuthUser Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should return a user object', async () => {
			const user = await runEffect(
				service.createOAuthUser(fakeUser, { provider: 'github', providerUserId: '123' })
			);
			expect(user.id).toBe(fakeUser.id);
		});
	});

	test('User Module - getUserPasswordHash returns the user password', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getUserPasswordHash Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should return the user password hash', async () => {
			const hash = await runEffect(service.getUserPasswordHash('user-id'));
			expect(hash).toBe(fakeUser.password);
		});
	});

	[
		{
			input: 'notfound',
		},
		{
			input: 'user-id',
		},
	].forEach(({ input }) => {
		test('User Module - getUserPasswordHash fails if user not found', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getUserPasswordHash Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input userId', input);

			const userToolsNoPass = {
				...userTools,
				getUserById: async () => ({ ...fakeUser, password: null }),
			};
			const config = { ...userConfig, userTools: userToolsNoPass };
			// @ts-expect-error mock
			const serviceNoPass = await Effect.runPromise(User(config));

			await allure.step('Should throw an error', async () => {
				let err: any;
				try {
					await runEffect(serviceNoPass.getUserPasswordHash(input));
				} catch (e) {
					err = e;
				}
				expect(JSON.stringify(err)).toMatch(
					'{"_id":"FiberFailure","cause":{"_id":"Cause","_tag":"Fail","failure":{"cause":"User has no password","_tag":"UserError"}}}'
				);
			});
		});
	});

	[
		{
			input: 'test@example.com',
			expected: true,
		},
		{
			input: 'notfound@example.com',
			expected: false,
		},
	].forEach(({ input, expected }) => {
		test('User Module - doesUserExistByEmail Tests', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('doesUserExistByEmail Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input email', input);
			await allure.parameter('expected', String(expected));

			await allure.step(`Should return ${expected}`, async () => {
				const result = await runEffect(service.getUserFromEmail(input));
				expect(result?.email).toBe(expected ? input : undefined);
			});
		});
	});

	test('User Module - getUserData returns logged out session if no user', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getUserData Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should return logged out session', async () => {
			// @ts-expect-error - mocked type
			const result = await runEffect(service.getUserData({ cookies: { get: () => undefined } }));
			expect(result.isLoggedIn).toBe(false);
			expect(result.user).toBe(null);
			expect(result.permissionLevel).toBe('unknown');
		});
	});

	test('User Module - getUserData returns logged in session for valid user', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getUserData Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should return logged in session', async () => {
			const result = await runEffect(
				// @ts-expect-error - mocked type
				service.getUserData({ cookies: { get: () => ({ value: 'valid-session-token' }) } })
			);
			expect(result.isLoggedIn).toBe(true);
			expect(result.user).toBeTruthy();
			expect(result.permissionLevel).toBe('admin');
		});
	});

	test('User Module - getUserData returns logged out session for expired session', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getUserData Tests');
		await allure.tags(...sharedTags);

		let cookieDeleted = false;
		const context = {
			cookies: {
				get: () => ({ value: 'expired-session-token' }),
				set: () => {
					cookieDeleted = true;
				},
			},
		};

		await allure.step('Should return logged out session and delete cookie', async () => {
			// @ts-expect-error - mocked type
			const result = await runEffect(service.getUserData(context));
			expect(result.isLoggedIn).toBe(false);
			expect(result.user).toBe(null);
			expect(result.permissionLevel).toBe('unknown');
			expect(cookieDeleted).toBe(true);
		});
	});

	test('User Module - getUserPermissionLevel returns correct enum', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getUserPermissionLevel Tests');
		await allure.tags(...sharedTags);

		const userData = { permissionLevel: 'admin' as const };

		await allure.step('Should return correct permission level', async () => {
			// @ts-expect-error - mocked type
			const level = await runEffect(service.getUserPermissionLevel(userData));
			expect(level).toBe(UserPermissionLevel.admin);
		});
	});

	[
		{
			userData: { permissionLevel: 'admin' as const },
			requiredLevel: 'editor' as const,
			expected: true,
		},
		{
			userData: { permissionLevel: 'visitor' as const },
			requiredLevel: 'admin' as const,
			expected: false,
		},
	].forEach(({ userData, requiredLevel, expected }) => {
		test('User Module - isUserAllowed Tests', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('isUserAllowed Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('userData', JSON.stringify(userData));
			await allure.parameter('requiredLevel', requiredLevel);
			await allure.parameter('expected', String(expected));

			await allure.step(`Should return ${expected}`, async () => {
				// @ts-expect-error - mocked type
				const result = await runEffect(service.isUserAllowed(userData, requiredLevel));
				expect(result).toBe(expected);
			});
		});
	});
});
