import { Effect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt, ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import * as allure from 'allure-js-commons';
import { describe, expect, test, vi } from 'vitest';
import { PasswordModConfigFinal } from '../src/config.js';
import { makeScrypt } from '../src/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Default Module Tests';

// Generate a 16-byte base64 key for AES-128-GCM
const keyBytes = new Uint8Array(16);
for (let i = 0; i < 16; i++) keyBytes[i] = i + 1;
const CMS_ENCRYPTION_KEY = Buffer.from(keyBytes).toString('base64');

describe(parentSuiteName, () => {
	const validConfig = PasswordModConfigFinal({
		scrypt: ScryptConfigOptions({
			encryptionKey: CMS_ENCRYPTION_KEY,
			keylen: 64,
			options: { N: 16384, r: 8, p: 1 },
		}),
	});

	test('Scrypt - makeScrypt creates Scrypt instance with valid config', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeScrypt Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create Scrypt instance without error', async () => {
			const effect = makeScrypt(validConfig);
			const scryptInstance = await Effect.runPromise(effect);
			const result = await Effect.runPromise(scryptInstance);

			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
			expect(result).toHaveProperty('run');
			expect(typeof result.run).toBe('function');
		});
	});

	test('Scrypt - makeScrypt test hash succeeds', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeScrypt Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should hash password successfully', async () => {
			const effect = makeScrypt(validConfig);
			const scryptInstance = await Effect.runPromise(effect);
			const result = await Effect.runPromise(scryptInstance);

			const testhash = (await Effect.runPromise(result.run('testpassword'))).toString('hex');

			expect(typeof testhash).toBe('string');
			expect(testhash).toMatch(/[a-f0-9]+$/);
		});
	});

	test('Scrypt - makeScrypt returns error with invalid config', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeScrypt Tests');
		await allure.tags(...sharedTags);

		vi.spyOn(_Scrypt, 'makeLive').mockImplementation(() => {
			throw new Error('scrypt config error');
		});

		await allure.step('Should return error when Scrypt.makeLive fails', async () => {
			const effect = makeScrypt(validConfig);
			await expect(Effect.runPromise(effect)).rejects.toThrow(
				/Failed to create Scrypt instance: scrypt config error/
			);
		});

		vi.restoreAllMocks();
	});
});
