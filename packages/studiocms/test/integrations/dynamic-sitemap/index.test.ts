import * as allure from 'allure-js-commons';
import type { AstroIntegration } from 'astro';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { dynamicSitemap, safeString } from '../../../src/integrations/dynamic-sitemap/index';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Dynamic Sitemap Integration and Utils';

describe(parentSuiteName, () => {
	[
		{
			input: '_test_',
			expected: 'test',
		},
		{
			input: '__test__',
			expected: 'test',
		},
		{
			input: 'studiocms_plugin',
			expected: 'plugin',
		},
		{
			input: '_studiocms_plugin_',
			expected: 'plugin',
		},
		{
			input: 'plugin',
			expected: 'plugin',
		},
		{
			input: '',
			expected: '',
		},
	].forEach(({ input, expected }, index) => {
		const testName = `safeString test case #${index + 1}`;
		const tags = [
			...sharedTags,
			'integration:dynamicSitemap',
			'dynamicSitemap:utils',
			'dynamicSitemap:safeString',
		];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('safeString tests');
			await allure.tags(...tags);

			await allure.parameter('input', input);

			const result = safeString(input);
			expect(result).toBe(expected);
		});
	});

	test('dynamicSitemap returns an AstroIntegration object', async () => {
		const tags = [...sharedTags, 'integration:dynamicSitemap', 'dynamicSitemap:integrationObject'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('dynamicSitemap integration object test');
		await allure.tags(...tags);

		const integration = dynamicSitemap({ sitemaps: [] });
		expect(integration).toBeDefined();
		expect(integration.name).toBe('studiocms/dynamic-sitemap');
		expect(typeof integration.hooks['astro:config:setup']).toBe('function');
		expectTypeOf(integration).toEqualTypeOf<AstroIntegration>();
	});
});
