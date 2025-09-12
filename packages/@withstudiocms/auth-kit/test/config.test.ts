/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Context, Effect, Layer } from '@withstudiocms/effect';
import { ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
	AuthKitConfig,
	AuthKitOptions,
	makePasswordModConfig,
	PasswordModConfigFinal,
} from '../src/config.js';
import type { SessionConfig } from '../src/types.js';
import { defaultSessionConfig } from '../src/utils/session.js';

describe('Config Helper', () => {
	it('AuthKitConfig object matches expected shape', async () => {
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

	describe('makePasswordModConfig', () => {
		const validKeyBytes = new Uint8Array(16).fill(1);
		const validBase64Key = Buffer.from(validKeyBytes).toString('base64');

		it('throws if CMS_ENCRYPTION_KEY is empty', async () => {
			expect(() => makePasswordModConfig({ CMS_ENCRYPTION_KEY: '' })).toThrow(
				'CMS_ENCRYPTION_KEY must be a non-empty base64 string'
			);
		});

		it('throws if CMS_ENCRYPTION_KEY is not valid base64', () => {
			expect(() => makePasswordModConfig({ CMS_ENCRYPTION_KEY: 'not-base64!' })).toThrow(
				'CMS_ENCRYPTION_KEY must decode to 16 bytes, got 7'
			);
		});

		it('throws if CMS_ENCRYPTION_KEY does not decode to 16 bytes', () => {
			const tooShort = Buffer.from([1, 2, 3]).toString('base64');
			expect(() => makePasswordModConfig({ CMS_ENCRYPTION_KEY: tooShort })).toThrow(
				'CMS_ENCRYPTION_KEY must decode to 16 bytes, got 3'
			);
			const tooLong = Buffer.from(new Uint8Array(32)).toString('base64');
			expect(() => makePasswordModConfig({ CMS_ENCRYPTION_KEY: tooLong })).toThrow(
				'CMS_ENCRYPTION_KEY must decode to 16 bytes, got 32'
			);
		});

		it('returns PasswordModConfigFinal with default scrypt params', () => {
			const config = makePasswordModConfig({ CMS_ENCRYPTION_KEY: validBase64Key });
			expect(config).toHaveProperty('scrypt');
			expect(config).toMatchObject(
				PasswordModConfigFinal({
					scrypt: ScryptConfigOptions({
						encryptionKey: validBase64Key,
						keylen: 64,
						options: { N: 16384, r: 8, p: 1 },
					}),
				})
			);
		});

		it('respects SCRYPT_N, SCRYPT_R, SCRYPT_P env vars and clamps them', () => {
			const prev = {
				N: process.env.SCRYPT_N,
				R: process.env.SCRYPT_R,
				P: process.env.SCRYPT_P,
			};
			process.env.SCRYPT_N = '65536';
			process.env.SCRYPT_R = '16';
			process.env.SCRYPT_P = '4';
			const config = makePasswordModConfig({ CMS_ENCRYPTION_KEY: validBase64Key });
			expect(config.scrypt.options).toMatchObject({ N: 65536, r: 16, p: 4 });
			process.env.SCRYPT_N = '99999999'; // above max
			process.env.SCRYPT_R = '99'; // above max
			process.env.SCRYPT_P = '99'; // above max
			const config2 = makePasswordModConfig({ CMS_ENCRYPTION_KEY: validBase64Key });
			expect(config2.scrypt.options).toMatchObject({ N: 1048576, r: 32, p: 16 });
			process.env.SCRYPT_N = prev.N;
			process.env.SCRYPT_R = prev.R;
			process.env.SCRYPT_P = prev.P;
		});

		it('clamps SCRYPT_N to nearest lower power of two', () => {
			const oldEnv = { ...process.env };
			process.env.SCRYPT_N = '20000'; // nearest lower power of two is 16384
			const config = makePasswordModConfig({ CMS_ENCRYPTION_KEY: validBase64Key });
			expect(config.scrypt.options.N).toBe(16384);
			process.env = oldEnv;
		});

		it('throws if session.cookieName is missing or empty', () => {
			const validKeyBytes = new Uint8Array(16).fill(1);
			const validBase64Key = Buffer.from(validKeyBytes).toString('base64');
			const userTools = {} as any;
			const baseConfig = {
				CMS_ENCRYPTION_KEY: validBase64Key,
				userTools,
			};

			expect(() =>
				AuthKitOptions.Live({
					...baseConfig,
					session: { ...defaultSessionConfig, cookieName: '' } as Required<SessionConfig>,
				})
			).toThrow('session.cookieName must be a non-empty string');

			expect(() =>
				AuthKitOptions.Live({
					...baseConfig,
					session: { ...defaultSessionConfig, cookieName: '   ' } as Required<SessionConfig>,
				})
			).toThrow('session.cookieName must be a non-empty string');

			expect(() =>
				AuthKitOptions.Live({
					...baseConfig,
					session: {
						...defaultSessionConfig,
						cookieName: undefined as any,
					} as Required<SessionConfig>,
				})
			).toThrow('session.cookieName must be a non-empty string');
		});

		it('throws if session.expTime is not a positive integer', () => {
			const validKeyBytes = new Uint8Array(16).fill(1);
			const validBase64Key = Buffer.from(validKeyBytes).toString('base64');
			const userTools = {} as any;
			const baseConfig = {
				CMS_ENCRYPTION_KEY: validBase64Key,
				userTools,
			};

			expect(() =>
				AuthKitOptions.Live({
					...baseConfig,
					session: { ...defaultSessionConfig, expTime: 0 } as Required<SessionConfig>,
				})
			).toThrow('session.expTime must be a positive integer (ms)');

			expect(() =>
				AuthKitOptions.Live({
					...baseConfig,
					session: { ...defaultSessionConfig, expTime: -100 } as Required<SessionConfig>,
				})
			).toThrow('session.expTime must be a positive integer (ms)');

			expect(() =>
				AuthKitOptions.Live({
					...baseConfig,
					session: { ...defaultSessionConfig, expTime: Number.NaN } as Required<SessionConfig>,
				})
			).toThrow('session.expTime must be a positive integer (ms)');

			expect(() =>
				AuthKitOptions.Live({
					...baseConfig,
					session: { ...defaultSessionConfig, expTime: 1.5 } as Required<SessionConfig>,
				})
			).toThrow('session.expTime must be a positive integer (ms)');
		});

		it('merges session config with defaults', () => {
			const validKeyBytes = new Uint8Array(16).fill(1);
			const validBase64Key = Buffer.from(validKeyBytes).toString('base64');
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

			expectTypeOf(layer).toEqualTypeOf<Layer.Layer<AuthKitOptions, never, never>>();
			expect(testContext.session).toEqual({
				...defaultSessionConfig,
				...customSession,
			});
			expect(testContext.session.cookieName).toBe('custom_cookie');
			expect(testContext.session.expTime).toBe(123456);
		});
	});
});
