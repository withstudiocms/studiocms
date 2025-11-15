import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	definePlugin,
	SafePluginListItemSchema,
	SafePluginListSchema,
	type StudioCMSImageService,
	StudioCMSSanitizeOptionsSchema,
} from '../../../src/schemas/plugins/index';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Plugins Schemas tests';

// Mocks for shared schemas
const mockSettingsPage = { fields: [], endpoint: '/settings' };
const mockFrontendNavigationLinks = [{ label: 'Home', href: '/' }];
const mockPageTypes = [{ type: 'blog', label: 'Blog', identifier: 'mock/block' }];

describe(parentSuiteName, () => {
	[
		{
			data: {
				allowElements: ['div', 'span'],
				blockElements: ['script'],
				dropElements: ['iframe'],
				allowAttributes: { class: ['div', 'span'] },
				dropAttributes: { style: ['div'] },
				allowComponents: true,
				allowCustomElements: false,
				allowComments: true,
			},
			expected: true,
		},
		{
			data: undefined,
			expected: true,
		},
		{
			data: { allowElements: 'not-an-array' },
			expected: false,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `StudioCMSSanitizeOptionsSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:plugins', 'schema:StudioCMSSanitizeOptionsSchema'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('StudioCMSSanitizeOptionsSchema tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = StudioCMSSanitizeOptionsSchema.safeParse(data);
			if (expected) {
				expect(result.success).toBe(true);
			} else {
				expect(result.success).toBe(false);
			}
		});
	});

	[
		{
			data: {
				identifier: '@studiocms/test-plugin',
				name: 'Test Plugin',
				settingsPage: mockSettingsPage,
				frontendNavigationLinks: mockFrontendNavigationLinks,
				pageTypes: mockPageTypes,
			},
			expected: true,
		},
		{
			data: { name: 'Missing Identifier' },
			expected: false,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `SafePluginListItemSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:plugins', 'schema:SafePluginListItemSchema'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('SafePluginListItemSchema tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = SafePluginListItemSchema.safeParse(data);
			if (expected) {
				expect(result.success).toBe(true);
			} else {
				expect(result.success).toBe(false);
			}
		});
	});

	[
		{
			data: [
				{
					identifier: '@studiocms/test-plugin',
					name: 'Test Plugin',
				},
				{
					identifier: '@studiocms/another-plugin',
					name: 'Another Plugin',
				},
			],
			expected: true,
		},
		{
			data: [
				{
					name: 'Missing Identifier',
				},
			],
			expected: false,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `SafePluginListSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:plugins', 'schema:SafePluginListSchema'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('SafePluginListSchema tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = SafePluginListSchema.safeParse(data);
			if (expected) {
				expect(result.success).toBe(true);
			} else {
				expect(result.success).toBe(false);
			}
		});
	});

	test('definePlugin returns correct plugin object', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('definePlugin returns correct plugin object');
		await allure.tags(...sharedTags, 'schema:plugins', 'function:definePlugin');

		await allure.step('Defining a sample plugin', async () => {
			const plugin = definePlugin({
				identifier: '@studiocms/sample-plugin',
				name: 'Sample Plugin',
				studiocmsMinimumVersion: '1.0.0',
				hooks: {},
			});
			expect(plugin).toHaveProperty('identifier', '@studiocms/sample-plugin');
			expect(plugin).toHaveProperty('name', 'Sample Plugin');
			expect(plugin).toHaveProperty('studiocmsMinimumVersion', '1.0.0');
			expect(plugin).toHaveProperty('hooks', {});
		});
	});

	test('StudioCMSImageService accepts valid props and returns a string', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('StudioCMSImageService accepts valid props and returns a string');
		await allure.tags(...sharedTags, 'schema:plugins', 'type:StudioCMSImageService');

		await allure.step('Testing StudioCMSImageService function', async () => {
			const service: StudioCMSImageService = (src, props) => {
				return `${src}?w=${props.width}&h=${props.height}&alt=${props.alt}`;
			};
			const result = await service('image.jpg', {
				alt: 'desc',
				width: 100,
				height: 200,
			});
			expect(typeof result).toBe('string');
			expect(result).toContain('image.jpg');
		});
	});
});
