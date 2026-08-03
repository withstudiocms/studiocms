import * as nodeCrypto from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { p192, p224, p256, p384, p521 } from '../../../src/crypto/ecdsa/curve-nist.js';
import {
	decodeIEEEP1363ECDSASignature,
	decodePKIXECDSAPublicKey,
	decodePKIXECDSASignature,
	decodeSEC1PublicKey,
	ECDSAPublicKey,
} from '../../../src/crypto/ecdsa/ecdsa.js';

test('ECDSASignature.encodeIEEEP1363() and decodeIEEEP1363ECDSASignature()', async () => {
	const data = new TextEncoder().encode('hello world');
	const keyPair = nodeCrypto.generateKeyPairSync('ec', {
		namedCurve: 'P-256',
	});
	const expected = new Uint8Array(
		nodeCrypto.sign('SHA256', data, {
			key: keyPair.privateKey,
			dsaEncoding: 'ieee-p1363',
		})
	);
	const signature = decodeIEEEP1363ECDSASignature(p256, expected);
	expect(signature.encodeIEEEP1363(p256)).toStrictEqual(expected);
});

test('ECDSASignature.encodePKIX() and decodePKIXECDSASignature()', async () => {
	const data = new TextEncoder().encode('hello world');
	const keyPair = nodeCrypto.generateKeyPairSync('ec', {
		namedCurve: 'P-256',
	});
	const expected = new Uint8Array(
		nodeCrypto.sign('SHA256', data, {
			key: keyPair.privateKey,
			dsaEncoding: 'der',
		})
	);
	const signature = decodePKIXECDSASignature(expected);
	expect(signature.encodePKIX()).toStrictEqual(expected);
});

test('decodeSEC1PublicKey()', () => {
	let publicKey = new ECDSAPublicKey(p256, p256.g.x, p256.g.y);
	expect(decodeSEC1PublicKey(p256, publicKey.encodeSEC1Uncompressed())).toStrictEqual(publicKey);

	publicKey = new ECDSAPublicKey(p192, p192.g.x, p192.g.y);
	expect(decodeSEC1PublicKey(p192, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);

	publicKey = new ECDSAPublicKey(p224, p224.g.x, p224.g.y);
	expect(decodeSEC1PublicKey(p224, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);

	publicKey = new ECDSAPublicKey(p256, p256.g.x, p256.g.y);
	expect(decodeSEC1PublicKey(p256, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);

	publicKey = new ECDSAPublicKey(p384, p384.g.x, p384.g.y);
	expect(decodeSEC1PublicKey(p384, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);

	publicKey = new ECDSAPublicKey(p521, p521.g.x, p521.g.y);
	expect(decodeSEC1PublicKey(p521, publicKey.encodeSEC1Compressed())).toStrictEqual(publicKey);
});

describe('ECDSAPublicKey', async () => {
	const data = new TextEncoder().encode('hello world');

	const webcryptoKeys = await crypto.subtle.generateKey(
		{
			name: 'ECDSA',
			namedCurve: 'P-256',
		},
		true,
		['sign', 'verify']
	);
	const signature = await crypto.subtle.sign(
		{
			name: 'ECDSA',
			hash: 'SHA-256',
		},
		webcryptoKeys.privateKey,
		data
	);

	test('ECDSAPublicKey.encodeSEC1Uncompressed()', async () => {
		const raw1 = new Uint8Array(await crypto.subtle.exportKey('raw', webcryptoKeys.publicKey));
		const publicKey = decodeSEC1PublicKey(p256, raw1);
		const raw2 = publicKey.encodeSEC1Uncompressed();
		const webcryptoPublicKey = await crypto.subtle.importKey(
			'raw',
			raw2,
			{
				name: 'ECDSA',
				namedCurve: 'P-256',
			},
			true,
			['verify']
		);
		await expect(
			crypto.subtle.verify(
				{
					name: 'ECDSA',
					hash: 'SHA-256',
				},
				webcryptoPublicKey,
				signature,
				data
			)
		).resolves.toBe(true);
	});

	test('ECDSAPublicKey.encodeSEC1Compressed()', async () => {
		const raw1 = new Uint8Array(await crypto.subtle.exportKey('raw', webcryptoKeys.publicKey));
		const publicKey = decodeSEC1PublicKey(p256, raw1);
		const raw2 = publicKey.encodeSEC1Compressed();
		const webcryptoPublicKey = await crypto.subtle.importKey(
			'raw',
			raw2,
			{
				name: 'ECDSA',
				namedCurve: 'P-256',
			},
			true,
			['verify']
		);
		await expect(
			crypto.subtle.verify(
				{
					name: 'ECDSA',
					hash: 'SHA-256',
				},
				webcryptoPublicKey,
				signature,
				data
			)
		).resolves.toBe(true);
	});

	test('ECDSAPublicKey.encodePKIXUncompressed()', async () => {
		const der1 = new Uint8Array(await crypto.subtle.exportKey('spki', webcryptoKeys.publicKey));
		const publicKey = decodePKIXECDSAPublicKey(der1, [p256]);
		const der2 = publicKey.encodePKIXUncompressed();
		const webcryptoPublicKey = await crypto.subtle.importKey(
			'spki',
			der2,
			{
				name: 'ECDSA',
				namedCurve: 'P-256',
			},
			true,
			['verify']
		);
		await expect(
			crypto.subtle.verify(
				{
					name: 'ECDSA',
					hash: 'SHA-256',
				},
				webcryptoPublicKey,
				signature,
				data
			)
		).resolves.toBe(true);
	});

	test('ECDSAPublicKey.encodePKIXCompressed()', async () => {
		const der1 = new Uint8Array(await crypto.subtle.exportKey('spki', webcryptoKeys.publicKey));
		const publicKey = decodePKIXECDSAPublicKey(der1, [p256]);
		const der2 = publicKey.encodePKIXCompressed();
		const webcryptoPublicKey = await crypto.subtle.importKey(
			'spki',
			der2,
			{
				name: 'ECDSA',
				namedCurve: 'P-256',
			},
			true,
			['verify']
		);
		await expect(
			crypto.subtle.verify(
				{
					name: 'ECDSA',
					hash: 'SHA-256',
				},
				webcryptoPublicKey,
				signature,
				data
			)
		).resolves.toBe(true);
	});
});
