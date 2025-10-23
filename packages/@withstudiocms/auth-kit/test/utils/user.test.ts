import { runEffect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { UserPermissionLevel } from '../../src/types.js';
import {
	getDefaultUserSession,
	getLevel,
	parseRequiredPerms,
	verifyUsernameCharacters,
	verifyUsernameLength,
	verifyUsernameSafe,
} from '../../src/utils/user.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'User Utility Tests';

describe(parentSuiteName, () => {
	[
		{
			input: 'ab',
			expected: 'Username must be between 3 and 32 characters long',
		},
		{
			input: 'a'.repeat(33),
			expected: 'Username must be between 3 and 32 characters long',
		},
		{
			input: 'validuser',
			expected: undefined,
		},
	].forEach(({ input, expected }) => {
		test('User Utility - verifyUsernameLength', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('verifyUsernameLength Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected ?? 'undefined');

			await allure.step(`Should return "${expected}"`, async () => {
				const result = await runEffect(verifyUsernameLength(input));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'Invalid!User',
			expected:
				'Username can only contain lowercase letters, numbers, hyphens (-), and underscores (_)',
		},
		{
			input: 'valid_user-123',
			expected: undefined,
		},
	].forEach(({ input, expected }) => {
		test('User Utility - verifyUsernameCharacters', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('verifyUsernameCharacters Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected ?? 'undefined');

			await allure.step(`Should return "${expected}"`, async () => {
				const result = await runEffect(verifyUsernameCharacters(input));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'admin',
			expected: 'Username should not be a commonly used unsafe username (admin, root, etc.)',
		},
		{
			input: 'root',
			expected: 'Username should not be a commonly used unsafe username (admin, root, etc.)',
		},
		{
			input: 'uniquename123',
			expected: undefined,
		},
	].forEach(({ input, expected }) => {
		test('User Utility - verifyUsernameSafe', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('verifyUsernameSafe Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected ?? 'undefined');

			await allure.step(`Should return "${expected}"`, async () => {
				const result = await runEffect(verifyUsernameSafe(input));
				expect(result).toBe(expected);
			});
		});
	});

	test('User Utility - getDefaultUserSession', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getDefaultUserSession Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should return default user session', async () => {
			const result = await runEffect(getDefaultUserSession());
			expect(result).toEqual({
				isLoggedIn: false,
				user: null,
				permissionLevel: 'unknown',
			});
		});
	});

	[
		{
			input: null,
			expected: 'unknown',
		},
		{
			input: { isLoggedIn: true, user: null, permissionLevel: 'admin' as const },
			expected: 'admin',
		},
		{
			input: {
				isLoggedIn: true,
				user: null,
				permissionLevel: 'visitor' as const,
				permissionsData: { rank: 'editor' as const },
			},
			expected: 'editor',
		},
	].forEach(({ input, expected }) => {
		test('User Utility - getLevel', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getLevel Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', JSON.stringify(input));
			await allure.parameter('expected', expected ?? 'undefined');

			await allure.step(`Should return "${expected}"`, async () => {
				const result = await runEffect(getLevel(input));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{ input: 'owner' as const, expected: UserPermissionLevel.owner },
		{ input: 'admin' as const, expected: UserPermissionLevel.admin },
		{ input: 'editor' as const, expected: UserPermissionLevel.editor },
		{ input: 'visitor' as const, expected: UserPermissionLevel.visitor },
		{ input: 'unknown' as const, expected: UserPermissionLevel.unknown },
	].forEach(({ input, expected }) => {
		test('User Utility - parseRequiredPerms', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('parseRequiredPerms Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', JSON.stringify(expected));

			await allure.step(`Should return "${expected}"`, async () => {
				const result = await runEffect(parseRequiredPerms(input));
				expect(result).toBe(expected);
			});
		});
	});
});
