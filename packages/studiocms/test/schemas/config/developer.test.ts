import { describe, expect, it } from 'vitest';
import { developerConfigSchema } from '../../../src/schemas/config/developer';

describe('developerConfigSchema', () => {
	it('should default to { demoMode: false } when undefined', () => {
		const result = developerConfigSchema.parse(undefined);
		expect(result).toEqual({ demoMode: false });
	});

	it('should accept demoMode: false', () => {
		const result = developerConfigSchema.parse({ demoMode: false });
		expect(result).toEqual({ demoMode: false });
	});

	it('should accept demoMode as an object with username and password', () => {
		const demo = { username: 'demo_user', password: 'demo_pass' };
		const result = developerConfigSchema.parse({ demoMode: demo });
		expect(result).toEqual({ demoMode: demo });
	});

	it('should fail if demoMode object is missing username', () => {
		expect(() => developerConfigSchema.parse({ demoMode: { password: 'demo_pass' } })).toThrow();
	});

	it('should fail if demoMode object is missing password', () => {
		expect(() => developerConfigSchema.parse({ demoMode: { username: 'demo_user' } })).toThrow();
	});

	it('should fail if demoMode is a string', () => {
		// biome-ignore lint/suspicious/noExplicitAny: allowed in tests
		expect(() => developerConfigSchema.parse({ demoMode: 'invalid' as any })).toThrow();
	});

	it('should default demoMode to false if not provided', () => {
		const result = developerConfigSchema.parse({});
		expect(result).toEqual({ demoMode: false });
	});
});
