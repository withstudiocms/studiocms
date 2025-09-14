import { describe, expect, it } from '@effect/vitest';
import { AppsConfigSchema, StudioCMSDevAppsSchema } from '../../src/schema/index';

describe('schema', () => {
	describe('AppsConfigSchema', () => {
		it('should transform boolean config to object format', () => {
			const inputConfig = {
				libSQLViewer: true,
				wpImporter: { endpoint: 'https://example.com/wp-json/wp/v2' },
			};

			const result = AppsConfigSchema.parse(inputConfig);

			expect(result).toEqual({
				libSQLViewer: { enabled: true, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'https://example.com/wp-json/wp/v2' },
			});
		});

		it('should transform boolean values to object format', () => {
			const inputConfig = {
				libSQLViewer: false,
				wpImporter: true,
			};

			const result = AppsConfigSchema.parse(inputConfig);

			expect(result).toEqual({
				libSQLViewer: { enabled: false, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
			});
		});

		it('should transform object config to object format', () => {
			const inputConfig = {
				libSQLViewer: { endpoint: 'https://example.com/api' },
				wpImporter: { endpoint: 'https://example.com/wp-json/wp/v2' },
			};

			const result = AppsConfigSchema.parse(inputConfig);

			expect(result).toEqual({
				libSQLViewer: { enabled: true, endpoint: 'https://example.com/api' },
				wpImporter: { enabled: true, endpoint: 'https://example.com/wp-json/wp/v2' },
			});
		});

		it('should use default values when config is not provided', () => {
			const result = AppsConfigSchema.parse(undefined);

			expect(result).toEqual({
				libSQLViewer: { enabled: true, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
			});
		});

		it('should reject invalid type for libSQLViewer', () => {
			const invalidConfig = {
				libSQLViewer: 'invalid',
				wpImporter: true,
			};

			expect(() => AppsConfigSchema.parse(invalidConfig)).toThrow();
		});

		it('should reject invalid type for wpImporter', () => {
			const invalidConfig = {
				libSQLViewer: true,
				wpImporter: 123,
			};

			expect(() => AppsConfigSchema.parse(invalidConfig)).toThrow();
		});
	});

	describe('StudioCMSDevAppsSchema', () => {
		it('should validate and transform dev apps config', () => {
			const inputConfig = {
				endpoint: 'https://example.com',
				verbose: true,
				appsConfig: {
					libSQLViewer: true,
					wpImporter: { endpoint: 'https://example.com/wp-json/wp/v2' },
				},
			};

			const result = StudioCMSDevAppsSchema.parse(inputConfig);

			expect(result).toEqual({
				endpoint: 'https://example.com',
				verbose: true,
				appsConfig: {
					libSQLViewer: { enabled: true, endpoint: 'outerbase' },
					wpImporter: { enabled: true, endpoint: 'https://example.com/wp-json/wp/v2' },
				},
			});
		});

		it('should use default values when config is not provided', () => {
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

		it('should handle minimal config', () => {
			const inputConfig = {
				endpoint: 'custom-endpoint',
			};

			const result = StudioCMSDevAppsSchema.parse(inputConfig);

			expect(result).toEqual({
				endpoint: 'custom-endpoint',
				verbose: false,
				appsConfig: {
					libSQLViewer: { enabled: true, endpoint: 'outerbase' },
					wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
				},
			});
		});

		it('should reject invalid endpoint type', () => {
			const invalidConfig = {
				endpoint: 123,
			};

			expect(() => StudioCMSDevAppsSchema.parse(invalidConfig)).toThrow();
		});

		it('should reject invalid verbose type', () => {
			const invalidConfig = {
				verbose: 'invalid',
			};

			expect(() => StudioCMSDevAppsSchema.parse(invalidConfig)).toThrow();
		});
	});
});
