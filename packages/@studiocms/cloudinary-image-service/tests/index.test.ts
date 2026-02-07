import * as allure from 'allure-js-commons';
import type { AstroConfig, AstroIntegration, AstroIntegrationLogger } from 'astro';
import { envField } from 'astro/config';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import cloudinaryImageService from '../src/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

// Mock LogWritable for testing
const mockLogWritable = {
	write: vi.fn().mockReturnValue(true),
};

// Mock the dependencies
vi.mock('astro-integration-kit', () => ({
	createResolver: vi.fn().mockReturnValue({
		resolve: vi.fn().mockImplementation((path: string) => {
			if (path.includes('package.json')) {
				return '/mocked/package.json';
			}
			if (path.includes('cloudinary-js-service.js')) {
				return '/mocked/cloudinary-js-service.js';
			}
			return path;
		}),
	}),
}));

vi.mock('../src/utils/readJson.js', () => ({
	readJson: vi.fn().mockReturnValue({
		name: '@studiocms/cloudinary-image-service',
		version: '0.1.0-beta.26',
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
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.19');
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
					studiocmsMinimumVersion: '0.1.0-beta.19',
					hooks: expect.any(Object),
				})
			);
		});
	});
});

describe(parentSuiteName, () => {
	let plugin: ReturnType<typeof cloudinaryImageService>;
	let mockAddIntegrations: ReturnType<typeof vi.fn>;
	let mockLogger: AstroIntegrationLogger;
	let mockSetImageService: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		plugin = cloudinaryImageService();
		mockAddIntegrations = vi.fn();
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
			options: {
				dest: mockLogWritable,
				level: 'info',
			},
			label: '',
			fork: vi.fn(),
		};
		mockSetImageService = vi.fn();
	});

	test('should have studiocms:config:setup hook defined', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Config Setup Hook Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have studiocms:config:setup hook defined', async (ctx) => {
			await ctx.parameter('pluginHooks', JSON.stringify(plugin.hooks, null, 2));

			const hook = plugin.hooks['studiocms:image-service'];
			expect(hook).toBeDefined();

			await ctx.parameter('studiocms:config:setup Hook', String(!!hook));

			if (hook) {
				hook({
					logger: mockLogger,
					setImageService: mockSetImageService,
				});
			}

			expect(mockLogger.info).toHaveBeenCalledWith('Initializing Cloudinary Image Service');

			expect(mockSetImageService).toHaveBeenCalledWith({
				imageService: {
					identifier: 'cloudinary-js',
					servicePath: '/mocked/cloudinary-js-service.js',
				},
			});
		});
	});

	test('should add CloudinaryENVIntegration', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Astro Integration Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should add CloudinaryENVIntegration', async (ctx) => {
			await ctx.parameter('pluginHooks', JSON.stringify(plugin.hooks, null, 2));

			const hook = plugin.hooks['studiocms:astro-config'];
			expect(hook).toBeDefined();

			if (hook) {
				hook({
					logger: mockLogger,
					addIntegrations: mockAddIntegrations,
				});
			}

			expect(mockAddIntegrations).toHaveBeenCalledWith(
				expect.objectContaining({
					name: '@studiocms/cloudinary-image-service/astro-integration',
					hooks: expect.objectContaining({
						'astro:config:setup': expect.any(Function),
					}),
				})
			);

			// Get the integration that was added
			const integration = mockAddIntegrations.mock.calls[0][0] as AstroIntegration;
			const configSetupHook = integration.hooks['astro:config:setup'];

			const mockUpdateConfig = vi.fn();
			const mockConfigLogger: AstroIntegrationLogger = {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
				options: {
					dest: mockLogWritable,
					level: 'info',
				},
				label: '',
				fork: vi.fn(),
			};

			if (configSetupHook) {
				configSetupHook({
					config: {} as AstroConfig,
					command: 'dev' as const,
					isRestart: false,
					updateConfig: mockUpdateConfig,
					addRenderer: vi.fn(),
					addWatchFile: vi.fn(),
					injectScript: vi.fn(),
					injectRoute: vi.fn(),
					addClientDirective: vi.fn(),
					addDevToolbarApp: vi.fn(),
					addMiddleware: vi.fn(),
					createCodegenDir: vi.fn(),
					logger: mockConfigLogger,
				});
			}

			expect(mockConfigLogger.info).toHaveBeenCalledWith('Configuring Astro ENV');
			expect(mockUpdateConfig).toHaveBeenCalledWith({
				env: {
					schema: {
						CMS_CLOUDINARY_CLOUDNAME: {
							context: 'server',
							access: 'secret',
							optional: false,
							type: 'string',
						},
					},
				},
			});
			expect(envField.string).toHaveBeenCalledWith({
				context: 'server',
				access: 'secret',
				optional: false,
			});
		});
	});
});
