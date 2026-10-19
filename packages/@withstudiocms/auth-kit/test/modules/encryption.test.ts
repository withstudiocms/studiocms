/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Effect, runEffect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { Encryption } from '../../src/modules/encryption.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Encryption Module Tests';

// Generate a 16-byte base64 key for AES-128-GCM
const keyBytes = new Uint8Array(16);
for (let i = 0; i < 16; i++) keyBytes[i] = i + 1;
const CMS_ENCRYPTION_KEY = Buffer.from(keyBytes).toString('base64');

const serviceBuilder = Effect.gen(function* () {
	const _service = yield* Encryption(CMS_ENCRYPTION_KEY);
	return _service;
});

describe(parentSuiteName, async () => {
	const service = await runEffect(serviceBuilder);

	test('Encryption Module - encrypt and decrypt Uint8Array roundtrip', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encrypt/decrypt Uint8Array Tests');
		await allure.tags(...sharedTags);

		const data = new TextEncoder().encode('StudioCMS encryption test');

		await allure.step('Should encrypt and decrypt Uint8Array correctly', async () => {
			const encrypted = await runEffect(service.encrypt(data));
			expect(encrypted).toBeInstanceOf(Uint8Array);
			expect(encrypted.length).toBeGreaterThan(32);

			const decrypted = await runEffect(service.decrypt(encrypted));
			expect(decrypted).toBeInstanceOf(Uint8Array);
			expect(new TextDecoder().decode(decrypted)).toBe('StudioCMS encryption test');
		});
	});

	test('Encryption Module - encryptToString and decryptToString roundtrip', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encryptToString/decryptToString Tests');
		await allure.tags(...sharedTags);

		const plaintext = 'StudioCMS string encryption test';

		await allure.step('Should encrypt and decrypt string correctly', async () => {
			const encrypted = await runEffect(service.encryptToString(plaintext));
			expect(encrypted).toBeInstanceOf(Uint8Array);

			const decrypted = await runEffect(service.decryptToString(encrypted));
			expect(decrypted).toBe(plaintext);
		});
	});

	test('Encryption Module - decrypt throws DecryptionError on invalid data', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decrypt Error Handling Tests');
		await allure.tags(...sharedTags);

		const shortData = new Uint8Array(10);

		await allure.step('Should throw DecryptionError for too-short data', async () => {
			let err: any;
			try {
				await runEffect(service.decrypt(shortData));
			} catch (e) {
				err = e;
			}
			const parsedError = JSON.parse(JSON.stringify(err));
			expect(parsedError.cause.failure._tag).toMatch(/DecryptionError/);
		});
	});

	test('Encryption Module - decryptToString throws DecryptionError on invalid data', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decryptToString Error Handling Tests');
		await allure.tags(...sharedTags);

		const shortData = new Uint8Array(10);

		await allure.step('Should throw DecryptionError for too-short data', async () => {
			let err: any;
			try {
				await runEffect(service.decryptToString(shortData));
			} catch (e) {
				err = e;
			}
			const parsedError = JSON.parse(JSON.stringify(err));
			expect(parsedError.cause.failure._tag).toMatch(/DecryptionError/);
		});
	});

	test('Encryption Module - encrypt and decrypt empty string', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encrypt/decrypt empty string Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should encrypt and decrypt empty string correctly', async () => {
			const encrypted = await runEffect(service.encryptToString(''));
			const string = await runEffect(service.decryptToString(encrypted));
			expect(string).toBe('');
		});
	});
});
