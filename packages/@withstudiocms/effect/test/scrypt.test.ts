/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import { Effect, Exit, Layer } from '../src/effect.js';
import { Scrypt, ScryptConfig, ScryptConfigOptions, ScryptError } from '../src/scrypt.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Scrypt Service Tests';

describe(parentSuiteName, () => {
	let defaultConfig: ReturnType<typeof ScryptConfigOptions>;
	let testPassword: string;
	let configLayer: Layer.Layer<ScryptConfig, never, never>;
	let serviceLayer: Layer.Layer<Scrypt, never, never>;

	beforeEach(() => {
		defaultConfig = ScryptConfigOptions({
			encryptionKey: 'test-salt-key',
			keylen: 64,
			options: {
				N: 16384,
				r: 8,
				p: 1,
			},
		});
		testPassword = 'test-password-123';
		configLayer = ScryptConfig.Make(defaultConfig);
		serviceLayer = Layer.provide(Scrypt.Default, configLayer);
	});

	test('Scrypt - ScryptError tests', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ScryptError Tests');
		await allure.tags(...sharedTags);

		const originalError = new Error('Sample error for testing');
		const scryptError = new ScryptError({ error: originalError });

		await allure.step('Verify ScryptError structure', async (ctx) => {
			await ctx.parameter('ScryptError Tag', scryptError._tag);
			await ctx.parameter('Original Error Message', (scryptError.error as Error).message);

			expect(scryptError._tag).toBe('effectify/scrypt.ScryptError');
			expect(scryptError.error).toBe(originalError);
		});

		await allure.step('Check ScryptError instance', async (ctx) => {
			const isInstance = scryptError instanceof Error;
			await ctx.parameter('Is Instance of Error', String(isInstance));

			expect(isInstance).toBe(true);
		});
	});

	[
		{
			name: 'Scrypt - ScryptConfigOptions should handle valid options',
			config: ScryptConfigOptions({
				encryptionKey: 'my-secret-key',
				keylen: 32,
				options: { N: 1024, r: 4, p: 1 },
			}),
			expect: {
				encryptionKey: 'my-secret-key',
				keylen: 32,
				options: { N: 1024, r: 4, p: 1 },
			},
		},
		{
			name: 'Scrypt - ScryptConfigOptions should accept Buffer as encryptionKey',
			config: ScryptConfigOptions({
				encryptionKey: Buffer.from('buffer-key', 'utf8'),
				keylen: 48,
				options: { N: 2048, r: 6, p: 2 },
			}),
			expect: {
				encryptionKey: Buffer.from('buffer-key', 'utf8'),
				keylen: 48,
				options: { N: 2048, r: 6, p: 2 },
			},
		},
	].forEach(({ name, config, expect: expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ScryptConfigOptions Tests');
			await allure.tags(...sharedTags);

			await allure.step('Verify ScryptConfigOptions structure', async (ctx) => {
				await ctx.parameter(
					'encryptionKey',
					Buffer.isBuffer(config.encryptionKey)
						? config.encryptionKey.toString('utf8')
						: config.encryptionKey.toString()
				);
				await ctx.parameter('keylen', String(config.keylen));
				await ctx.parameter('options', JSON.stringify(config.options));

				expect(config.encryptionKey).toEqual(expected.encryptionKey);
				expect(config.keylen).toBe(expected.keylen);
				expect(config.options).toEqual(expected.options);
			});
		});
	});

	test('Scrypt - ScryptConfig Make and Context Provisioning', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ScryptConfig Tests');
		await allure.tags(...sharedTags);

		let configLayer: Layer.Layer<ScryptConfig, never, never>;

		await allure.step('Create ScryptConfig Layer', async (ctx) => {
			configLayer = ScryptConfig.Make(defaultConfig);
			await ctx.parameter('Config Layer Created', String(!!configLayer));

			expect(configLayer).toBeTruthy();
		});

		await allure.step('Provide and Retrieve Config from Context', async (ctx) => {
			const program = Effect.gen(function* () {
				const config = yield* ScryptConfig;
				return config;
			});

			const result = await Effect.runPromise(Effect.provide(program, configLayer));

			await ctx.parameter('Retrieved encryptionKey', String(result.encryptionKey));
			await ctx.parameter('Retrieved keylen', String(result.keylen));
			await ctx.parameter('Retrieved options', JSON.stringify(result.options));

			expect(result.encryptionKey).toBe(defaultConfig.encryptionKey);
			expect(result.keylen).toBe(defaultConfig.keylen);
			expect(result.options).toEqual(defaultConfig.options);
		});
	});

	test('Scrypt - Scrypt.makeConfig static method', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Scrypt.makeConfig Tests');
		await allure.tags(...sharedTags);

		await allure.step('Create Config Layer using static method', async (ctx) => {
			const configLayer = Scrypt.makeConfig(defaultConfig);
			await ctx.parameter('Config Layer Created', String(!!configLayer));

			expect(configLayer).toBeTruthy();

			const program = Effect.gen(function* () {
				const config = yield* ScryptConfig;
				return config;
			});

			const result = await Effect.runPromise(Effect.provide(program, configLayer));

			await ctx.parameter('Retrieved encryptionKey', String(result.encryptionKey));
			await ctx.parameter('Retrieved keylen', String(result.keylen));
			await ctx.parameter('Retrieved options', JSON.stringify(result.options));

			expect(result.encryptionKey).toBe(defaultConfig.encryptionKey);
			expect(result.keylen).toBe(defaultConfig.keylen);
			expect(result.options).toEqual(defaultConfig.options);
		});
	});

	test('Scrypt - Integration Test: Complete Application Flow', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Integration Tests');
		await allure.tags(...sharedTags);

		const config = ScryptConfigOptions({
			encryptionKey: Buffer.from('application-salt', 'utf8'),
			keylen: 64,
			options: { N: 2048, r: 8, p: 1 },
		});

		const appLayer = Layer.provide(Scrypt.Default, Scrypt.makeConfig(config));

		const application = Effect.gen(function* () {
			const scrypt = yield* Scrypt;
			const userKeys = yield* Effect.all([
				scrypt.run('user1-password'),
				scrypt.run('user2-password'),
				scrypt.run('user3-password'),
			]);
			return userKeys;
		});

		const result = await Effect.runPromise(Effect.provide(application, appLayer));

		await allure.step('Verify Derived Keys in Application Flow', async (ctx) => {
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(3);

			result.forEach((key, index) => {
				expect(Buffer.isBuffer(key)).toBe(true);
				expect(key.length).toBe(64);
				ctx.parameter(`User ${index + 1} Key Length`, String(key.length));
			});

			expect(result[0].equals(result[1])).toBe(false);
			expect(result[1].equals(result[2])).toBe(false);
			expect(result[0].equals(result[2])).toBe(false);
		});
	});

	test('Scrypt - Service Tests - Should derive keys correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ScryptService Tests');
		await allure.tags(...sharedTags);

		const program = Effect.gen(function* () {
			const service = yield* Scrypt;
			const derivedKey = yield* service.run(testPassword);
			return derivedKey;
		});

		await allure.step('Derive Key and Verify', async (ctx) => {
			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			await ctx.parameter('Derived Key Length', String(result.length));

			expect(Buffer.isBuffer(result)).toBe(true);
			expect(result.length).toBe(defaultConfig.keylen);
		});
	});

	test('Scrypt - Service Tests - Should produce consistent results for same input', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ScryptService Tests');
		await allure.tags(...sharedTags);

		const program = Effect.gen(function* () {
			const service = yield* Scrypt;
			const key1 = yield* service.run(testPassword);
			const key2 = yield* service.run(testPassword);
			return { key1, key2 };
		});

		await allure.step('Derive Keys and Verify Consistency', async (ctx) => {
			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			await ctx.parameter('Key 1 Length', String(result.key1.length));
			await ctx.parameter('Key 2 Length', String(result.key2.length));
			await ctx.parameter('Keys are Equal', String(result.key1.equals(result.key2)));

			expect(Buffer.isBuffer(result.key1)).toBe(true);
			expect(Buffer.isBuffer(result.key2)).toBe(true);
			expect(result.key1.equals(result.key2)).toBe(true);
		});
	});

	test('Scrypt - Service Tests - Should produce different results for different inputs', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ScryptService Tests');
		await allure.tags(...sharedTags);

		const program = Effect.gen(function* () {
			const service = yield* Scrypt;
			const key1 = yield* service.run('password1');
			const key2 = yield* service.run('password2');
			return { key1, key2 };
		});

		await allure.step('Derive Keys and Verify Difference', async (ctx) => {
			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			await ctx.parameter('Key 1 Length', String(result.key1.length));
			await ctx.parameter('Key 2 Length', String(result.key2.length));
			await ctx.parameter('Keys are Equal', String(result.key1.equals(result.key2)));

			expect(Buffer.isBuffer(result.key1)).toBe(true);
			expect(Buffer.isBuffer(result.key2)).toBe(true);
			expect(result.key1.equals(result.key2)).toBe(false);
		});
	});

	test('Scrypt - Service Tests - Should handle buffer and Uint8Array inputs', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ScryptService Tests');
		await allure.tags(...sharedTags);

		const passwordBuffer = Buffer.from(testPassword, 'utf8');
		const passwordArray = new Uint8Array(Buffer.from(testPassword, 'utf8'));

		const program = Effect.gen(function* () {
			const service = yield* Scrypt;
			const keyFromBuffer = yield* service.run(passwordBuffer);
			const keyFromArray = yield* service.run(passwordArray);
			return { keyFromBuffer, keyFromArray };
		});

		await allure.step('Derive Keys from Different Input Types and Verify Equality', async (ctx) => {
			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			await ctx.parameter('Key from Buffer Length', String(result.keyFromBuffer.length));
			await ctx.parameter('Key from Uint8Array Length', String(result.keyFromArray.length));
			await ctx.parameter(
				'Keys are Equal',
				String(result.keyFromBuffer.equals(result.keyFromArray))
			);

			expect(Buffer.isBuffer(result.keyFromBuffer)).toBe(true);
			expect(Buffer.isBuffer(result.keyFromArray)).toBe(true);
			expect(result.keyFromBuffer.equals(result.keyFromArray)).toBe(true);
		});
	});

	test('Scrypt - Service Tests - Should fail with ScryptError for invalid inputs', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ScryptService Tests');
		await allure.tags(...sharedTags);

		const invalidConfig = ScryptConfigOptions({
			encryptionKey: 'test-salt',
			keylen: 64,
			options: {
				N: 15,
				r: 8,
				p: 1,
			},
		});

		const invalidConfigLayer = ScryptConfig.Make(invalidConfig);
		const invalidServiceLayer = Layer.provide(Scrypt.Default, invalidConfigLayer);

		const program = Effect.gen(function* () {
			const service = yield* Scrypt;
			return yield* service.run(testPassword);
		});

		await allure.step('Run Scrypt with Invalid Config and Verify Failure', async (ctx) => {
			const exit = await Effect.runPromiseExit(Effect.provide(program, invalidServiceLayer));

			await ctx.parameter('Exit Tag', exit._tag);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				expect(exit._tag).toBe('Failure');
				const error = exit.cause.toJSON();
				await ctx.parameter('Error Tag', (error as any).failure._tag);
				expect((error as any).failure._tag).toBe('effectify/scrypt.ScryptError');
			}
		});
	});

	[16, 32, 64, 128].forEach((keylen) => {
		test(`Scrypt - Service Tests - Should work with key length: ${keylen}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ScryptService Tests');
			await allure.tags(...sharedTags);

			const config = ScryptConfigOptions({
				encryptionKey: 'test-salt',
				keylen,
				options: { N: 1024, r: 4, p: 1 },
			});

			const configLayer = ScryptConfig.Make(config);
			const testServiceLayer = Layer.provide(Scrypt.Default, configLayer);

			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				return yield* service.run(testPassword);
			});

			await allure.step(`Derive Key with keylen ${keylen} and Verify`, async (ctx) => {
				const result = await Effect.runPromise(Effect.provide(program, testServiceLayer));

				await ctx.parameter('Derived Key Length', String(result.length));

				expect(Buffer.isBuffer(result)).toBe(true);
				expect(result.length).toBe(keylen);
			});
		});
	});

	[
		{ N: 1024, r: 4, p: 1 },
		{ N: 2048, r: 8, p: 1 },
		{ N: 4096, r: 8, p: 2 },
	].forEach((options) => {
		test(`Scrypt - Service Tests - Should work with scrypt parameters N:${options.N}, r:${options.r}, p:${options.p}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ScryptService Tests');
			await allure.tags(...sharedTags);

			const config = ScryptConfigOptions({
				encryptionKey: 'test-salt',
				keylen: 32,
				options,
			});

			const configLayer = ScryptConfig.Make(config);
			const testServiceLayer = Layer.provide(Scrypt.Default, configLayer);

			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				return yield* service.run(testPassword);
			});

			await allure.step(
				`Derive Key with N:${options.N}, r:${options.r}, p:${options.p} and Verify`,
				async (ctx) => {
					const result = await Effect.runPromise(Effect.provide(program, testServiceLayer));

					await ctx.parameter('Derived Key Length', String(result.length));

					expect(Buffer.isBuffer(result)).toBe(true);
					expect(result.length).toBe(32);
				}
			);
		});
	});
});
