import { runEffect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	breakSecurePassword,
	buildSecurePassword,
	constantTimeEqual,
	PASS_GEN1_0_PREFIX,
	verifyPasswordLength,
	verifySafe,
} from '../../src/utils/password.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Password Utility Tests';

describe(parentSuiteName, () => {
	[
		{
			a: 'abc',
			b: 'abc',
			expected: true,
		},
		{
			a: 'abc',
			b: 'def',
			expected: false,
		},
		{
			a: 'abc',
			b: 'abcd',
			expected: false,
		},
	].forEach(({ a, b, expected }) => {
		test(`Password Utility - constantTimeEqual - should return ${expected} for inputs "${a}" and "${b}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('constantTimeEqual Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input a', a);
			await allure.parameter('input b', b);
			await allure.parameter('expected', String(expected));

			await allure.step(`Should return ${expected}`, async () => {
				const result = constantTimeEqual(a, b);
				expect(result).toBe(expected);
			});
		});
	});

	test('Password Utility - buildSecurePassword returns correct format', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildSecurePassword Tests');
		await allure.tags(...sharedTags);

		const generation = PASS_GEN1_0_PREFIX;
		const salt = 'mysalt';
		const hash = 'myhash';

		await allure.parameter('generation', generation);
		await allure.parameter('salt', salt);
		await allure.parameter('hash', hash);

		await allure.step('Should return correct format', async () => {
			const result = await runEffect(buildSecurePassword({ generation, salt, hash }));
			expect(result).toBe('gen1.0:mysalt:myhash');
		});
	});

	test('Password Utility - breakSecurePassword parses correct format', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('breakSecurePassword Tests');
		await allure.tags(...sharedTags);

		const hash = 'gen1.0:mysalt:myhash';

		await allure.parameter('input hash', hash);

		await allure.step('Should parse correct components', async () => {
			const result = await runEffect(breakSecurePassword(hash));
			expect(result).toEqual({
				generation: 'gen1.0',
				salt: 'mysalt',
				hash: 'myhash',
			});
		});
	});

	[
		{
			input: 'badformat',
			errorToBe: 'Invalid secure password format. Expected "gen1.0:salt:hash".',
		},
		{
			input: 'legacy:salt:hash',
			errorToMatch: 'Legacy password hashes are not supported. Please reset any legacy passwords.',
		},
	].forEach(({ input, errorToBe, errorToMatch }) => {
		test(`Password Utility - breakSecurePassword throws error for input "${input}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('breakSecurePassword Error Handling Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);

			await allure.step('Should throw appropriate error', async () => {
				const err = await runEffect(breakSecurePassword(input)).catch((e) => JSON.stringify(e));
				const parsedErr = JSON.parse(err as string);
				if (errorToBe) {
					expect(parsedErr.cause.failure.cause.cause).toBe(errorToBe);
				} else if (errorToMatch) {
					expect(parsedErr.cause.failure.cause.cause).toMatch(errorToMatch);
				}
			});
		});
	});

	[
		{
			input: '123456',
			expected: undefined,
		},
		{
			input: '123',
			expected: 'Password must be between 6 and 255 characters long.',
		},
		{
			input: 'a'.repeat(256),
			expected: 'Password must be between 6 and 255 characters long.',
		},
	].forEach(({ input, expected }) => {
		test(`Password Utility - verifyPasswordLength - should return "${expected}" for input "${input}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('verifyPasswordLength Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected ?? 'undefined');

			await allure.step(`Should return "${expected}"`, async () => {
				const result = await runEffect(verifyPasswordLength(input));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'admin',
			expected: 'Password must not be a commonly known unsafe password (admin, root, etc.)',
		},
		{
			input: 'uniquepassword123',
			expected: undefined,
		},
	].forEach(({ input, expected }) => {
		test(`Password Utility - verifySafe - should return "${expected}" for input "${input}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('verifySafe Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected ?? 'undefined');

			await allure.step(`Should return "${expected}"`, async () => {
				const result = await runEffect(verifySafe(input));
				expect(result).toBe(expected);
			});
		});
	});
});
