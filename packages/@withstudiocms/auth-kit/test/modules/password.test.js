import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Effect, runEffect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt, ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import { Password } from '../../dist/modules/password.js';

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

describe('Password Module', () => {
	test('hashPassword produces a secure password string', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const hash = await runEffect(service.hashPassword('myPassword123'));
		assert.match(hash, /^gen1\.0:[a-f0-9]{32}:[a-f0-9]+$/);
	});

	test('verifyPasswordHash returns true for correct password', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const hash = await runEffect(service.hashPassword('myPassword123'));
		const result = await runEffect(service.verifyPasswordHash(hash, 'myPassword123'));
		assert.equal(result, true);
	});

	test('verifyPasswordHash returns false for incorrect password', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const hash = await runEffect(service.hashPassword('myPassword123'));
		const result = await runEffect(service.verifyPasswordHash(hash, 'wrongPassword'));
		assert.equal(result, false);
	});

	test('verifyPasswordStrength returns true for a strong password', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const result = await runEffect(service.verifyPasswordStrength('Str0ngP@ssw0rd123!'));
		assert.equal(result, true);
	});

	test('verifyPasswordStrength returns error string for short password', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const result = await runEffect(service.verifyPasswordStrength('123'));
		assert.match(result, /Password must be between 6 and 255 characters long/);
	});
});
