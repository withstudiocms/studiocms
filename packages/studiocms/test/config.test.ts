import { describe, expect, expectTypeOf } from 'vitest';
import { defineStudioCMSConfig } from '../src/config';
import type { StudioCMSOptions } from '../src/schemas';
import { allureTester } from './fixtures/allureTester';
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
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

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
		test('defineStudioCMSConfig should return the config object unchanged', async ({
			setupAllure,
			step,
		}) => {
			await setupAllure({
				subSuiteName: 'defineStudioCMSConfig tests',
				tags: [...sharedTags, 'function:defineStudioCMSConfig'],
			});

			await step('Defining StudioCMS config', async (ctx) => {
				const result = defineStudioCMSConfig(input);
				await ctx.parameter('inputConfig', JSON.stringify(input));
				await ctx.parameter('expectedConfig', JSON.stringify(expected));
				await ctx.parameter('actualConfig', JSON.stringify(result));
				expect(result).toEqual(expected);
			});
		});
	});

	test('defineStudioCMSConfig should infer the correct type', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'defineStudioCMSConfig tests',
			tags: [...sharedTags, 'function:defineStudioCMSConfig', 'type-inference'],
		});

		await step('Checking type inference of defineStudioCMSConfig', async (ctx) => {
			const config = defineStudioCMSConfig(fullConfig);
			await ctx.parameter('configType', typeof config);
			expectTypeOf(config).toEqualTypeOf<StudioCMSOptions>();
		});
	});
});
