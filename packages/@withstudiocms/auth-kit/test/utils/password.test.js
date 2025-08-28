import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { runEffect } from '@withstudiocms/effect';
import {
	breakSecurePassword,
	buildSecurePassword,
	constantTimeEqual,
	PASS_GEN1_0_PREFIX,
	verifyPasswordLength,
	verifySafe,
} from '../../dist/utils/password.js';

describe('Auth Kit - Password Utils', () => {
	test('constantTimeEqual returns true for equal strings', () => {
		assert.equal(constantTimeEqual('abc', 'abc'), true);
	});

	test('constantTimeEqual returns false for different strings', () => {
		assert.equal(constantTimeEqual('abc', 'def'), false);
		assert.equal(constantTimeEqual('abc', 'abcd'), false);
	});

	test('buildSecurePassword returns correct format', async () => {
		const result = await runEffect(
			buildSecurePassword({ generation: PASS_GEN1_0_PREFIX, salt: 'mysalt', hash: 'myhash' })
		);
		assert.equal(result, 'gen1.0:mysalt:myhash');
	});

	test('breakSecurePassword parses valid hash', async () => {
		const hash = 'gen1.0:somesalt:somehash';
		const result = await runEffect(breakSecurePassword(hash));
		assert.deepEqual(result, {
			generation: 'gen1.0',
			salt: 'somesalt',
			hash: 'somehash',
		});
	});

	test('breakSecurePassword throws on invalid format', async () => {
		const err = await runEffect(breakSecurePassword('badformat')).catch((e) => JSON.stringify(e));

		const parsedErr = JSON.parse(err);

		assert.equal(
			parsedErr.cause.failure.cause.cause,
			'Invalid secure password format. Expected "gen1.0:salt:hash".'
		);
	});

	test('breakSecurePassword throws on legacy generation', async () => {
		const err = await runEffect(breakSecurePassword('legacy:salt:hash')).catch((e) =>
			JSON.stringify(e)
		);

		const parsedErr = JSON.parse(err);
		assert.match(parsedErr.cause.failure.cause.cause, /Legacy password hashes are not supported/);
	});

	test('verifyPasswordLength returns undefined for valid length', async () => {
		const result = await runEffect(verifyPasswordLength('123456'));
		assert.equal(result, undefined);
	});

	test('verifyPasswordLength returns error for short password', async () => {
		const result = await runEffect(verifyPasswordLength('123'));
		assert.equal(result, 'Password must be between 6 and 255 characters long.');
	});

	test('verifyPasswordLength returns error for long password', async () => {
		const longPass = 'a'.repeat(256);
		const result = await runEffect(verifyPasswordLength(longPass));
		assert.equal(result, 'Password must be between 6 and 255 characters long.');
	});

	test('verifySafe returns error for unsafe password', async () => {
		// This test assumes 'admin' is in the unsafe password list
		const result = await runEffect(verifySafe('admin'));
		assert.equal(
			result,
			'Password must not be a commonly known unsafe password (admin, root, etc.)'
		);
	});

	test('verifySafe returns undefined for safe password', async () => {
		const result = await runEffect(verifySafe('uniquepassword123'));
		assert.equal(result, undefined);
	});
});
