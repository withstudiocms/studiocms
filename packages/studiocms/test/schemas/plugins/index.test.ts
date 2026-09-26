import * as allure from 'allure-js-commons';
import { Schema } from 'effect';
import { describe, expect } from 'vitest';
import {
	definePlugin,
	SafePluginListItemSchema,
	SafePluginListSchema,
	type StudioCMSImageService,
} from '../../../src/schemas/index';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Plugins Schemas tests';

// Mocks for shared schemas
const mockSettingsPage = { fields: [], endpoint: '/settings' };
const mockFrontendNavigationLinks = [{ label: 'Home', href: '/' }];
const mockPageTypes = [{ type: 'blog', label: 'Blog', identifier: 'mock/block' }];

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
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

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'SafePluginListItemSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = Schema.decodeUnknownEither(SafePluginListItemSchema)(data);
			if (expected) {
				expect(result._tag).toBe('Right');
			} else {
				expect(result._tag).toBe('Left');
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

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'SafePluginListSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = Schema.decodeUnknownEither(SafePluginListSchema)(data);
			if (expected) {
				expect(result._tag).toBe('Right');
			} else {
				expect(result._tag).toBe('Left');
			}
		});
	});

	test('definePlugin returns correct plugin object', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'definePlugin returns correct plugin object',
			tags: [...sharedTags, 'schema:plugins', 'function:definePlugin'],
		});

		await step('Defining a sample plugin', async () => {
			const plugin = definePlugin({
				identifier: '@studiocms/sample-plugin',
				name: 'Sample Plugin',
				hooks: {},
			});
			expect(plugin).toHaveProperty('identifier', '@studiocms/sample-plugin');
			expect(plugin).toHaveProperty('name', 'Sample Plugin');
			expect(plugin).toHaveProperty('hooks', {});
		});
	});

	test('StudioCMSImageService accepts valid props and returns a string', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'StudioCMSImageService accepts valid props and returns a string',
			tags: [...sharedTags, 'schema:plugins', 'type:StudioCMSImageService'],
		});

		await step('Testing StudioCMSImageService function', async () => {
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
