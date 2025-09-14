import type { AstroConfig, AstroIntegration, AstroIntegrationLogger } from 'astro';
import { envField } from 'astro/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import cloudinaryImageService from '../src/index.js';

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

describe('Cloudinary Image Service Plugin', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('cloudinaryImageService', () => {
		it('should create plugin with correct configuration', () => {
			const plugin = cloudinaryImageService();

			expect(plugin.name).toBe('Cloudinary JS Image Service (cloudinary-js)');
			expect(plugin.identifier).toBe('@studiocms/cloudinary-image-service');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.19');
			expect(plugin.hooks).toBeDefined();
		});

		it('should use resolved paths in plugin configuration', () => {
			const plugin = cloudinaryImageService();

			// Verify that the plugin uses the resolved service path
			const hook = plugin.hooks['studiocms:config:setup'];
			expect(hook).toBeDefined();

			const mockSetImageService = vi.fn();
			const mockLogger: AstroIntegrationLogger = {
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

			if (hook) {
				hook({
					logger: mockLogger,
					setSitemap: vi.fn().mockImplementation((_args: unknown) => {}),
					setDashboard: vi.fn().mockImplementation((_args: unknown) => {}),
					setFrontend: vi.fn().mockImplementation((_args: unknown) => {}),
					setRendering: vi.fn().mockImplementation((_args: unknown) => {}),
					setImageService: mockSetImageService,
					setAuthService: vi.fn().mockImplementation((_args: unknown) => {}),
				});
			}

			expect(mockSetImageService).toHaveBeenCalledWith({
				imageService: {
					identifier: 'cloudinary-js',
					servicePath: '/mocked/cloudinary-js-service.js',
				},
			});
		});

		it('should call definePlugin with correct configuration', () => {
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

		it('should have correct identifier constant', () => {
			const plugin = cloudinaryImageService();
			expect(plugin.identifier).toBe('@studiocms/cloudinary-image-service');
		});

		it('should have correct identifier and service path', () => {
			const plugin = cloudinaryImageService();

			// Verify that the plugin has the correct identifier
			expect(plugin.identifier).toBe('@studiocms/cloudinary-image-service');

			// Verify that the service path is resolved correctly
			const hook = plugin.hooks['studiocms:config:setup'];
			expect(hook).toBeDefined();

			const mockSetImageService = vi.fn();
			const mockLogger: AstroIntegrationLogger = {
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

			if (hook) {
				hook({
					logger: mockLogger,
					setSitemap: vi.fn().mockImplementation((_args: unknown) => {}),
					setDashboard: vi.fn().mockImplementation((_args: unknown) => {}),
					setFrontend: vi.fn().mockImplementation((_args: unknown) => {}),
					setRendering: vi.fn().mockImplementation((_args: unknown) => {}),
					setImageService: mockSetImageService,
					setAuthService: vi.fn().mockImplementation((_args: unknown) => {}),
				});
			}

			expect(mockSetImageService).toHaveBeenCalledWith({
				imageService: {
					identifier: 'cloudinary-js',
					servicePath: '/mocked/cloudinary-js-service.js',
				},
			});
		});
	});

	describe('plugin hooks', () => {
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

		describe('studiocms:astro:config hook', () => {
			it('should add CloudinaryENVIntegration', () => {
				const hook = plugin.hooks['studiocms:astro:config'];
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
			});
		});

		describe('studiocms:config:setup hook', () => {
			it('should log initialization message', () => {
				const hook = plugin.hooks['studiocms:config:setup'];
				expect(hook).toBeDefined();

				if (hook) {
					hook({
						logger: mockLogger,
						setSitemap: vi.fn().mockImplementation((_args: unknown) => {}),
						setDashboard: vi.fn().mockImplementation((_args: unknown) => {}),
						setFrontend: vi.fn().mockImplementation((_args: unknown) => {}),
						setRendering: vi.fn().mockImplementation((_args: unknown) => {}),
						setImageService: mockSetImageService,
						setAuthService: vi.fn().mockImplementation((_args: unknown) => {}),
					});
				}

				expect(mockLogger.info).toHaveBeenCalledWith('Initializing Cloudinary Image Service');
			});

			it('should set image service configuration', () => {
				const hook = plugin.hooks['studiocms:config:setup'];
				expect(hook).toBeDefined();

				if (hook) {
					hook({
						logger: mockLogger,
						setSitemap: vi.fn().mockImplementation((_args: unknown) => {}),
						setDashboard: vi.fn().mockImplementation((_args: unknown) => {}),
						setFrontend: vi.fn().mockImplementation((_args: unknown) => {}),
						setRendering: vi.fn().mockImplementation((_args: unknown) => {}),
						setImageService: mockSetImageService,
						setAuthService: vi.fn().mockImplementation((_args: unknown) => {}),
					});
				}

				expect(mockSetImageService).toHaveBeenCalledWith({
					imageService: {
						identifier: 'cloudinary-js',
						servicePath: '/mocked/cloudinary-js-service.js',
					},
				});
			});
		});

		describe('CloudinaryENVIntegration', () => {
			it('should configure Astro ENV with correct schema', () => {
				const plugin = cloudinaryImageService();
				const astroConfigHook = plugin.hooks['studiocms:astro:config'];
				expect(astroConfigHook).toBeDefined();

				if (astroConfigHook) {
					astroConfigHook({
						logger: mockLogger,
						addIntegrations: mockAddIntegrations,
					});
				}

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

	describe('integration name', () => {
		it('should use package name in integration name', () => {
			const plugin = cloudinaryImageService();
			const astroConfigHook = plugin.hooks['studiocms:astro:config'];
			expect(astroConfigHook).toBeDefined();

			const mockAddIntegrations = vi.fn();
			const mockLogger: AstroIntegrationLogger = {
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

			if (astroConfigHook) {
				astroConfigHook({
					logger: mockLogger,
					addIntegrations: mockAddIntegrations,
				});
			}

			const integration = mockAddIntegrations.mock.calls[0][0] as AstroIntegration;
			expect(integration.name).toBe('@studiocms/cloudinary-image-service/astro-integration');
		});
	});

	describe('error handling', () => {
		it('should handle missing environment variables gracefully', () => {
			// Test that the plugin can be created even if environment variables are missing
			const plugin = cloudinaryImageService();
			expect(plugin).toBeDefined();
			expect(plugin.name).toBe('Cloudinary JS Image Service (cloudinary-js)');
		});
	});
});
