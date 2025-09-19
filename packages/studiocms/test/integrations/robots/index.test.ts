/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import type { AstroIntegration } from 'astro';
import { describe, expect, expectTypeOf, it } from 'vitest';
import robotsTXT from '../../../src/integrations/robots/index';

describe('robotsTXT', () => {
	it('should return an AstroIntegration object with correct name', () => {
		const integration = robotsTXT({});
		expect(integration).toBeDefined();
		expect(integration.name).toBe('studiocms/robotstxt');
		expect(typeof integration.hooks['astro:config:setup']).toBe('function');
		expect(typeof integration.hooks['astro:build:start']).toBe('function');
		expect(typeof integration.hooks['astro:build:done']).toBe('function');
		expectTypeOf(integration).toEqualTypeOf<AstroIntegration>();
	});
});
