import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import type { WebVitalsRating } from '../../../src/integrations/webVitals/schemas';
import type { WebVitalsResponseItem } from '../../../src/integrations/webVitals/types';
import {
	processWebVitalsRouteSummary,
	scoring,
	simpleScore,
	weighting,
} from '../../../src/integrations/webVitals/webVitalsRouteSummary';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Web Vitals Route Summary tests';

// Helper to create a WebVitalsResponseItem
function createItem(
	route: string,
	name: 'LCP' | 'CLS' | 'INP',
	rating: WebVitalsRating,
	value: number
): WebVitalsResponseItem {
	return {
		route,
		name,
		rating,
		value,
		// quartile and quartile_end are assigned by the function
	} as WebVitalsResponseItem;
}

describe(parentSuiteName, () => {
	[
		{
			data: [],
			expected: [],
		},
		{
			data: [
				createItem('/home', 'LCP', 'good', 100),
				createItem('/home', 'LCP', 'good', 110),
				createItem('/home', 'LCP', 'good', 120),
			],
			expected: [],
		},
	].forEach(({ data, expected }, index) => {
		const testName = `Web Vitals Route Summary edge case test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:routeSummary'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('processWebVitalsRouteSummary edge cases');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			const result = processWebVitalsRouteSummary(data);
			expect(result).toEqual(expected);
		});
	});

	test('processWebVitalsRouteSummary processes a metric group with 4+ items', async () => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:routeSummary'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('processWebVitalsRouteSummary detailed test');
		await allure.tags(...tags);

		await allure.step('Processing Web Vitals Route Summary with sample data', async () => {
			const data: WebVitalsResponseItem[] = [
				// LCP samples for /home
				createItem('/home', 'LCP', 'good', 100),
				createItem('/home', 'LCP', 'good', 110),
				createItem('/home', 'LCP', 'needs-improvement', 120),
				createItem('/home', 'LCP', 'poor', 130),
				// CLS samples for /home
				createItem('/home', 'CLS', 'good', 0.1),
				createItem('/home', 'CLS', 'good', 0.12),
				createItem('/home', 'CLS', 'needs-improvement', 0.15),
				createItem('/home', 'CLS', 'poor', 0.2),
				// INP samples for /home
				createItem('/home', 'INP', 'good', 50),
				createItem('/home', 'INP', 'good', 55),
				createItem('/home', 'INP', 'needs-improvement', 60),
				createItem('/home', 'INP', 'poor', 70),
			];
			const result = processWebVitalsRouteSummary(data);
			expect(result.length).toBe(1);
			const summary = result[0];
			expect(summary.route).toBe('/home');
			expect(summary.metrics.LCP).toBeDefined();
			expect(summary.metrics.CLS).toBeDefined();
			expect(summary.metrics.INP).toBeDefined();
			expect(typeof summary.score).toBe('number');
			expect(summary.passingCoreWebVitals).toBe(false); // Because some metrics are not "good"
		});
	});

	test('simpleScore calculates correct weighted score', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('simpleScore function test');
		await allure.tags(...sharedTags, 'integration:webVitals', 'webVitals:routeSummary');

		await allure.step('Calculating simple score with sample ratings', async () => {
			const score = simpleScore('good', 'needs-improvement', 'poor');
			const expectedScore =
				scoring['good'] * weighting.LCP +
				scoring['needs-improvement'] * weighting.CLS +
				scoring['poor'] * weighting.INP;

			expect(score).toBeCloseTo(expectedScore);
		});
	});

	test('processWebVitalsRouteSummary sorts summaries by score ascending', async () => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:routeSummary'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('processWebVitalsRouteSummary sorting test');
		await allure.tags(...tags);

		await allure.step('Processing Web Vitals Route Summary with multiple routes', async () => {
			const data: WebVitalsResponseItem[] = [
				// Route A - all good
				...['LCP', 'CLS', 'INP'].flatMap((name) =>
					Array.from({ length: 4 }, (_, i) =>
						createItem('/a', name as 'LCP' | 'CLS' | 'INP', 'good', i + 1)
					)
				),
				// Route B - all poor
				...['LCP', 'CLS', 'INP'].flatMap((name) =>
					Array.from({ length: 4 }, (_, i) =>
						createItem('/b', name as 'LCP' | 'CLS' | 'INP', 'poor', i + 1)
					)
				),
			];
			const result = processWebVitalsRouteSummary(data);
			expect(result.length).toBe(2);
			expect(result[0].route).toBe('/b');
			expect(result[1].route).toBe('/a');
			expect(result[0].score).toBeLessThan(result[1].score);
		});
	});

	test('processWebVitalsRouteSummary handles multiple routes and metrics', async () => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:routeSummary'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('processWebVitalsRouteSummary multiple routes and metrics test');
		await allure.tags(...tags);

		await allure.step(
			'Processing Web Vitals Route Summary with multiple routes and metrics',
			async () => {
				const data: WebVitalsResponseItem[] = [
					...['LCP', 'CLS', 'INP'].flatMap((name) =>
						Array.from({ length: 4 }, (_, i) =>
							createItem('/x', name as 'LCP' | 'CLS' | 'INP', 'good', i + 1)
						)
					),
					...['LCP', 'CLS', 'INP'].flatMap((name) =>
						Array.from({ length: 4 }, (_, i) =>
							createItem('/y', name as 'LCP' | 'CLS' | 'INP', 'needs-improvement', i + 1)
						)
					),
				];
				const result = processWebVitalsRouteSummary(data);
				expect(result.map((r) => r.route).sort()).toEqual(['/x', '/y']);
				expect(result[0].metrics.LCP).toBeDefined();
				expect(result[1].metrics.LCP).toBeDefined();
			}
		);
	});
});
