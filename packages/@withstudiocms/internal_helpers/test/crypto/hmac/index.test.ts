import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { HMAC } from '../../../src/crypto/hmac/index.js';
import { SHA1 } from '../../../src/crypto/sha1/index.js';
import { SHA256 } from '../../../src/crypto/sha2/sha256.js';
import { SHA512 } from '../../../src/crypto/sha2/sha512.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'crypto/hmac';

async function createWebCryptoKey(key: Uint8Array, hash: string): Promise<CryptoKey> {
	return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash }, false, ['sign']);
}

describe(parentSuiteName, () => {
	test('HMAC - SHA-1', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('HMAC');
		await allure.tags(...sharedTags);

		await allure.step(
			'matches WebCrypto HMAC-SHA1 across key sizes (20, 64, 80 bytes)',
			async (ctx) => {
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
					expect(mac1.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey1, data))
					);

					const mac2 = new HMAC(SHA1, key2);
					mac2.update(data);
					expect(mac2.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey2, data))
					);

					const mac3 = new HMAC(SHA1, key3);
					mac3.update(data);
					expect(mac3.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey3, data))
					);
				}
				await ctx.parameter('hash', 'SHA-1');
				await ctx.parameter('key sizes', '20, 64, 80 bytes');
				await ctx.parameter('data iterations', String(201));
			}
		);
	});

	test('HMAC - SHA-256', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('HMAC');
		await allure.tags(...sharedTags);

		await allure.step(
			'matches WebCrypto HMAC-SHA256 across key sizes (20, 64, 80 bytes)',
			async (ctx) => {
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
					expect(mac1.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey1, data))
					);

					const mac2 = new HMAC(SHA256, key2);
					mac2.update(data);
					expect(mac2.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey2, data))
					);

					const mac3 = new HMAC(SHA256, key3);
					mac3.update(data);
					expect(mac3.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey3, data))
					);
				}
				await ctx.parameter('hash', 'SHA-256');
				await ctx.parameter('key sizes', '20, 64, 80 bytes');
				await ctx.parameter('data iterations', String(201));
			}
		);
	});

	test('HMAC - SHA-512', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('HMAC');
		await allure.tags(...sharedTags);

		await allure.step(
			'matches WebCrypto HMAC-SHA512 across key sizes (20, 128, 160 bytes)',
			async (ctx) => {
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
					expect(mac1.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey1, data))
					);

					const mac2 = new HMAC(SHA512, key2);
					mac2.update(data);
					expect(mac2.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey2, data))
					);

					const mac3 = new HMAC(SHA512, key3);
					mac3.update(data);
					expect(mac3.digest()).toStrictEqual(
						new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey3, data))
					);
				}
				await ctx.parameter('hash', 'SHA-512');
				await ctx.parameter('key sizes', '20, 128, 160 bytes');
				await ctx.parameter('data iterations', String(201));
			}
		);
	});
});
