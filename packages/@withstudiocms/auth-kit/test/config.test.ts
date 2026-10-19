/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Context, Effect, Layer } from '@withstudiocms/effect';
import { ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import * as allure from 'allure-js-commons';
import { describe, expect, it, test } from 'vitest';
import {
	AuthKitConfig,
	AuthKitOptions,
	makePasswordModConfig,
	PasswordModConfigFinal,
} from '../src/config.js';
import type { SessionConfig } from '../src/types.js';
import { defaultSessionConfig } from '../src/utils/session.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Config Tests';

const validKeyBytes = new Uint8Array(16).fill(1);
const validBase64Key = Buffer.from(validKeyBytes).toString('base64');
const tooShort = Buffer.from([1, 2, 3]).toString('base64');
const tooLong = Buffer.from(new Uint8Array(32)).toString('base64');

describe(parentSuiteName, () => {
	test('AuthKitConfig - AuthKitConfig creates correct config object', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('AuthKitConfig Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create AuthKitConfig object without error', async () => {
			const CMS_ENCRYPTION_KEY = 'test-key';

			const Services = Context.make(
				AuthKitOptions,
				AuthKitConfig({
					CMS_ENCRYPTION_KEY,
					scrypt: ScryptConfigOptions({
						encryptionKey: CMS_ENCRYPTION_KEY,
						keylen: 64,
						options: { N: 16384, r: 8, p: 1 },
					}),
					// @ts-expect-error testing purposefully incorrect type
					session: {
						cookieName: 'auth_session',
						expTime: 1000 * 60 * 60,
					},
				})
			);

			expect(Context.get(Services, AuthKitOptions)).toStrictEqual({
				CMS_ENCRYPTION_KEY: 'test-key',
				scrypt: {
					encryptionKey: 'test-key',
					keylen: 64,
					options: { N: 16384, r: 8, p: 1 },
				},
				session: {
					cookieName: 'auth_session',
					expTime: 1000 * 60 * 60,
				},
			});
		});
	});

	[
		{
			input: { CMS_ENCRYPTION_KEY: '' },
			error: 'CMS_ENCRYPTION_KEY must be a non-empty base64 string',
		},
		{
			input: { CMS_ENCRYPTION_KEY: 'not-base64!' },
			error: 'CMS_ENCRYPTION_KEY must decode to 16 bytes, got 7',
		},
		{
			input: { CMS_ENCRYPTION_KEY: tooShort },
			error: 'CMS_ENCRYPTION_KEY must decode to 16 bytes, got 3',
		},
		{
			input: { CMS_ENCRYPTION_KEY: tooLong },
			error: 'CMS_ENCRYPTION_KEY must decode to 16 bytes, got 32',
		},
		{
			input: { CMS_ENCRYPTION_KEY: validBase64Key },
			expected: PasswordModConfigFinal({
				scrypt: ScryptConfigOptions({
					encryptionKey: validBase64Key,
					keylen: 64,
					options: { N: 16384, r: 8, p: 1 },
				}),
			}),
		},
	].forEach(({ input, error, expected }) => {
		it(`makePasswordModConfig with CMS_ENCRYPTION_KEY="${
			input.CMS_ENCRYPTION_KEY
		}" ${error ? 'throws error' : 'returns valid config'}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('makePasswordModConfig Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', JSON.stringify(input));

			if (error) {
				await allure.step(`Should throw error: ${error}`, async () => {
					expect(() => makePasswordModConfig(input)).toThrow(error);
				});
			} else {
				await allure.step('Should return valid PasswordModConfigFinal', async () => {
					const result = makePasswordModConfig(input);
					expect(result).toEqual(expected);
				});
			}
		});
	});

	test('makePasswordModConfig - environment variable overrides work correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makePasswordModConfig Tests');
		await allure.tags(...sharedTags);

		const prev = {
			SCRYPT_N: process.env.SCRYPT_N,
			SCRYPT_R: process.env.SCRYPT_R,
			SCRYPT_P: process.env.SCRYPT_P,
		};
		process.env.SCRYPT_N = '32768';
		process.env.SCRYPT_R = '16';
		process.env.SCRYPT_P = '4';

		await allure.step('Should respect environment variable overrides', async () => {
			const config = makePasswordModConfig({ CMS_ENCRYPTION_KEY: validBase64Key });
			expect(config.scrypt.options).toMatchObject({ N: 32768, r: 16, p: 4 });
		});

		process.env.SCRYPT_N = prev.SCRYPT_N;
		process.env.SCRYPT_R = prev.SCRYPT_R;
		process.env.SCRYPT_P = prev.SCRYPT_P;
	});

	test('makePasswordModConfig - clamps SCRYPT_N to nearest lower power of two', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makePasswordModConfig Tests');
		await allure.tags(...sharedTags);

		const oldEnv = { ...process.env };
		process.env.SCRYPT_N = '20000'; // nearest lower power of two is 16384

		await allure.step('Should clamp SCRYPT_N correctly', async () => {
			const config = makePasswordModConfig({ CMS_ENCRYPTION_KEY: validBase64Key });
			expect(config.scrypt.options.N).toBe(16384);
		});

		process.env = oldEnv;
	});

	test('AuthKitOptions - Throws if session.cookieName is missing or empty', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('AuthKitOptions Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should throw error for missing/empty session.cookieName', async () => {
			const userTools = {} as any;
			const baseConfig = {
				CMS_ENCRYPTION_KEY: validBase64Key,
				userTools,
			};

			const testCases = [
				{
					session: { ...defaultSessionConfig, cookieName: '' } as Required<SessionConfig>,
					error: 'session.cookieName must be a non-empty string',
				},
				{
					session: { ...defaultSessionConfig, cookieName: '   ' } as Required<SessionConfig>,
					error: 'session.cookieName must be a non-empty string',
				},
				{
					session: {
						...defaultSessionConfig,
						cookieName: undefined as any,
					} as Required<SessionConfig>,
					error: 'session.cookieName must be a non-empty string',
				},
			];

			for (const { session, error } of testCases) {
				expect(() =>
					AuthKitOptions.Live({
						...baseConfig,
						session,
					})
				).toThrow(error);
			}
		});
	});

	test('AuthKitOptions - throws if session.expTime is invalid', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('AuthKitOptions Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should throw error for invalid session.expTime', async () => {
			const userTools = {} as any;
			const baseConfig = {
				CMS_ENCRYPTION_KEY: validBase64Key,
				userTools,
			};

			const testCases = [
				{
					session: { ...defaultSessionConfig, expTime: 0 } as Required<SessionConfig>,
					error: 'session.expTime must be a positive integer (ms)',
				},
				{
					session: { ...defaultSessionConfig, expTime: -100 } as Required<SessionConfig>,
					error: 'session.expTime must be a positive integer (ms)',
				},
				{
					session: { ...defaultSessionConfig, expTime: Number.NaN } as Required<SessionConfig>,
					error: 'session.expTime must be a positive integer (ms)',
				},
				{
					session: { ...defaultSessionConfig, expTime: 1.5 } as Required<SessionConfig>,
					error: 'session.expTime must be a positive integer (ms)',
				},
			];

			for (const { session, error } of testCases) {
				expect(() =>
					AuthKitOptions.Live({
						...baseConfig,
						session,
					})
				).toThrow(error);
			}
		});
	});

	test('AuthKitOptions - merges session config with defaults', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('AuthKitOptions Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should merge session config with defaults', async () => {
			const userTools = {} as any;
			const customSession = {
				cookieName: 'custom_cookie',
				expTime: 123456,
			};
			const layer = AuthKitOptions.Live({
				CMS_ENCRYPTION_KEY: validBase64Key,
				session: customSession as Required<SessionConfig>,
				userTools,
			});

			const resolvedContext = Effect.runSync(Effect.scoped(Layer.build(layer)));

			const testContext = Context.get(resolvedContext, AuthKitOptions);

			expect(testContext.session).toEqual({
				...defaultSessionConfig,
				...customSession,
			});
			expect(testContext.session.cookieName).toBe('custom_cookie');
			expect(testContext.session.expTime).toBe(123456);
		});
	});
});
