import * as allure from 'allure-js-commons';
import { afterEach, describe, expect, test, vi } from 'vitest';
import cloudinaryImageService from '../src/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

vi.mock('../src/utils/readJson.js', () => ({
	readJson: vi.fn().mockReturnValue({
		name: '@studiocms/cloudinary-image-service',
	}),
}));

vi.mock('studiocms/plugins', () => ({
	definePlugin: vi.fn().mockImplementation((pluginConfig) => pluginConfig),
}));

vi.mock('astro/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('astro/config')>();
	return {
		...actual,
		envField: {
			string: vi.fn().mockReturnValue({
				context: 'server',
				access: 'secret',
				optional: false,
				type: 'string',
			}),
		},
	};
});

import { definePlugin } from 'studiocms/plugins';

const localSuiteName = 'Cloudinary Image Service Plugin Tests';

describe(parentSuiteName, () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('cloudinaryImageService - should create plugin with correct configuration', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create plugin with correct metadata and structure', async (ctx) => {
			const plugin = cloudinaryImageService();

			await ctx.parameter('plugin', JSON.stringify(plugin, null, 2));

			expect(plugin.name).toBe('Cloudinary JS Image Service (cloudinary-js)');
			expect(plugin.identifier).toBe('@studiocms/cloudinary-image-service');
			expect(plugin.hooks).toBeDefined();
		});
	});

	test('cloudinaryImageService - should call definePlugin with correct configuration', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Define Plugin Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should call definePlugin with correct configuration', async () => {
			cloudinaryImageService();

			expect(definePlugin).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Cloudinary JS Image Service (cloudinary-js)',
					identifier: '@studiocms/cloudinary-image-service',
					hooks: expect.any(Object),
				})
			);
		});
	});
});
