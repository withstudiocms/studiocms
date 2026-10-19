import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	decodePKIXRSAPublicKey,
	sha256ObjectIdentifier,
	verifyRSASSAPKCS1v15Signature,
} from '../../../src/crypto/rsa/index.js';
import { sha256 } from '../../../src/crypto/sha2/sha256.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'crypto/rsa';

const data: Uint8Array<ArrayBuffer> = new TextEncoder().encode('hello world');

describe(parentSuiteName, () => {
	test('decodePKIXRSAPublicKey()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodePKIXRSAPublicKey()');
		await allure.tags(...sharedTags);

		await allure.step(
			'decodes SPKI public key and verifies an RSA-PKCS1v15 signature',
			async (ctx) => {
				const webcryptoKeys = await crypto.subtle.generateKey(
					{
						name: 'RSASSA-PKCS1-v1_5',
						modulusLength: 2048,
						publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
						hash: 'SHA-256',
					},
					true,
					['verify', 'sign']
				);
				const pkcs1 = new Uint8Array(
					await crypto.subtle.exportKey('spki', webcryptoKeys.publicKey)
				);
				const signature = new Uint8Array(
					await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, webcryptoKeys.privateKey, data)
				);
				const publicKey = decodePKIXRSAPublicKey(pkcs1);
				expect(
					verifyRSASSAPKCS1v15Signature(publicKey, sha256ObjectIdentifier, sha256(data), signature)
				).toBe(true);
				await ctx.parameter('modulus length', String(2048));
				await ctx.parameter('hash', 'SHA-256');
				await ctx.parameter('data', new TextDecoder().decode(data));
			}
		);
	});

	test('RSAPublicKey.encodePKIX()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('RSAPublicKey.encodePKIX()');
		await allure.tags(...sharedTags);

		await allure.step(
			'round-trips through decodePKIXRSAPublicKey and encodePKIX()',
			async (ctx) => {
				const webcryptoKeys = await crypto.subtle.generateKey(
					{
						name: 'RSASSA-PKCS1-v1_5',
						modulusLength: 2048,
						publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
						hash: 'SHA-256',
					},
					true,
					['verify', 'sign']
				);
				const pkcs1 = new Uint8Array(
					await crypto.subtle.exportKey('spki', webcryptoKeys.publicKey)
				);
				const signature = new Uint8Array(
					await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, webcryptoKeys.privateKey, data)
				);
				const publicKey = decodePKIXRSAPublicKey(pkcs1);
				const webcryptoPublicKey = await crypto.subtle.importKey(
					'spki',
					publicKey.encodePKIX() as Uint8Array<ArrayBuffer>,
					{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
					true,
					['verify']
				);
				await expect(
					crypto.subtle.verify('RSASSA-PKCS1-v1_5', webcryptoPublicKey, signature, data)
				).resolves.toBe(true);
				await ctx.parameter('modulus length', String(2048));
				await ctx.parameter('hash', 'SHA-256');
			}
		);
	});
});
