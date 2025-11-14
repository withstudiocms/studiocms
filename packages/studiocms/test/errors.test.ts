import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { StudioCMSCoreError, StudioCMSError } from '../src/errors';
import { parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'StudioCMS Error tests';

describe(parentSuiteName, () => {
	[
		{
			message: 'Test message',
			hint: undefined,
			expected: {
				name: 'StudioCMS Error',
				message: 'Test message',
				hint: undefined,
			},
		},
		{
			message: 'Custom error',
			hint: 'This is a hint',
			expected: {
				name: 'StudioCMS Error',
				message: 'Custom error',
				hint: 'This is a hint',
			},
		},
	].forEach(({ message, hint, expected }) => {
		test('StudioCMSError should create an error with the correct properties', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('StudioCMSError tests');
			await allure.tags(...sharedTags, 'class:StudioCMSError', 'constructor');

			await allure.step(
				`Creating StudioCMSError with message="${message}" and hint="${hint}"`,
				async (ctx) => {
					const error = new StudioCMSError(message, hint);
					await ctx.parameter('errorName', error.name);
					await ctx.parameter('errorMessage', error.message);
					await ctx.parameter('errorHint', String(error.hint));
					expect(error.name).toBe(expected.name);
					expect(error.message).toBe(expected.message);
					expect(error.hint).toBe(expected.hint);
				}
			);
		});
	});

	[
		{
			message: 'Core error',
			hint: undefined,
			expected: {
				name: 'StudioCMS Core Error',
				message: 'Core error',
				hint: undefined,
			},
		},
		{
			message: 'Another core error',
			hint: 'extra hint',
			expected: {
				name: 'StudioCMS Core Error',
				message: 'Another core error',
				hint: 'extra hint',
			},
		},
	].forEach(({ message, hint, expected }) => {
		test('StudioCMSCoreError should create an error with the correct properties', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('StudioCMSCoreError tests');
			await allure.tags(...sharedTags, 'class:StudioCMSCoreError', 'constructor');

			await allure.step(
				`Creating StudioCMSCoreError with message="${message}" and hint="${hint}"`,
				async (ctx) => {
					const error = new StudioCMSCoreError(message, hint);
					await ctx.parameter('errorName', error.name);
					await ctx.parameter('errorMessage', error.message);
					await ctx.parameter('errorHint', String(error.hint));
					expect(error.name).toBe(expected.name);
					expect(error.message).toBe(expected.message);
					expect(error.hint).toBe(expected.hint);
				}
			);
		});
	});
});
