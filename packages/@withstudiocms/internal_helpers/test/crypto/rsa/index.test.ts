import { describe, expect, test } from 'vitest';
import {
	decodePKIXRSAPublicKey,
	sha256ObjectIdentifier,
	verifyRSASSAPKCS1v15Signature,
} from '../../../src/crypto/rsa/index.js';
import { sha256 } from '../../../src/crypto/sha2/sha256.js';

const data = new TextEncoder().encode('hello world');

test('decodePKIXRSAPublicKey()', async () => {
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
	const pkcs1 = new Uint8Array(await crypto.subtle.exportKey('spki', webcryptoKeys.publicKey));
	const signature = new Uint8Array(
		await crypto.subtle.sign(
			{
				name: 'RSASSA-PKCS1-v1_5',
			},
			webcryptoKeys.privateKey,
			data
		)
	);
	const publicKey = decodePKIXRSAPublicKey(pkcs1);
	expect(
		verifyRSASSAPKCS1v15Signature(publicKey, sha256ObjectIdentifier, sha256(data), signature)
	).toBe(true);
});

describe('RSAPublicKey', () => {
	test('RSAPublicKey.encodePKIX()', async () => {
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
		const pkcs1 = new Uint8Array(await crypto.subtle.exportKey('spki', webcryptoKeys.publicKey));
		const signature = new Uint8Array(
			await crypto.subtle.sign(
				{
					name: 'RSASSA-PKCS1-v1_5',
				},
				webcryptoKeys.privateKey,
				data
			)
		);
		const publicKey = decodePKIXRSAPublicKey(pkcs1);
		const webcryptoPublicKey = await crypto.subtle.importKey(
			'spki',
			publicKey.encodePKIX(),
			{
				name: 'RSASSA-PKCS1-v1_5',
				hash: 'SHA-256',
			},
			true,
			['verify']
		);
		expect(
			crypto.subtle.verify('RSASSA-PKCS1-v1_5', webcryptoPublicKey, signature, data)
		).resolves.toBe(true);
	});
});
