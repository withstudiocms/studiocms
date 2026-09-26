import { Effect, runEffect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt, ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { Password } from '../../src/modules/password.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Password Module Tests';

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

const serviceBuilder = Effect.gen(function* () {
	const _service = yield* Password(Scrypt);
	return _service;
});

describe(parentSuiteName, async () => {
	const service = await runEffect(serviceBuilder);

	test('Password Module - hashPassword produces a secure password string', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('hashPassword Tests');
		await allure.tags(...sharedTags);

		const password = 'myPassword123';

		await allure.step('Should produce a secure password hash', async () => {
			const hash = await runEffect(service.hashPassword(password));
			expect(hash).toMatch(/^gen1\.0:[a-f0-9]{32}:[a-f0-9]+$/);
		});
	});

	test('Password Module - verifyPasswordHash returns true for correct password', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('verifyPasswordHash Tests');
		await allure.tags(...sharedTags);

		const password = 'myPassword123';
		const hash = await runEffect(service.hashPassword(password));

		await allure.step('Should verify correct password successfully', async () => {
			const result = await runEffect(service.verifyPasswordHash(hash, password));
			expect(result).toBe(true);
		});
	});

	test('Password Module - verifyPasswordHash returns false for incorrect password', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('verifyPasswordHash Tests');
		await allure.tags(...sharedTags);

		const password = 'myPassword123';
		const wrongPassword = 'wrongPassword';
		const hash = await runEffect(service.hashPassword(password));

		await allure.step('Should fail to verify incorrect password', async () => {
			const result = await runEffect(service.verifyPasswordHash(hash, wrongPassword));
			expect(result).toBe(false);
		});
	});

	test('Password Module - verifyPasswordStrength returns true for a strong password', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('verifyPasswordStrength Tests');
		await allure.tags(...sharedTags);

		const strongPassword = 'Str0ngP@ssw0rd123!';

		await allure.step('Should verify strong password successfully', async () => {
			const result = await runEffect(service.verifyPasswordStrength(strongPassword));
			expect(result).toBe(true);
		});
	});

	test('Password Module - verifyPasswordStrength returns error string for short password', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('verifyPasswordStrength Tests');
		await allure.tags(...sharedTags);

		const shortPassword = '123';

		await allure.step('Should return error for short password', async () => {
			const result = await runEffect(service.verifyPasswordStrength(shortPassword));
			expect(result).toMatch(/Password must be between 6 and 255 characters long/);
		});
	});
});
