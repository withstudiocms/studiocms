import { describe, expect, it } from 'vitest';
import { dashboardConfigSchema } from '../../../src/schemas/config/dashboard';

describe('dashboardConfigSchema', () => {
	it('should use defaults when no config is provided', () => {
		const result = dashboardConfigSchema.parse({});
		expect(result.dashboardEnabled).toBe(true);
		expect(result.inject404Route).toBe(true);
		expect(result.faviconURL).toBe('/favicon.svg');
		expect(result.dashboardRouteOverride).toBeUndefined();
		expect(result.versionCheck).toBe(true);
	});

	it('should allow overriding all values', () => {
		const config = {
			dashboardEnabled: false,
			inject404Route: false,
			faviconURL: '/custom.ico',
			dashboardRouteOverride: 'admin',
			versionCheck: false,
		};
		const result = dashboardConfigSchema.parse(config);
		expect(result.dashboardEnabled).toBe(false);
		expect(result.inject404Route).toBe(false);
		expect(result.faviconURL).toBe('/custom.ico');
		expect(result.dashboardRouteOverride).toBe('admin');
		expect(result.versionCheck).toBe(false);
	});

	it('should allow partial overrides and use defaults for missing values', () => {
		const config = {
			dashboardEnabled: false,
			faviconURL: '/custom.svg',
		};
		const result = dashboardConfigSchema.parse(config);
		expect(result.dashboardEnabled).toBe(false);
		expect(result.inject404Route).toBe(true);
		expect(result.faviconURL).toBe('/custom.svg');
		expect(result.dashboardRouteOverride).toBeUndefined();
		expect(result.versionCheck).toBe(true);
	});

	it('should reject invalid types', () => {
		expect(() =>
			dashboardConfigSchema.parse({
				dashboardEnabled: 'yes',
			})
		).toThrow();
		expect(() =>
			dashboardConfigSchema.parse({
				faviconURL: 123,
			})
		).toThrow();
		expect(() =>
			dashboardConfigSchema.parse({
				inject404Route: 'no',
			})
		).toThrow();
	});

	it('should allow undefined (optional schema)', () => {
		expect(() => dashboardConfigSchema.parse(undefined)).not.toThrow();
		const result = dashboardConfigSchema.parse(undefined);
		expect(result.dashboardEnabled).toBe(true);
		expect(result.inject404Route).toBe(true);
		expect(result.faviconURL).toBe('/favicon.svg');
		expect(result.dashboardRouteOverride).toBeUndefined();
		expect(result.versionCheck).toBe(true);
	});
});
