import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	CoreWebVitalsMetricTypeSchema,
	MetricSummaryRowSchema,
	RouteSummaryRowSchema,
	WebVitalsMetricTypeSchema,
	WebVitalsRatingSchema,
} from '../../../src/integrations/webVitals/schemas';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Web Vitals Schemas tests';

describe(parentSuiteName, () => {
	[
		{
			data: 'good',
			expected: 'good',
		},
		{
			data: 'needs-improvement',
			expected: 'needs-improvement',
		},
		{
			data: 'poor',
			expected: 'poor',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `WebVitalsRatingSchema valid case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('WebVitalsRatingSchema valid cases');
			await allure.tags(...tags);

			await allure.parameter('data', data);

			const result = WebVitalsRatingSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});

	test('WebVitalsRatingSchema should throw on invalid rating', async () => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('WebVitalsRatingSchema invalid case');
		await allure.tags(...tags);

		const data = 'excellent';

		await allure.parameter('data', data);

		expect(() => WebVitalsRatingSchema.parse(data)).toThrow();
	});

	[
		{
			data: 'CLS',
			expected: 'CLS',
		},
		{
			data: 'INP',
			expected: 'INP',
		},
		{
			data: 'LCP',
			expected: 'LCP',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `CoreWebVitalsMetricTypeSchema valid case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('CoreWebVitalsMetricTypeSchema valid cases');
			await allure.tags(...tags);

			await allure.parameter('data', data);

			const result = CoreWebVitalsMetricTypeSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});

	test('CoreWebVitalsMetricTypeSchema should throw on invalid core metric', async () => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('CoreWebVitalsMetricTypeSchema invalid case');
		await allure.tags(...tags);

		const data = 'FCP';

		await allure.parameter('data', data);

		expect(() => CoreWebVitalsMetricTypeSchema.parse(data)).toThrow();
	});

	[
		{
			data: 'CLS',
			expected: 'CLS',
		},
		{
			data: 'INP',
			expected: 'INP',
		},
		{
			data: 'LCP',
			expected: 'LCP',
		},
		{
			data: 'FCP',
			expected: 'FCP',
		},
		{
			data: 'FID',
			expected: 'FID',
		},
		{
			data: 'TTFB',
			expected: 'TTFB',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `WebVitalsMetricTypeSchema valid case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('WebVitalsMetricTypeSchema valid cases');
			await allure.tags(...tags);

			await allure.parameter('data', data);

			const result = WebVitalsMetricTypeSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});

	test('WebVitalsMetricTypeSchema should throw on invalid metric type', async () => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('WebVitalsMetricTypeSchema invalid case');
		await allure.tags(...tags);

		const data = 'XYZ';

		await allure.parameter('data', data);

		expect(() => WebVitalsMetricTypeSchema.parse(data)).toThrow();
	});

	test('RouteSummaryRowSchema should parse a valid route summary row', async () => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('RouteSummaryRowSchema valid case');
		await allure.tags(...tags);

		const row = ['/home', 'CLS', 'good', 0.12, 100] as const;
		expect(RouteSummaryRowSchema.parse(row)).toEqual(row);
	});

	[
		{
			data: ['/home', 'CLS', 'good', -1, 100] as const,
		},
		{
			data: ['/home', 'CLS', 'good', 0.12, 'many'],
		},
	].forEach(({ data }, index) => {
		const testName = `RouteSummaryRowSchema invalid case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('RouteSummaryRowSchema invalid cases');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			expect(() => RouteSummaryRowSchema.parse(data)).toThrow();
		});
	});

	[
		{
			data: ['FCP', 'needs-improvement', 1.23, 0.45, 1, 95, 200] as const,
			expected: ['FCP', 'needs-improvement', 1.23, 0.45, true, 95, 200],
		},
		{
			data: ['FID', 'poor', 0.5, 0.1, 0, null, 50] as const,
			expected: ['FID', 'poor', 0.5, 0.1, false, null, 50],
		},
	].forEach(({ data, expected }, index) => {
		const testName = `MetricSummaryRowSchema valid case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('MetricSummaryRowSchema valid cases');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = MetricSummaryRowSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});

	[
		{
			data: ['TTFB', 'good', -0.1, 0.2, 1, 80, 10] as const,
		},
		{
			data: ['TTFB', 'good', 0.1, -0.2, 1, 80, 10] as const,
		},
	].forEach(({ data }, index) => {
		const testName = `MetricSummaryRowSchema invalid case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:schemas'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('MetricSummaryRowSchema invalid cases');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			expect(() => MetricSummaryRowSchema.parse(data)).toThrow();
		});
	});
});
