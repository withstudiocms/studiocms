import type { AstroIntegration } from 'astro';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { dynamicSitemap, safeString } from '../../../src/integrations/dynamic-sitemap/index';

describe('safeString', () => {
	it('removes leading and trailing underscores', () => {
		expect(safeString('_test_')).toBe('test');
		expect(safeString('__test__')).toBe('test');
	});

	it('removes studiocms_ prefix', () => {
		expect(safeString('studiocms_plugin')).toBe('plugin');
		expect(safeString('_studiocms_plugin_')).toBe('plugin');
	});

	it('handles strings without underscores or prefix', () => {
		expect(safeString('plugin')).toBe('plugin');
	});

	it('handles empty string', () => {
		expect(safeString('')).toBe('');
	});
});

describe('dynamicSitemap', () => {
	it('should return an AstroIntegration object with correct name', () => {
		const integration = dynamicSitemap({ sitemaps: [] });
		expect(integration).toBeDefined();
		expect(integration.name).toBe('studiocms/dynamic-sitemap');
		expect(typeof integration.hooks['astro:config:setup']).toBe('function');
		expectTypeOf(integration).toEqualTypeOf<AstroIntegration>();
	});
});
