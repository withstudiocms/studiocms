/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import { beforeEach, describe, expect, it } from 'vitest';
import { Effect, Exit, Layer } from '../src/effect.js';
import { Scrypt, ScryptConfig, ScryptConfigOptions, ScryptError } from '../src/scrypt.js';

describe('Scrypt Module', () => {
	let defaultConfig: ReturnType<typeof ScryptConfigOptions>;
	let testPassword: string;

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
	});

	describe('ScryptError', () => {
		it('should create a ScryptError with proper structure', () => {
			const originalError = new Error('Test error message');
			const scryptError = new ScryptError({ error: originalError });

			expect(scryptError._tag).toBe('ScryptError');
			expect(scryptError.error).toBe(originalError);
			expect(scryptError.error.message).toBe('Test error message');
		});

		it('should be an instance of Error', () => {
			const originalError = new Error('Test error');
			const scryptError = new ScryptError({ error: originalError });

			expect(scryptError instanceof Error).toBe(true);
		});
	});

	describe('ScryptConfigOptions', () => {
		it('should create valid config options with brand', () => {
			const config = ScryptConfigOptions({
				encryptionKey: 'my-secret-key',
				keylen: 32,
				options: { N: 1024, r: 4, p: 1 },
			});

			expect(config.encryptionKey).toBe('my-secret-key');
			expect(config.keylen).toBe(32);
			expect(config.options).toEqual({ N: 1024, r: 4, p: 1 });
		});

		it('should accept Buffer as encryptionKey', () => {
			const keyBuffer = Buffer.from('buffer-key', 'utf8');
			const config = ScryptConfigOptions({
				encryptionKey: keyBuffer,
				keylen: 48,
				options: { N: 2048, r: 6, p: 2 },
			});

			expect(Buffer.isBuffer(config.encryptionKey)).toBe(true);
			expect(config.keylen).toBe(48);
		});
	});

	describe('ScryptConfig', () => {
		it('should create a config layer successfully', () => {
			const configLayer = ScryptConfig.Make(defaultConfig);
			expect(configLayer).toBeTruthy();
		});

		it('should provide config through context', async () => {
			const configLayer = ScryptConfig.Make(defaultConfig);

			const program = Effect.gen(function* () {
				const config = yield* ScryptConfig;
				return config;
			});

			const result = await Effect.runPromise(Effect.provide(program, configLayer));

			expect(result.encryptionKey).toBe(defaultConfig.encryptionKey);
			expect(result.keylen).toBe(defaultConfig.keylen);
			expect(result.options).toEqual(defaultConfig.options);
		});
	});

	describe('Scrypt Service', () => {
		let serviceLayer: Layer.Layer<Scrypt, never, never>;

		beforeEach(async () => {
			const configLayer = ScryptConfig.Make(defaultConfig);
			serviceLayer = Layer.provide(Scrypt.Default, configLayer);
		});

		it('should derive key successfully with valid input', async () => {
			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const derivedKey = yield* service.run(testPassword);
				return derivedKey;
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			expect(Buffer.isBuffer(result)).toBe(true);
			expect(result.length).toBe(defaultConfig.keylen);
		});

		it('should produce consistent results for same input', async () => {
			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const key1 = yield* service.run(testPassword);
				const key2 = yield* service.run(testPassword);
				return { key1, key2 };
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			expect(Buffer.isBuffer(result.key1)).toBe(true);
			expect(Buffer.isBuffer(result.key2)).toBe(true);
			expect(result.key1.equals(result.key2)).toBe(true);
		});

		it('should produce different results for different inputs', async () => {
			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const key1 = yield* service.run('password1');
				const key2 = yield* service.run('password2');
				return { key1, key2 };
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			expect(Buffer.isBuffer(result.key1)).toBe(true);
			expect(Buffer.isBuffer(result.key2)).toBe(true);
			expect(result.key1.equals(result.key2)).toBe(false);
		});

		it('should handle Buffer input', async () => {
			const passwordBuffer = Buffer.from(testPassword, 'utf8');

			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const derivedKey = yield* service.run(passwordBuffer);
				return derivedKey;
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			expect(Buffer.isBuffer(result)).toBe(true);
			expect(result.length).toBe(defaultConfig.keylen);
		});

		it('should handle Uint8Array input', async () => {
			const passwordArray = new Uint8Array(Buffer.from(testPassword, 'utf8'));

			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const derivedKey = yield* service.run(passwordArray);
				return derivedKey;
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			expect(Buffer.isBuffer(result)).toBe(true);
			expect(result.length).toBe(defaultConfig.keylen);
		});

		it('should fail with ScryptError for invalid scrypt options', async () => {
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

			const exit = await Effect.runPromiseExit(Effect.provide(program, invalidServiceLayer));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				expect(exit._tag).toBe('Failure');
				const error = exit.cause.toJSON();
				expect((error as any).failure._tag).toBe('ScryptError');
			}
		});

		it('should work with different key lengths', async () => {
			const testCases = [16, 32, 64, 128];

			for (const keylen of testCases) {
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

				const result = await Effect.runPromise(Effect.provide(program, testServiceLayer));

				expect(Buffer.isBuffer(result)).toBe(true);
				expect(result.length).toBe(keylen);
			}
		});

		it('should work with different scrypt parameters', async () => {
			const parameterSets = [
				{ N: 1024, r: 4, p: 1 },
				{ N: 2048, r: 8, p: 1 },
				{ N: 4096, r: 8, p: 2 },
			];

			for (const options of parameterSets) {
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

				const result = await Effect.runPromise(Effect.provide(program, testServiceLayer));

				expect(Buffer.isBuffer(result)).toBe(true);
				expect(result.length).toBe(32);
			}
		});
	});

	describe('Scrypt.makeConfig static method', () => {
		it('should create config layer using static method', async () => {
			const configLayer = Scrypt.makeConfig(defaultConfig);

			const program = Effect.gen(function* () {
				const config = yield* ScryptConfig;
				return config;
			});

			const result = await Effect.runPromise(Effect.provide(program, configLayer));

			expect(result.encryptionKey).toBe(defaultConfig.encryptionKey);
			expect(result.keylen).toBe(defaultConfig.keylen);
			expect(result.options).toEqual(defaultConfig.options);
		});
	});

	describe('Integration tests', () => {
		it('should work in a complete application flow', async () => {
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

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(3);

			result.forEach((key) => {
				expect(Buffer.isBuffer(key)).toBe(true);
				expect(key.length).toBe(64);
			});

			expect(result[0].equals(result[1])).toBe(false);
			expect(result[1].equals(result[2])).toBe(false);
			expect(result[0].equals(result[2])).toBe(false);
		});
	});
});
