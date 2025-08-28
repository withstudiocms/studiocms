import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Effect, runEffect } from '@withstudiocms/effect';
import { Encryption } from '../../dist/modules/encryption.js';

// Generate a 16-byte base64 key for AES-128-GCM
const keyBytes = new Uint8Array(16);
for (let i = 0; i < 16; i++) keyBytes[i] = i + 1;
const CMS_ENCRYPTION_KEY = Buffer.from(keyBytes).toString('base64');

const serviceBuilder = Effect.gen(function* () {
	const _service = yield* Encryption(CMS_ENCRYPTION_KEY);
	return _service;
});

describe('Encryption Module', () => {
	test('encrypt and decrypt Uint8Array roundtrip', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const data = new TextEncoder().encode('StudioCMS encryption test');
		const encrypted = await runEffect(service.encrypt(data));
		assert(encrypted instanceof Uint8Array);
		assert(encrypted.length > 32);

		const decrypted = await runEffect(service.decrypt(encrypted));
		assert(decrypted instanceof Uint8Array);
		assert.equal(new TextDecoder().decode(decrypted), 'StudioCMS encryption test');
	});

	test('encryptToString and decryptToString roundtrip', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const plaintext = 'StudioCMS string encryption test';
		const encrypted = await runEffect(service.encryptToString(plaintext));
		assert(encrypted instanceof Uint8Array);

		const decrypted = await runEffect(service.decryptToString(encrypted));
		assert.equal(decrypted, plaintext);
	});

	test('decrypt throws on too-short data', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const shortData = new Uint8Array(10);
		const err = await runEffect(service.decrypt(shortData)).catch((e) => JSON.stringify(e));
		const parsedError = JSON.parse(err);

		assert.match(parsedError.cause.failure._tag, /DecryptionError/);
	});

	test('decryptToString throws on too-short data', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const shortData = new Uint8Array(10);
		const err = await runEffect(service.decryptToString(shortData)).catch((e) => JSON.stringify(e));
		const parsedError = JSON.parse(err);

		assert.match(parsedError.cause.failure._tag, /DecryptionError/);
	});

	test('fails to encrypt and decrypt empty string', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const encrypted = await runEffect(service.encryptToString(''));
		const err = await runEffect(service.decryptToString(encrypted)).catch((e) => JSON.stringify(e));
		const parsedError = JSON.parse(err);

		assert.match(parsedError.cause.failure._tag, /DecryptionError/);
	});
});
