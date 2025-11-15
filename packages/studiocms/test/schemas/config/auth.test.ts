import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	authConfigSchema,
	authProviderSchema,
	localUsernameAndPasswordConfig,
} from '../../../src/schemas/config/auth';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Config Schemas tests (Auth)';

describe(parentSuiteName, () => {
	[
		{
			data: {},
			expected: true,
		},
		{
			data: { allowUserRegistration: false },
			expected: false,
		},
		{
			data: { allowUserRegistration: true },
			expected: true,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `localUsernameAndPasswordConfig test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:localUsernameAndPasswordConfig'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('localUsernameAndPasswordConfig tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = localUsernameAndPasswordConfig.parse(data);
			expect(result.allowUserRegistration).toBe(expected);
		});
	});

	[
		{
			data: {},
			expected: {
				usernameAndPassword: true,
				usernameAndPasswordConfig: { allowUserRegistration: true },
			},
		},
		{
			data: { usernameAndPassword: false },
			expected: {
				usernameAndPassword: false,
				usernameAndPasswordConfig: { allowUserRegistration: true },
			},
		},
		{
			data: { usernameAndPassword: true },
			expected: {
				usernameAndPassword: true,
				usernameAndPasswordConfig: { allowUserRegistration: true },
			},
		},
		{
			data: undefined,
			expected: {
				usernameAndPassword: true,
				usernameAndPasswordConfig: { allowUserRegistration: true },
			},
		},
	].forEach(({ data, expected }, index) => {
		const testName = `authProviderSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:authProviderSchema'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('authProviderSchema tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = authProviderSchema.parse(data);
			expect(result).toEqual(expected);
		});
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

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('authConfigSchema tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = authConfigSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});
});
