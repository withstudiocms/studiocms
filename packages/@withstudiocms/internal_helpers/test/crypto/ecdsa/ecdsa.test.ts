import * as nodeCrypto from 'node:crypto';
import * as allure from 'allure-js-commons';
import { beforeAll, describe, expect, test } from 'vitest';
import { p192, p224, p256, p384, p521 } from '../../../src/crypto/ecdsa/curve-nist.js';
import {
	decodeIEEEP1363ECDSASignature,
	decodePKIXECDSAPublicKey,
	decodePKIXECDSASignature,
	decodeSEC1PublicKey,
	ECDSAPublicKey,
} from '../../../src/crypto/ecdsa/ecdsa.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'crypto/ecdsa/ecdsa';

const data: Uint8Array<ArrayBuffer> = new TextEncoder().encode('hello world');

describe(parentSuiteName, () => {
	test('ECDSASignature.encodeIEEEP1363() and decodeIEEEP1363ECDSASignature()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeIEEEP1363ECDSASignature()');
		await allure.tags(...sharedTags);

		await allure.step(
			'round-trips an IEEE P1363 signature through decode then encode',
			async (ctx) => {
				const keyPair = nodeCrypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
				const expected = new Uint8Array(
					nodeCrypto.sign('SHA256', data, { key: keyPair.privateKey, dsaEncoding: 'ieee-p1363' })
				);
				const signature = decodeIEEEP1363ECDSASignature(p256, expected);
				expect(signature.encodeIEEEP1363(p256)).toStrictEqual(expected);
				await ctx.parameter('curve', 'P-256');
				await ctx.parameter('encoding', 'ieee-p1363');
			}
		);
	});

	test('ECDSASignature.encodePKIX() and decodePKIXECDSASignature()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodePKIXECDSASignature()');
		await allure.tags(...sharedTags);

		await allure.step(
			'round-trips a DER/PKIX signature through decode then encode',
			async (ctx) => {
				const keyPair = nodeCrypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
				const expected = new Uint8Array(
					nodeCrypto.sign('SHA256', data, { key: keyPair.privateKey, dsaEncoding: 'der' })
				);
				const signature = decodePKIXECDSASignature(expected);
				expect(signature.encodePKIX()).toStrictEqual(expected);
				await ctx.parameter('curve', 'P-256');
				await ctx.parameter('encoding', 'DER');
			}
		);
	});

	test('decodeSEC1PublicKey()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeSEC1PublicKey()');
		await allure.tags(...sharedTags);

		await allure.step(
			'round-trips P-256 generator point via uncompressed encoding',
			async (ctx) => {
				const publicKey = new ECDSAPublicKey(p256, p256.g.x, p256.g.y);
				expect(decodeSEC1PublicKey(p256, publicKey.encodeSEC1Uncompressed())).toStrictEqual(
					publicKey
				);
				await ctx.parameter('curve', 'P-256');
				await ctx.parameter('encoding', 'uncompressed');
			}
		);

		await allure.step('round-trips P-192 generator point via compressed encoding', async (ctx) => {
			const publicKey = new ECDSAPublicKey(p192, p192.g.x, p192.g.y);
			expect(decodeSEC1PublicKey(p192, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);
			await ctx.parameter('curve', 'P-192');
			await ctx.parameter('encoding', 'compressed');
		});

		await allure.step('round-trips P-224 generator point via compressed encoding', async (ctx) => {
			const publicKey = new ECDSAPublicKey(p224, p224.g.x, p224.g.y);
			expect(decodeSEC1PublicKey(p224, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);
			await ctx.parameter('curve', 'P-224');
		});

		await allure.step('round-trips P-256 generator point via compressed encoding', async (ctx) => {
			const publicKey = new ECDSAPublicKey(p256, p256.g.x, p256.g.y);
			expect(decodeSEC1PublicKey(p256, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);
			await ctx.parameter('curve', 'P-256');
		});

		await allure.step('round-trips P-384 generator point via compressed encoding', async (ctx) => {
			const publicKey = new ECDSAPublicKey(p384, p384.g.x, p384.g.y);
			expect(decodeSEC1PublicKey(p384, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);
			await ctx.parameter('curve', 'P-384');
		});

		await allure.step('round-trips P-521 generator point via compressed encoding', async (ctx) => {
			const publicKey = new ECDSAPublicKey(p521, p521.g.x, p521.g.y);
			expect(decodeSEC1PublicKey(p521, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);
			await ctx.parameter('curve', 'P-521');
		});
	});

	// ── ECDSAPublicKey encoding tests (shared key pair) ────────────────────────

	let webcryptoKeys: CryptoKeyPair;
	let ecdsaSignature: ArrayBuffer;

	beforeAll(async () => {
		webcryptoKeys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
			'sign',
			'verify',
		]);
		ecdsaSignature = await crypto.subtle.sign(
			{ name: 'ECDSA', hash: 'SHA-256' },
			webcryptoKeys.privateKey,
			data
		);
	});

	test('ECDSAPublicKey.encodeSEC1Uncompressed()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ECDSAPublicKey.encodeSEC1Uncompressed()');
		await allure.tags(...sharedTags);

		await allure.step(
			'exported uncompressed key verifies original signature via WebCrypto',
			async (ctx) => {
				const raw1 = new Uint8Array(await crypto.subtle.exportKey('raw', webcryptoKeys.publicKey));
				const publicKey = decodeSEC1PublicKey(p256, raw1);
				const raw2 = publicKey.encodeSEC1Uncompressed() as Uint8Array<ArrayBuffer>;
				const webcryptoPublicKey = await crypto.subtle.importKey(
					'raw',
					raw2,
					{ name: 'ECDSA', namedCurve: 'P-256' },
					true,
					['verify']
				);
				await expect(
					crypto.subtle.verify(
						{ name: 'ECDSA', hash: 'SHA-256' },
						webcryptoPublicKey,
						ecdsaSignature,
						data
					)
				).resolves.toBe(true);
				await ctx.parameter('curve', 'P-256');
				await ctx.parameter('encoding', 'uncompressed');
			}
		);
	});

	test('ECDSAPublicKey.encodeSEC1Compressed()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ECDSAPublicKey.encodeSEC1Compressed()');
		await allure.tags(...sharedTags);

		await allure.step(
			'exported compressed key verifies original signature via WebCrypto',
			async (ctx) => {
				const raw1 = new Uint8Array(await crypto.subtle.exportKey('raw', webcryptoKeys.publicKey));
				const publicKey = decodeSEC1PublicKey(p256, raw1);
				const raw2 = publicKey.encodeSEC1Compressed() as Uint8Array<ArrayBuffer>;
				const webcryptoPublicKey = await crypto.subtle.importKey(
					'raw',
					raw2,
					{ name: 'ECDSA', namedCurve: 'P-256' },
					true,
					['verify']
				);
				await expect(
					crypto.subtle.verify(
						{ name: 'ECDSA', hash: 'SHA-256' },
						webcryptoPublicKey,
						ecdsaSignature,
						data
					)
				).resolves.toBe(true);
				await ctx.parameter('curve', 'P-256');
				await ctx.parameter('encoding', 'compressed');
			}
		);
	});

	test('ECDSAPublicKey.encodePKIXUncompressed()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ECDSAPublicKey.encodePKIXUncompressed()');
		await allure.tags(...sharedTags);

		await allure.step(
			'exported PKIX uncompressed key verifies original signature via WebCrypto',
			async (ctx) => {
				const der1 = new Uint8Array(await crypto.subtle.exportKey('spki', webcryptoKeys.publicKey));
				const publicKey = decodePKIXECDSAPublicKey(der1, [p256]);
				const der2 = publicKey.encodePKIXUncompressed() as Uint8Array<ArrayBuffer>;
				const webcryptoPublicKey = await crypto.subtle.importKey(
					'spki',
					der2,
					{ name: 'ECDSA', namedCurve: 'P-256' },
					true,
					['verify']
				);
				await expect(
					crypto.subtle.verify(
						{ name: 'ECDSA', hash: 'SHA-256' },
						webcryptoPublicKey,
						ecdsaSignature,
						data
					)
				).resolves.toBe(true);
				await ctx.parameter('curve', 'P-256');
				await ctx.parameter('encoding', 'PKIX uncompressed');
			}
		);
	});

	test('ECDSAPublicKey.encodePKIXCompressed()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ECDSAPublicKey.encodePKIXCompressed()');
		await allure.tags(...sharedTags);

		await allure.step(
			'exported PKIX compressed key verifies original signature via WebCrypto',
			async (ctx) => {
				const der1 = new Uint8Array(await crypto.subtle.exportKey('spki', webcryptoKeys.publicKey));
				const publicKey = decodePKIXECDSAPublicKey(der1, [p256]);
				const der2 = publicKey.encodePKIXCompressed() as Uint8Array<ArrayBuffer>;
				const webcryptoPublicKey = await crypto.subtle.importKey(
					'spki',
					der2,
					{ name: 'ECDSA', namedCurve: 'P-256' },
					true,
					['verify']
				);
				await expect(
					crypto.subtle.verify(
						{ name: 'ECDSA', hash: 'SHA-256' },
						webcryptoPublicKey,
						ecdsaSignature,
						data
					)
				).resolves.toBe(true);
				await ctx.parameter('curve', 'P-256');
				await ctx.parameter('encoding', 'PKIX compressed');
			}
		);
	});
});
