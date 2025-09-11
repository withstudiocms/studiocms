import { runEffect } from '@withstudiocms/effect';
import { describe, expect, it } from 'vitest';
import {
	breakSecurePassword,
	buildSecurePassword,
	constantTimeEqual,
	PASS_GEN1_0_PREFIX,
	verifyPasswordLength,
	verifySafe,
} from '../../src/utils/password.js';

describe('Password Utils', () => {
	it('constantTimeEqual returns true for equal strings', () => {
		expect(constantTimeEqual('abc', 'abc')).toBe(true);
	});

	it('constantTimeEqual returns false for different strings', () => {
		expect(constantTimeEqual('abc', 'def')).toBe(false);
		expect(constantTimeEqual('abc', 'abcd')).toBe(false);
	});

	it('buildSecurePassword returns correct format', async () => {
		const result = await runEffect(
			buildSecurePassword({ generation: PASS_GEN1_0_PREFIX, salt: 'mysalt', hash: 'myhash' })
		);
		expect(result).toBe('gen1.0:mysalt:myhash');
	});

	it('breakSecurePassword parses valid hash', async () => {
		const hash = 'gen1.0:somesalt:somehash';
		const result = await runEffect(breakSecurePassword(hash));
		expect(result).toStrictEqual({
			generation: 'gen1.0',
			salt: 'somesalt',
			hash: 'somehash',
		});
	});

	it('breakSecurePassword throws on invalid format', async () => {
		const err = await runEffect(breakSecurePassword('badformat')).catch((e) => JSON.stringify(e));

		const parsedErr = JSON.parse(err as string);
		expect(parsedErr.cause.failure.cause.cause).toBe(
			'Invalid secure password format. Expected "gen1.0:salt:hash".'
		);
	});

	it('breakSecurePassword throws on legacy generation', async () => {
		const err = await runEffect(breakSecurePassword('legacy:salt:hash')).catch((e) =>
			JSON.stringify(e)
		);

		const parsedErr = JSON.parse(err as string);
		expect(parsedErr.cause.failure.cause.cause).toMatch(/Legacy password hashes are not supported/);
	});

	it('verifyPasswordLength returns undefined for valid length', async () => {
		const result = await runEffect(verifyPasswordLength('123456'));
		expect(result).toBeUndefined();
	});

	it('verifyPasswordLength returns error for short password', async () => {
		const result = await runEffect(verifyPasswordLength('123'));
		expect(result).toBe('Password must be between 6 and 255 characters long.');
	});

	it('verifyPasswordLength returns error for long password', async () => {
		const longPass = 'a'.repeat(256);
		const result = await runEffect(verifyPasswordLength(longPass));
		expect(result).toBe('Password must be between 6 and 255 characters long.');
	});

	it('verifySafe returns error for unsafe password', async () => {
		// This test assumes 'admin' is in the unsafe password list
		const result = await runEffect(verifySafe('admin'));
		expect(result).toBe(
			'Password must not be a commonly known unsafe password (admin, root, etc.)'
		);
	});

	it('verifySafe returns undefined for safe password', async () => {
		const result = await runEffect(verifySafe('uniquepassword123'));
		expect(result).toBeUndefined();
	});
});
