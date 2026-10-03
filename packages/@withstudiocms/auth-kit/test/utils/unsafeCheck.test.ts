import { Effect, runEffect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { CheckIfUnsafe } from '../../src/utils/unsafeCheck.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'CheckIfUnsafe Tests';

describe(parentSuiteName, async () => {
	const service = await runEffect(CheckIfUnsafe.pipe(Effect.provide(CheckIfUnsafe.Default)));

	[
		{
			input: 'admin',
			expected: true,
		},
		{
			input: 'not_reserved_user',
			expected: false,
		},
	].forEach(({ input, expected }) => {
		test(`CheckIfUnsafe.username - should return ${expected} for username "${input}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('CheckIfUnsafe.username Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', String(expected));

			await allure.step(`Should return ${expected}`, async () => {
				const result = await runEffect(service.username(input));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'password',
			expected: true,
		},
		{
			input: 'uniquepassword123',
			expected: false,
		},
	].forEach(({ input, expected }) => {
		test(`CheckIfUnsafe.password - should return ${expected} for password "${input}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('CheckIfUnsafe.password Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', String(expected));

			await allure.step(`Should return ${expected}`, async () => {
				const result = await runEffect(service.password(input));
				expect(result).toBe(expected);
			});
		});
	});
});
