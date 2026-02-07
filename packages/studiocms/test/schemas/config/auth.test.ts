import { describe, expect } from 'vitest';
import { authConfigSchema } from '../../../src/schemas/config/auth';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Config Schemas tests (Auth)';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			data: {},
			expected: {
				enabled: true,
				providers: {
					usernameAndPassword: true,
					usernameAndPasswordConfig: { allowUserRegistration: true },
				},
			},
		},
		{
			data: undefined,
			expected: {
				enabled: true,
				providers: {
					usernameAndPassword: true,
					usernameAndPasswordConfig: { allowUserRegistration: true },
				},
			},
		},
		{
			data: { enabled: false },
			expected: {
				enabled: false,
				providers: {
					usernameAndPassword: true,
					usernameAndPasswordConfig: { allowUserRegistration: true },
				},
			},
		},
		{
			data: {
				enabled: false,
				providers: {
					usernameAndPassword: false,
					usernameAndPasswordConfig: { allowUserRegistration: false },
				},
			},
			expected: {
				enabled: false,
				providers: {
					usernameAndPassword: false,
					usernameAndPasswordConfig: { allowUserRegistration: false },
				},
			},
		},
	].forEach(({ data, expected }, index) => {
		const testName = `authConfigSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:authConfigSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'authConfigSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = authConfigSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});
});
