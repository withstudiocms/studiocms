import { describe, expect, it } from '@effect/vitest';
import { AppsConfigSchema, StudioCMSDevAppsSchema } from '../index.js';

describe('Schema Validation', () => {
	describe('AppsConfigSchema', () => {
		it('should handle boolean libSQLViewer', () => {
			const result = AppsConfigSchema.parse({
				libSQLViewer: true,
				wpImporter: false,
			});

			expect(result).toEqual({
				libSQLViewer: { enabled: true, endpoint: 'outerbase' },
				wpImporter: { enabled: false, endpoint: 'wp-api-importer' },
			});
		});

		it('should handle object libSQLViewer with custom endpoint', () => {
			const result = AppsConfigSchema.parse({
				libSQLViewer: { endpoint: 'custom-libsql' },
				wpImporter: { endpoint: 'custom-wp' },
			});

			expect(result).toEqual({
				libSQLViewer: { enabled: true, endpoint: 'custom-libsql' },
				wpImporter: { enabled: true, endpoint: 'custom-wp' },
			});
		});

		it('should handle boolean wpImporter', () => {
			const result = AppsConfigSchema.parse({
				libSQLViewer: false,
				wpImporter: true,
			});

			expect(result).toEqual({
				libSQLViewer: { enabled: false, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
			});
		});

		it('should handle object wpImporter with custom endpoint', () => {
			const result = AppsConfigSchema.parse({
				libSQLViewer: true,
				wpImporter: { endpoint: 'custom-wp-endpoint' },
			});

			expect(result).toEqual({
				libSQLViewer: { enabled: true, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'custom-wp-endpoint' },
			});
		});

		it('should use default values when undefined', () => {
			const result = AppsConfigSchema.parse(undefined);

			expect(result).toEqual({
				libSQLViewer: { enabled: true, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
			});
		});

		it('should use default endpoint when object has no endpoint', () => {
			const result = AppsConfigSchema.parse({
				libSQLViewer: {},
				wpImporter: {},
			});

			expect(result).toEqual({
				libSQLViewer: { enabled: true, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
			});
		});
	});

	describe('StudioCMSDevAppsSchema', () => {
		it('should handle empty object', () => {
			const result = StudioCMSDevAppsSchema.parse({});

			expect(result).toEqual({
				endpoint: '_studiocms-devapps',
				verbose: false,
				appsConfig: {
					libSQLViewer: { enabled: true, endpoint: 'outerbase' },
					wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
				},
			});
		});

		it('should handle undefined input', () => {
			const result = StudioCMSDevAppsSchema.parse(undefined);

			expect(result).toEqual({
				endpoint: '_studiocms-devapps',
				verbose: false,
				appsConfig: {
					libSQLViewer: { enabled: true, endpoint: 'outerbase' },
					wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
				},
			});
		});

		it('should handle custom endpoint', () => {
			const result = StudioCMSDevAppsSchema.parse({
				endpoint: '/custom-api',
			});

			expect(result.endpoint).toBe('/custom-api');
			expect(result.verbose).toBe(false);
		});

		it('should handle verbose flag', () => {
			const result = StudioCMSDevAppsSchema.parse({
				verbose: true,
			});

			expect(result.endpoint).toBe('_studiocms-devapps');
			expect(result.verbose).toBe(true);
		});

		it('should handle custom appsConfig', () => {
			const result = StudioCMSDevAppsSchema.parse({
				appsConfig: {
					libSQLViewer: false,
					wpImporter: { endpoint: 'custom-wp' },
				},
			});

			expect(result.appsConfig).toEqual({
				libSQLViewer: { enabled: false, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'custom-wp' },
			});
		});

		it('should handle complete configuration', () => {
			const result = StudioCMSDevAppsSchema.parse({
				endpoint: '/api/devapps',
				verbose: true,
				appsConfig: {
					libSQLViewer: { endpoint: 'custom-libsql' },
					wpImporter: true,
				},
			});

			expect(result).toEqual({
				endpoint: '/api/devapps',
				verbose: true,
				appsConfig: {
					libSQLViewer: { enabled: true, endpoint: 'custom-libsql' },
					wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
				},
			});
		});

		it('should reject invalid endpoint type', () => {
			expect(() => {
				StudioCMSDevAppsSchema.parse({
					endpoint: 123 as any,
				});
			}).toThrow();
		});

		it('should reject invalid verbose type', () => {
			expect(() => {
				StudioCMSDevAppsSchema.parse({
					verbose: 'true' as any,
				});
			}).toThrow();
		});

		it('should reject invalid appsConfig', () => {
			expect(() => {
				StudioCMSDevAppsSchema.parse({
					appsConfig: {
						libSQLViewer: 'invalid' as any,
					},
				});
			}).toThrow();
		});
	});
});
