import { describe, expect, it } from 'vitest';
import { defaultCacheLifeTime } from '../../../src/consts';
import {
	CacheConfigSchema,
	ProcessedCacheConfigSchema,
	ProcessedSDKSchema,
	SDKCacheSchema,
	SDKSchema,
	TimeStringSchema,
} from '../../../src/schemas/config/sdk';

describe('TimeStringSchema', () => {
	it('parses valid minute string', () => {
		expect(TimeStringSchema.parse('5m')).toBe(5 * 60 * 1000);
	});

	it('parses valid hour string', () => {
		expect(TimeStringSchema.parse('2h')).toBe(2 * 60 * 60 * 1000);
	});

	it('throws on invalid format', () => {
		expect(() => TimeStringSchema.parse('10x')).toThrow();
		expect(() => TimeStringSchema.parse('h')).toThrow();
		expect(() => TimeStringSchema.parse('')).toThrow();
	});
});

describe('CacheConfigSchema', () => {
	it('defaults lifetime to defaultCacheLifeTime', () => {
		const result = CacheConfigSchema.parse({});
		expect(result.lifetime).toBe(300000);
	});

	it('accepts valid lifetime', () => {
		const result = CacheConfigSchema.parse({ lifetime: '10m' });
		expect(result.lifetime).toBe(600000);
	});
});

describe('ProcessedCacheConfigSchema', () => {
	it('defaults enabled to true and lifetime to defaultCacheLifeTime', () => {
		const result = ProcessedCacheConfigSchema.parse({});
		expect(result.enabled).toBe(true);
		expect(result.lifetime).toBe(300000);
	});

	it('accepts custom values', () => {
		const result = ProcessedCacheConfigSchema.parse({ enabled: false, lifetime: '1h' });
		expect(result.enabled).toBe(false);
		expect(result.lifetime).toBe(3600000);
	});
});

describe('SDKCacheSchema', () => {
	it('defaults to enabled true and default lifetime', () => {
		const result = SDKCacheSchema.parse(undefined);
		expect(result.enabled).toBe(true);
		expect(result.lifetime).toBe(TimeStringSchema.parse(defaultCacheLifeTime));
	});

	it('handles boolean true', () => {
		const result = SDKCacheSchema.parse(true);
		expect(result.enabled).toBe(true);
		expect(result.lifetime).toBe(TimeStringSchema.parse(defaultCacheLifeTime));
	});

	it('handles boolean false', () => {
		const result = SDKCacheSchema.parse(false);
		expect(result.enabled).toBe(false);
		expect(result.lifetime).toBe(TimeStringSchema.parse(defaultCacheLifeTime));
	});

	it('handles cache config object', () => {
		const result = SDKCacheSchema.parse({ lifetime: '10m' });
		expect(result.enabled).toBe(true);
		expect(result.lifetime).toBe(600000);
	});
});

describe('SDKSchema', () => {
	it('defaults to enabled true and default lifetime', () => {
		const result = SDKSchema.parse(undefined);
		expect(result.cacheConfig.enabled).toBe(true);
		expect(result.cacheConfig.lifetime).toBe(TimeStringSchema.parse(defaultCacheLifeTime));
	});

	it('handles boolean true', () => {
		const result = SDKSchema.parse(true);
		expect(result.cacheConfig.enabled).toBe(true);
		expect(result.cacheConfig.lifetime).toBe(TimeStringSchema.parse(defaultCacheLifeTime));
	});

	it('handles boolean false', () => {
		const result = SDKSchema.parse(false);
		expect(result.cacheConfig.enabled).toBe(false);
		expect(result.cacheConfig.lifetime).toBe(TimeStringSchema.parse(defaultCacheLifeTime));
	});

	it('handles object with cacheConfig boolean', () => {
		const result = SDKSchema.parse({ cacheConfig: false });
		expect(result.cacheConfig.enabled).toBe(false);
		expect(result.cacheConfig.lifetime).toBe(TimeStringSchema.parse(defaultCacheLifeTime));
	});

	it('handles object with cacheConfig object', () => {
		const result = SDKSchema.parse({ cacheConfig: { lifetime: '1h' } });
		expect(result.cacheConfig.enabled).toBe(true);
		expect(result.cacheConfig.lifetime).toBe(3600000);
	});
});

describe('ProcessedSDKSchema', () => {
	it('accepts valid processed config', () => {
		const result = ProcessedSDKSchema.parse({
			cacheConfig: { enabled: false, lifetime: '10m' },
		});
		expect(result.cacheConfig.enabled).toBe(false);
		expect(result.cacheConfig.lifetime).toBe(600000);
	});

	it('defaults cacheConfig properties', () => {
		const result = ProcessedSDKSchema.parse({ cacheConfig: {} });
		expect(result.cacheConfig.enabled).toBe(true);
		expect(result.cacheConfig.lifetime).toBe(300000);
	});
});
