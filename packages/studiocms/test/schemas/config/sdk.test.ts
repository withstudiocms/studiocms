import { describe, expect } from 'vitest';
import { defaultCacheLifeTime } from '../../../src/consts';
import {
	CacheConfigSchema,
	ProcessedCacheConfigSchema,
	ProcessedSDKSchema,
	SDKCacheSchema,
	SDKSchema,
	TimeStringSchema,
} from '../../../src/schemas/config/sdk';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Config Schemas tests (SDK)';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			data: '5m',
			expected: 5 * 60 * 1000,
		},
		{
			data: '2h',
			expected: 2 * 60 * 60 * 1000,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `TimeStringSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:TimeStringSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'TimeStringSchema tests',
				tags: [...tags],
				parameters: {
					data: data,
				},
			});

			const result = TimeStringSchema.parse(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: '10x',
		},
		{
			data: 'h',
		},
		{
			data: '',
		},
	].forEach(({ data }, index) => {
		const testName = `TimeStringSchema invalid format test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:TimeStringSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'TimeStringSchema tests',
				tags: [...tags],
				parameters: {
					data: data,
				},
			});

			expect(() => TimeStringSchema.parse(data)).toThrow();
		});
	});

	[
		{
			data: {},
			expected: 300000,
		},
		{
			data: { lifetime: '10m' },
			expected: 600000,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `CacheConfigSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:CacheConfigSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'CacheConfigSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = CacheConfigSchema.parse(data);
			expect(result.lifetime).toBe(expected);
		});
	});

	[
		{
			data: {},
			expected: { enabled: true, lifetime: 300000 },
		},
		{
			data: { enabled: false, lifetime: '1h' },
			expected: { enabled: false, lifetime: 3600000 },
		},
	].forEach(({ data, expected }, index) => {
		const testName = `ProcessedCacheConfigSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:ProcessedCacheConfigSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'ProcessedCacheConfigSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = ProcessedCacheConfigSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});

	const _defLifetime = TimeStringSchema.parse(defaultCacheLifeTime);

	[
		{
			data: undefined,
			expected: { enabled: true, lifetime: _defLifetime },
		},
		{
			data: true,
			expected: { enabled: true, lifetime: _defLifetime },
		},
		{
			data: false,
			expected: { enabled: false, lifetime: _defLifetime },
		},
		{
			data: { lifetime: '10m' },
			expected: { enabled: true, lifetime: 600000 },
		},
	].forEach(({ data, expected }, index) => {
		const testName = `SDKCacheSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:SDKCacheSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'SDKCacheSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = SDKCacheSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});

	[
		{
			data: undefined,
			expected: { cacheConfig: { enabled: true, lifetime: _defLifetime } },
		},
		{
			data: true,
			expected: { cacheConfig: { enabled: true, lifetime: _defLifetime } },
		},
		{
			data: false,
			expected: { cacheConfig: { enabled: false, lifetime: _defLifetime } },
		},
		{
			data: { cacheConfig: false },
			expected: { cacheConfig: { enabled: false, lifetime: _defLifetime } },
		},
		{
			data: { cacheConfig: { lifetime: '1h' } },
			expected: { cacheConfig: { enabled: true, lifetime: 3600000 } },
		},
	].forEach(({ data, expected }, index) => {
		const testName = `SDKSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:SDKSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'SDKSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = SDKSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});

	[
		{
			data: { cacheConfig: { enabled: false, lifetime: '10m' } },
			expected: { cacheConfig: { enabled: false, lifetime: 600000 } },
		},
		{
			data: { cacheConfig: {} },
			expected: { cacheConfig: { enabled: true, lifetime: 300000 } },
		},
	].forEach(({ data, expected }, index) => {
		const testName = `ProcessedSDKSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:ProcessedSDKSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'ProcessedSDKSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = ProcessedSDKSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});
});
