import { describe, expect } from 'vitest';
import { StudioCMSCoreError, StudioCMSError } from '../src/errors';
import { allureTester } from './fixtures/allureTester';
import { parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'StudioCMS Error tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

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
		test('StudioCMSError should create an error with the correct properties', async ({
			setupAllure,
			step,
		}) => {
			await setupAllure({
				subSuiteName: 'StudioCMSError tests',
				tags: [...sharedTags, 'class:StudioCMSError', 'constructor'],
			});

			await step(
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
		test('StudioCMSCoreError should create an error with the correct properties', async ({
			setupAllure,
			step,
		}) => {
			await setupAllure({
				subSuiteName: 'StudioCMSCoreError tests',
				tags: [...sharedTags, 'class:StudioCMSCoreError', 'constructor'],
			});

			await step(
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
