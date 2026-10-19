import * as allure from 'allure-js-commons';
import { afterEach, describe, expect, test } from 'vitest';
import { detectPackageManager } from '../src/context';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Context Utility Tests';

describe(parentSuiteName, () => {
	const originalEnv = process.env.npm_config_user_agent;

	afterEach(() => {
		if (originalEnv) {
			process.env.npm_config_user_agent = originalEnv;
		} else {
			delete process.env.npm_config_user_agent;
		}
	});

	test('detectPackageManager - should return undefined when npm_config_user_agent is not set', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('detectPackageManager Tests');
		await allure.tags(...sharedTags);

		await allure.step('Deleting npm_config_user_agent environment variable', async (ctx) => {
			delete process.env.npm_config_user_agent;

			const result = detectPackageManager();

			await ctx.parameter('Result', String(result));

			expect(result).toBeUndefined();
		});
	});

	[
		{
			name: 'detectPackageManager - should detect npm',
			userAgent: 'npm/8.19.2 node/v18.12.0 darwin x64',
			expected: 'npm',
		},
		{
			name: 'detectPackageManager - should detect yarn',
			userAgent: 'yarn/1.22.19 npm/? node/v18.12.0 darwin x64',
			expected: 'yarn',
		},
		{
			name: 'detectPackageManager - should detect pnpm',
			userAgent: 'pnpm/8.6.0 npm/? node/v18.12.0 darwin x64',
			expected: 'pnpm',
		},
		{
			name: 'detectPackageManager - should detect bun',
			userAgent: 'bun/1.0.0 npm/? node/v18.12.0 darwin x64',
			expected: 'bun',
		},
		{
			name: 'detectPackageManager - should detect cnpm from npminstall',
			userAgent: 'npminstall/7.0.0 npm/? node/v18.12.0 darwin x64',
			expected: 'cnpm',
		},
		{
			name: 'detectPackageManager - should handle custom package manager',
			userAgent: 'custom-pm/1.0.0 npm/? node/v18.12.0 darwin x64',
			expected: 'custom-pm',
		},
		{
			name: 'detectPackageManager - should handle user agent with multiple spaces',
			userAgent: 'pnpm/8.6.0  npm/?  node/v18.12.0',
			expected: 'pnpm',
		},
	].forEach(({ name, userAgent, expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('detectPackageManager Tests');
			await allure.tags(...sharedTags);

			await allure.step('Setting npm_config_user_agent environment variable', async (ctx) => {
				process.env.npm_config_user_agent = userAgent;

				const result = detectPackageManager();

				await ctx.parameter('User Agent', userAgent);
				await ctx.parameter('Result', String(result));

				expect(result).toBe(expected);
			});
		});
	});
});
