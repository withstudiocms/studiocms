/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Effect, runEffect } from '@withstudiocms/effect';
import { describe, expect, it } from 'vitest';
import { Encryption } from '../../src/modules/encryption.js';

// Generate a 16-byte base64 key for AES-128-GCM
const keyBytes = new Uint8Array(16);
for (let i = 0; i < 16; i++) keyBytes[i] = i + 1;
const CMS_ENCRYPTION_KEY = Buffer.from(keyBytes).toString('base64');

const serviceBuilder = Effect.gen(function* () {
	const _service = yield* Encryption(CMS_ENCRYPTION_KEY);
	return _service;
});

describe('Encryption Module', () => {
	it('encrypt and decrypt Uint8Array roundtrip', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const data = new TextEncoder().encode('StudioCMS encryption test');
		const encrypted = await runEffect(service.encrypt(data));
		expect(encrypted).toBeInstanceOf(Uint8Array);
		expect(encrypted.length).toBeGreaterThan(32);

		const decrypted = await runEffect(service.decrypt(encrypted));
		expect(decrypted).toBeInstanceOf(Uint8Array);
		expect(new TextDecoder().decode(decrypted)).toBe('StudioCMS encryption test');
	});

	it('encryptToString and decryptToString roundtrip', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const plaintext = 'StudioCMS string encryption test';
		const encrypted = await runEffect(service.encryptToString(plaintext));
		expect(encrypted).toBeInstanceOf(Uint8Array);

		const decrypted = await runEffect(service.decryptToString(encrypted));
		expect(decrypted).toBe(plaintext);
	});

	it('decrypt throws on too-short data', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const shortData = new Uint8Array(10);
		let err: any;
		try {
			await runEffect(service.decrypt(shortData));
		} catch (e) {
			err = e;
		}
		const parsedError = JSON.parse(JSON.stringify(err));
		expect(parsedError.cause.failure._tag).toMatch(/DecryptionError/);
	});

	it('decryptToString throws on too-short data', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const shortData = new Uint8Array(10);
		let err: any;
		try {
			await runEffect(service.decryptToString(shortData));
		} catch (e) {
			err = e;
		}
		const parsedError = JSON.parse(JSON.stringify(err));
		expect(parsedError.cause.failure._tag).toMatch(/DecryptionError/);
	});

	it('encrypt and decrypt empty string', async () => {
		const service = await Effect.runPromise(serviceBuilder);
		const encrypted = await runEffect(service.encryptToString(''));
		const string = await runEffect(service.decryptToString(encrypted));
		expect(string).toBe('');
	});
});
