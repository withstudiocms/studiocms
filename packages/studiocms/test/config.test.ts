import * as allure from 'allure-js-commons';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { defineStudioCMSConfig } from '../src/config';
import type { StudioCMSOptions } from '../src/schemas';
import { parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'config.ts tests';

// Mock minimal StudioCMSOptions for testing
const minimalConfig: StudioCMSOptions = {
	dbStartPage: true,
};

const fullConfig: StudioCMSOptions = {
	dbStartPage: false,
	plugins: [],
	verbose: true,
	locale: {
		dateLocale: 'en-us',
	},
	features: {
		injectQuickActionsMenu: true,
	},
};

describe(parentSuiteName, () => {
	[
		{
			input: minimalConfig,
			expected: minimalConfig,
		},
		{
			input: fullConfig,
			expected: fullConfig,
		},
	].forEach(({ input, expected }) => {
		test('defineStudioCMSConfig should return the config object unchanged', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('defineStudioCMSConfig tests');
			await allure.tags(...sharedTags, 'function:defineStudioCMSConfig');

			await allure.step('Defining StudioCMS config', async (ctx) => {
				const result = defineStudioCMSConfig(input);
				await ctx.parameter('inputConfig', JSON.stringify(input));
				await ctx.parameter('expectedConfig', JSON.stringify(expected));
				await ctx.parameter('actualConfig', JSON.stringify(result));
				expect(result).toEqual(expected);
			});
		});
	});

	test('defineStudioCMSConfig should infer the correct type', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineStudioCMSConfig tests');
		await allure.tags(...sharedTags, 'function:defineStudioCMSConfig', 'type-inference');

		await allure.step('Checking type inference of defineStudioCMSConfig', async (ctx) => {
			const config = defineStudioCMSConfig(fullConfig);
			await ctx.parameter('configType', typeof config);
			expectTypeOf(config).toEqualTypeOf<StudioCMSOptions>();
		});
	});
});
