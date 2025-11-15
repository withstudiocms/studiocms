import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import type { WebVitalsResponseItem } from '../../../../src/integrations/webVitals/types';
import {
	calculateClsAverage,
	calculateClsScorePercent,
	calculateClsScoreText,
	calculateInpAverage,
	calculateInpScorePercent,
	calculateInpScoreText,
	calculateLcpAverage,
	calculateLcpScorePercent,
	calculateLcpScoreText,
	clsDataAverage,
	clsTextColor,
	generateLighthouseFetchUrl,
	inpDataAverage,
	inpTextColor,
	lcpDataAverage,
	lcpTextColor,
	msToSeconds,
	progressBarClsTrackColor,
	progressBarInpColor,
	progressBarInpTrackColor,
	progressBarLcpColor,
	progressBarLcpTrackColor,
} from '../../../../src/integrations/webVitals/utils/webVitalsUtils';
import { parentSuiteName, sharedTags } from '../../../test-utils';

const localSuiteName = 'Web Vitals Utils tests';

describe(parentSuiteName, () => {
	[
		{
			data: 1000,
			expected: 1,
		},
		{
			data: 2500,
			expected: 2.5,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `msToSeconds test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('msToSeconds tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = msToSeconds(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: [0.1, 0.2, 0.3],
			expected: 0.2,
		},
		{
			data: [0.123, 0.456],
			expected: 0.29,
		},
		{
			data: [],
			expected: Number.NaN,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateClsAverage test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateClsAverage tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = calculateClsAverage(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: [
				{ name: 'CLS', value: 0.1 },
				{ name: 'CLS', value: 0.2 },
				{ name: 'LCP', value: 1000 },
			],
			expected: 0.15,
		},
		{
			data: [{ name: 'LCP', value: 1 }],
			expected: Number.NaN,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `clsDataAverage test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('clsDataAverage tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = clsDataAverage(data as WebVitalsResponseItem[]);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 0.05,
			expected: 'Excellent',
		},
		{
			data: 0.2,
			expected: 'Good',
		},
		{
			data: 0.4,
			expected: 'Fair',
		},
		{
			data: 0.6,
			expected: 'Poor',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateClsScoreText test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateClsScoreText tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = calculateClsScoreText(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 0.05,
			expected: 100,
		},
		{
			data: 0.2,
			expected: 83,
		},
		{
			data: 0.3,
			expected: 70,
		},
		{
			data: 0.6,
			expected: 40,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateClsScorePercent test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateClsScorePercent tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = calculateClsScorePercent(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 0.2,
			expected: 'green',
		},
		{
			data: 0.4,
			expected: 'yellow',
		},
		{
			data: 0.6,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `clsTextColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('clsTextColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = clsTextColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 0.2,
			expected: 'yellow',
		},
		{
			data: 0.4,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `progressBarClsTrackColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('progressBarClsTrackColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = progressBarClsTrackColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 0.1,
			expected: 'green',
		},
		{
			data: 0.4,
			expected: 'yellow',
		},
		{
			data: 0.6,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `clsTextColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('clsTextColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = clsTextColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: [1000, 2000, 3000],
			expected: 2000,
		},
		{
			data: [1234, 5678],
			expected: 3456,
		},
		{
			data: [],
			expected: Number.NaN,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateLcpAverage test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateLcpAverage tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = calculateLcpAverage(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: [
				{ name: 'LCP', value: 1000 },
				{ name: 'LCP', value: 2000 },
				{ name: 'CLS', value: 0.1 },
			],
			expected: 1500,
		},
		{
			data: [{ name: 'CLS', value: 0.1 }],
			expected: Number.NaN,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `lcpDataAverage test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('lcpDataAverage tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = lcpDataAverage(data as WebVitalsResponseItem[]);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 1000,
			expected: 'Excellent',
		},
		{
			data: 3000,
			expected: 'Good',
		},
		{
			data: 5000,
			expected: 'Fair',
		},
		{
			data: 7000,
			expected: 'Poor',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateLcpScoreText test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateLcpScoreText tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = calculateLcpScoreText(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 1000,
			expected: 100,
		},
		{
			data: 3000,
			expected: -74850,
		},
		{
			data: 5000,
			expected: -124850,
		},
		{
			data: 7000,
			expected: -87425,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateLcpScorePercent test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateLcpScorePercent tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = calculateLcpScorePercent(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 2000,
			expected: 'green',
		},
		{
			data: 3500,
			expected: 'yellow',
		},
		{
			data: 5000,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `progressBarLcpColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('progressBarLcpColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = progressBarLcpColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 2000,
			expected: 'yellow',
		},
		{
			data: 3500,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `progressBarLcpTrackColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('progressBarLcpTrackColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = progressBarLcpTrackColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 2000,
			expected: 'green',
		},
		{
			data: 3500,
			expected: 'yellow',
		},
		{
			data: 5000,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `lcpTextColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('lcpTextColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = lcpTextColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: [50, 100, 150],
			expected: 100,
		},
		{
			data: [123, 456],
			expected: 289.5,
		},
		{
			data: [],
			expected: Number.NaN,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateInpAverage test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateInpAverage tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = calculateInpAverage(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: [
				{ name: 'INP', value: 50 },
				{ name: 'INP', value: 100 },
				{ name: 'CLS', value: 0.1 },
			],
			expected: 75,
		},
		{
			data: [{ name: 'CLS', value: 0.1 }],
			expected: Number.NaN,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `inpDataAverage test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('inpDataAverage tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = inpDataAverage(data as WebVitalsResponseItem[]);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 40,
			expected: 'Excellent',
		},
		{
			data: 80,
			expected: 'Good',
		},
		{
			data: 150,
			expected: 'Fair',
		},
		{
			data: 250,
			expected: 'Poor',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateInpScoreText test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateInpScoreText tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = calculateInpScoreText(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 40,
			expected: 100,
		},
		{
			data: 80,
			expected: 70,
		},
		{
			data: 150,
			expected: 25,
		},
		{
			data: 250,
			expected: -25,
		},
	].forEach(({ data, expected }, index) => {
		const testName = `calculateInpScorePercent test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('calculateInpScorePercent tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = calculateInpScorePercent(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 80,
			expected: 'green',
		},
		{
			data: 150,
			expected: 'yellow',
		},
		{
			data: 250,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `progressBarInpColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('progressBarInpColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = progressBarInpColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 80,
			expected: 'yellow',
		},
		{
			data: 150,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `progressBarInpTrackColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('progressBarInpTrackColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = progressBarInpTrackColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			data: 80,
			expected: 'green',
		},
		{
			data: 150,
			expected: 'yellow',
		},
		{
			data: 250,
			expected: 'red',
		},
	].forEach(({ data, expected }, index) => {
		const testName = `inpTextColor test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('inpTextColor tests');
			await allure.tags(...tags);

			await allure.parameter('data', String(data));

			const result = inpTextColor(data);
			expect(result).toBe(expected);
		});
	});

	[
		{
			url: 'https://example.com',
			strategy: undefined,
			toContain: [
				'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
				'url=https%3A%2F%2Fexample.com',
				'strategy=mobile',
			],
		},
		{
			url: 'https://example.com',
			strategy: 'desktop',
			toContain: [
				'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
				'url=https%3A%2F%2Fexample.com',
				'strategy=desktop',
			],
		},
		{
			url: 'https://example.com',
			strategy: 'mixed-content',
			toContain: [
				'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
				'url=https%3A%2F%2Fexample.com',
				'strategy=mixed-content',
			],
		},
	].forEach(({ url, strategy, toContain }, index) => {
		const testName = `generateLighthouseFetchUrl test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('generateLighthouseFetchUrl tests');
			await allure.tags(...tags);

			await allure.parameter('url', url);
			await allure.parameter('strategy', strategy ?? 'mobile (default)');

			const result = generateLighthouseFetchUrl(
				url,
				strategy as 'mobile' | 'desktop' | 'mixed-content' | undefined
			);
			toContain.forEach((substring) => {
				expect(result).toContain(substring);
			});
		});
	});
});
