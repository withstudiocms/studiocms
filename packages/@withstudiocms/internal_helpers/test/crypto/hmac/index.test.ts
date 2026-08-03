import { describe, expect, test } from 'vitest';
import { HMAC } from '../../../src/crypto/hmac/index.js';
import { SHA1 } from '../../../src/crypto/sha1/index.js';
import { SHA256 } from '../../../src/crypto/sha2/sha256.js';
import { SHA512 } from '../../../src/crypto/sha2/sha512.js';

describe('HMAC', () => {
	test('SHA-1', async () => {
		const key1 = new Uint8Array(20);
		crypto.getRandomValues(key1);
		const key2 = new Uint8Array(64);
		crypto.getRandomValues(key2);
		const key3 = new Uint8Array(80);
		crypto.getRandomValues(key1);
		const cryptoKey1 = await createWebCryptoKey(key1, 'SHA-1');
		const cryptoKey2 = await createWebCryptoKey(key2, 'SHA-1');
		const cryptoKey3 = await createWebCryptoKey(key3, 'SHA-1');

		const randomValues = crypto.getRandomValues(new Uint8Array(200));
		for (let i = 0; i < randomValues.byteLength + 1; i++) {
			const data = randomValues.slice(0, i);
			const mac1 = new HMAC(SHA1, key1);
			mac1.update(data);
			const result1 = mac1.digest();
			const expected1 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey1, data));
			expect(result1).toStrictEqual(expected1);

			const mac2 = new HMAC(SHA1, key2);
			mac2.update(data);
			const result2 = mac2.digest();
			const expected2 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey2, data));
			expect(result2).toStrictEqual(expected2);

			const mac3 = new HMAC(SHA1, key3);
			mac3.update(data);
			const result3 = mac3.digest();
			const expected3 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey3, data));
			expect(result3).toStrictEqual(expected3);
		}
	});

	test('SHA-256', async () => {
		const key1 = new Uint8Array(20);
		crypto.getRandomValues(key1);
		const key2 = new Uint8Array(64);
		crypto.getRandomValues(key2);
		const key3 = new Uint8Array(80);
		crypto.getRandomValues(key1);
		const cryptoKey1 = await createWebCryptoKey(key1, 'SHA-256');
		const cryptoKey2 = await createWebCryptoKey(key2, 'SHA-256');
		const cryptoKey3 = await createWebCryptoKey(key3, 'SHA-256');

		const randomValues = crypto.getRandomValues(new Uint8Array(200));
		for (let i = 0; i < randomValues.byteLength + 1; i++) {
			const data = randomValues.slice(0, i);
			const mac1 = new HMAC(SHA256, key1);
			mac1.update(data);
			const result1 = mac1.digest();
			const expected1 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey1, data));
			expect(result1).toStrictEqual(expected1);

			const mac2 = new HMAC(SHA256, key2);
			mac2.update(data);
			const result2 = mac2.digest();
			const expected2 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey2, data));
			expect(result2).toStrictEqual(expected2);

			const mac3 = new HMAC(SHA256, key3);
			mac3.update(data);
			const result3 = mac3.digest();
			const expected3 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey3, data));
			expect(result3).toStrictEqual(expected3);
		}
	});

	test('SHA-512', async () => {
		const key1 = new Uint8Array(20);
		crypto.getRandomValues(key1);
		const key2 = new Uint8Array(128);
		crypto.getRandomValues(key2);
		const key3 = new Uint8Array(160);
		crypto.getRandomValues(key1);

		const cryptoKey1 = await createWebCryptoKey(key1, 'SHA-512');
		const cryptoKey2 = await createWebCryptoKey(key2, 'SHA-512');
		const cryptoKey3 = await createWebCryptoKey(key3, 'SHA-512');

		const randomValues = crypto.getRandomValues(new Uint8Array(200));
		for (let i = 0; i < randomValues.byteLength + 1; i++) {
			const data = randomValues.slice(0, i);
			const mac1 = new HMAC(SHA512, key1);
			mac1.update(data);
			const result1 = mac1.digest();
			const expected1 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey1, data));
			expect(result1).toStrictEqual(expected1);

			const mac2 = new HMAC(SHA512, key2);
			mac2.update(data);
			const result2 = mac2.digest();
			const expected2 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey2, data));
			expect(result2).toStrictEqual(expected2);

			const mac3 = new HMAC(SHA512, key3);
			mac3.update(data);
			const result3 = mac3.digest();
			const expected3 = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey3, data));
			expect(result3).toStrictEqual(expected3);
		}
	});
});

async function createWebCryptoKey(key: Uint8Array, hash: string): Promise<CryptoKey> {
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		key,
		{
			name: 'HMAC',
			hash: hash,
		},
		false,
		['sign']
	);
	return cryptoKey;
}
