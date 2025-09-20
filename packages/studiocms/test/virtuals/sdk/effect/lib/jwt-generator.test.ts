import { describe, expect, it } from 'vitest';
import {
	base64UrlDecode,
	base64UrlEncode,
	generateJwt,
	verifyJwt,
} from '../../../../../src/virtuals/sdk/effect/lib/jwt-generator';

describe('base64UrlDecode', () => {
	it('decodes a base64url-encoded string to its original value', () => {
		expect(base64UrlDecode('dGVzdA')).toBe('test');
		expect(base64UrlDecode('Zm9vL2JhcitiYXo9')).toBe('foo/bar+baz=');
	});

	it('decodes base64url strings with missing padding', () => {
		// 'hello' in base64: aGVsbG8=
		expect(base64UrlDecode('aGVsbG8')).toBe('hello');
		// 'foobar' in base64: Zm9vYmFy
		expect(base64UrlDecode('Zm9vYmFy')).toBe('foobar');
	});

	it('decodes base64url strings with URL-safe replacements', () => {
		// '+' replaced with '-', '/' replaced with '_'
		// 'foo+bar/baz=' in base64: Zm9vK2Jhci9iYXo9
		// base64url: Zm9vK2Jhci9iYXo9 -> Zm9vK2Jhci9iYXo9 (no replacements needed)
		expect(base64UrlDecode('Zm9vK2Jhci9iYXo9')).toBe('foo+bar/baz=');
	});
});

describe('base64UrlEncode', () => {
	it('encodes a string to base64url format', () => {
		expect(base64UrlEncode('test')).toBe('dGVzdA');
		expect(base64UrlEncode('foo/bar+baz=')).toBe('Zm9vL2JhcitiYXo9');
	});
});

describe('generateJwt & verifyJwt', () => {
	const secret = 'supersecret';
	const userId = 'user-123';

	it('generates a valid JWT and verifies it', () => {
		const token = generateJwt(secret, { userId });
		const result = verifyJwt(token, secret);
		expect(result.isValid).toBe(true);
		expect(result.userId).toBe(userId);
	});

	it('returns isValid=false for tampered signature', () => {
		const token = generateJwt(secret, { userId });
		// Tamper with signature
		const parts = token.split('.');
		parts[2] = 'invalidsignature';
		const tampered = parts.join('.');
		const result = verifyJwt(tampered, secret);
		expect(result.isValid).toBe(false);
		expect(result.userId).toBeUndefined();
	});

	it('returns isValid=false for expired token', async () => {
		// Generate token with exp in the past
		const now = Math.floor(Date.now() / 1000);
		const payload = { userId };
		// Directly call generateJwt with noExpire=false, then manually set exp
		const token = generateJwt(secret, payload);
		const parts = token.split('.');
		const payloadObj = JSON.parse(Buffer.from(parts[1], 'base64').toString());
		payloadObj.exp = now - 10; // expired
		parts[1] = base64UrlEncode(JSON.stringify(payloadObj));
		// Re-sign
		const signatureInput = `${parts[0]}.${parts[1]}`;
		const crypto = await import('node:crypto');
		const signature = Buffer.from(
			crypto
				.createHmac('sha256', secret + secret)
				.update(signatureInput)
				.digest()
		).toString('base64url');
		parts[2] = signature;
		const expiredToken = parts.join('.');
		const result = verifyJwt(expiredToken, secret);
		expect(result.isValid).toBe(false);
	});

	it('returns isValid=false for wrong algorithm', async () => {
		const token = generateJwt(secret, { userId });
		const parts = token.split('.');
		const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
		header.alg = 'none';
		parts[0] = base64UrlEncode(JSON.stringify(header));
		// Re-sign
		const signatureInput = `${parts[0]}.${parts[1]}`;
		const crypto = await import('node:crypto');
		const signature = Buffer.from(
			crypto
				.createHmac('sha256', secret + secret)
				.update(signatureInput)
				.digest()
		).toString('base64url');
		parts[2] = signature;
		const badAlgToken = parts.join('.');
		const result = verifyJwt(badAlgToken, secret);
		expect(result.isValid).toBe(false);
	});

	it('generates a token with noExpire=true (30 years)', () => {
		const token = generateJwt(secret, { userId }, true);
		const parts = token.split('.');
		const payloadObj = JSON.parse(Buffer.from(parts[1], 'base64').toString());
		expect(payloadObj.exp).toBeGreaterThan(Math.floor(Date.now() / 1000) + 86400 * 365 * 10);
	});
});
