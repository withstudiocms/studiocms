import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { Effect, Exit, Layer } from '../dist/effect.js';
import { Scrypt, ScryptConfig, ScryptConfigOptions, ScryptError } from '../dist/scrypt.js';

describe('Scrypt Module', () => {
	let defaultConfig;
	let testPassword;

	beforeEach(() => {
		// Reset test data before each test
		defaultConfig = ScryptConfigOptions({
			encryptionKey: 'test-salt-key',
			keylen: 64,
			options: {
				N: 16384, // CPU/memory cost parameter
				r: 8, // Block size parameter
				p: 1, // Parallelization parameter
			},
		});
		testPassword = 'test-password-123';
	});

	describe('ScryptError', () => {
		it('should create a ScryptError with proper structure', () => {
			const originalError = new Error('Test error message');
			const scryptError = new ScryptError({ error: originalError });

			assert.strictEqual(scryptError._tag, 'ScryptError');
			assert.strictEqual(scryptError.error, originalError);
			assert.strictEqual(scryptError.error.message, 'Test error message');
		});

		it('should be an instance of Error', () => {
			const originalError = new Error('Test error');
			const scryptError = new ScryptError({ error: originalError });

			assert(scryptError instanceof Error);
		});
	});

	describe('ScryptConfigOptions', () => {
		it('should create valid config options with brand', () => {
			const config = ScryptConfigOptions({
				encryptionKey: 'my-secret-key',
				keylen: 32,
				options: { N: 1024, r: 4, p: 1 },
			});

			assert.strictEqual(config.encryptionKey, 'my-secret-key');
			assert.strictEqual(config.keylen, 32);
			assert.deepStrictEqual(config.options, { N: 1024, r: 4, p: 1 });
		});

		it('should accept Buffer as encryptionKey', () => {
			const keyBuffer = Buffer.from('buffer-key', 'utf8');
			const config = ScryptConfigOptions({
				encryptionKey: keyBuffer,
				keylen: 48,
				options: { N: 2048, r: 6, p: 2 },
			});

			assert(Buffer.isBuffer(config.encryptionKey));
			assert.strictEqual(config.keylen, 48);
		});
	});

	describe('ScryptConfig', () => {
		it('should create a config layer successfully', async () => {
			const configLayer = ScryptConfig.Make(defaultConfig);

			// Test that the layer can be created without throwing
			assert(configLayer !== null);
			assert(configLayer !== undefined);
		});

		it('should provide config through context', async () => {
			const configLayer = ScryptConfig.Make(defaultConfig);

			const program = Effect.gen(function* () {
				const config = yield* ScryptConfig;
				return config;
			});

			const result = await Effect.runPromise(Effect.provide(program, configLayer));

			assert.strictEqual(result.encryptionKey, defaultConfig.encryptionKey);
			assert.strictEqual(result.keylen, defaultConfig.keylen);
			assert.deepStrictEqual(result.options, defaultConfig.options);
		});
	});

	describe('Scrypt Service', () => {
		// biome-ignore lint/correctness/noUnusedVariables: the `serviceLayer` is used in tests
		let scryptService;
		let serviceLayer;

		beforeEach(async () => {
			const configLayer = ScryptConfig.Make(defaultConfig);
			serviceLayer = Layer.provide(Scrypt.Default, configLayer);

			scryptService = Effect.gen(function* () {
				return yield* Scrypt;
			}).pipe(Effect.provide(serviceLayer));
		});

		it('should derive key successfully with valid input', async () => {
			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const derivedKey = yield* service.run(testPassword);
				return derivedKey;
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			assert(Buffer.isBuffer(result));
			assert.strictEqual(result.length, defaultConfig.keylen);
		});

		it('should produce consistent results for same input', async () => {
			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const key1 = yield* service.run(testPassword);
				const key2 = yield* service.run(testPassword);
				return { key1, key2 };
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			assert(Buffer.isBuffer(result.key1));
			assert(Buffer.isBuffer(result.key2));
			assert(result.key1.equals(result.key2), 'Keys should be identical for same input');
		});

		it('should produce different results for different inputs', async () => {
			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const key1 = yield* service.run('password1');
				const key2 = yield* service.run('password2');
				return { key1, key2 };
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			assert(Buffer.isBuffer(result.key1));
			assert(Buffer.isBuffer(result.key2));
			assert(!result.key1.equals(result.key2), 'Keys should be different for different inputs');
		});

		it('should handle Buffer input', async () => {
			const passwordBuffer = Buffer.from(testPassword, 'utf8');

			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const derivedKey = yield* service.run(passwordBuffer);
				return derivedKey;
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			assert(Buffer.isBuffer(result));
			assert.strictEqual(result.length, defaultConfig.keylen);
		});

		it('should handle Uint8Array input', async () => {
			const passwordArray = new Uint8Array(Buffer.from(testPassword, 'utf8'));

			const program = Effect.gen(function* () {
				const service = yield* Scrypt;
				const derivedKey = yield* service.run(passwordArray);
				return derivedKey;
			});

			const result = await Effect.runPromise(Effect.provide(program, serviceLayer));

			assert(Buffer.isBuffer(result));
			assert.strictEqual(result.length, defaultConfig.keylen);
		});

		it('should fail with ScryptError for invalid scrypt options', async () => {
			// Create config with invalid options (N must be a power of 2)
			const invalidConfig = ScryptConfigOptions({
				encryptionKey: 'test-salt',
				keylen: 64,
				options: {
					N: 15, // Invalid: not a power of 2
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

			assert(Exit.isFailure(exit));
			if (Exit.isFailure(exit)) {
				assert(exit._tag === 'Failure');
				const error = exit.cause.toJSON();

				assert.strictEqual(error.failure._tag, 'ScryptError', `Expected error tag ScryptError, got ${error.failure._tag}`);
			}
		});

		it('should work with different key lengths', async () => {
			const testCases = [16, 32, 64, 128];

			for (const keylen of testCases) {
				const config = ScryptConfigOptions({
					encryptionKey: 'test-salt',
					keylen,
					options: { N: 1024, r: 4, p: 1 }, // Reduced for faster testing
				});

				const configLayer = ScryptConfig.Make(config);
				const testServiceLayer = Layer.provide(Scrypt.Default, configLayer);

				const program = Effect.gen(function* () {
					const service = yield* Scrypt;
					return yield* service.run(testPassword);
				});

				const result = await Effect.runPromise(Effect.provide(program, testServiceLayer));

				assert(Buffer.isBuffer(result));
				assert.strictEqual(result.length, keylen, `Key length should be ${keylen}`);
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

				assert(Buffer.isBuffer(result));
				assert.strictEqual(result.length, 32);
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

			assert.strictEqual(result.encryptionKey, defaultConfig.encryptionKey);
			assert.strictEqual(result.keylen, defaultConfig.keylen);
			assert.deepStrictEqual(result.options, defaultConfig.options);
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

				// Simulate deriving keys for multiple users
				const userKeys = yield* Effect.all([
					scrypt.run('user1-password'),
					scrypt.run('user2-password'),
					scrypt.run('user3-password'),
				]);

				return userKeys;
			});

			const result = await Effect.runPromise(Effect.provide(application, appLayer));

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 3);

			result.forEach((key, index) => {
				assert(Buffer.isBuffer(key), `Key ${index} should be a Buffer`);
				assert.strictEqual(key.length, 64, `Key ${index} should be 64 bytes long`);
			});

			// Ensure all keys are different
			assert(!result[0].equals(result[1]), 'User keys should be different');
			assert(!result[1].equals(result[2]), 'User keys should be different');
			assert(!result[0].equals(result[2]), 'User keys should be different');
		});
	});
});
