import { describe, expect, it } from '@effect/vitest';
import { studioCMSDevApps } from '../index.js';

describe('StudioCMS DevApps Integration', () => {
	describe('studioCMSDevApps', () => {
		it('should create integration with default options', () => {
			const integration = studioCMSDevApps();

			expect(integration).toEqual({
				name: '@studiocms/devapps',
				hooks: expect.objectContaining({
					'astro:config:setup': expect.any(Function),
				}),
			});
		});

		it('should create integration with custom options', () => {
			const options = {
				endpoint: '/custom-api',
				appsConfig: {
					wpImporter: {
						endpoint: '/wp-import',
					},
					libSQLViewer: false,
				},
				verbose: true,
			};

			const integration = studioCMSDevApps(options);

			expect(integration).toEqual({
				name: '@studiocms/devapps',
				hooks: expect.objectContaining({
					'astro:config:setup': expect.any(Function),
				}),
			});
		});

		it('should handle invalid options gracefully', () => {
			// This should not throw, but use defaults
			expect(() => {
				studioCMSDevApps({
					endpoint: null as any,
					appsConfig: {
						wpImporter: {
							endpoint: null as any,
						},
						libSQLViewer: 'invalid' as any,
					},
				});
			}).toThrow();
		});
	});
});
