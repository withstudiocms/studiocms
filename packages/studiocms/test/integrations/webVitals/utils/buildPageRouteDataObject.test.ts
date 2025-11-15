import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { WebVitalsResponseItem } from '../../../../src/integrations/webVitals/types';
import { buildPageRouteDataObject } from '../../../../src/integrations/webVitals/utils/buildPageRouteDataObject';
import { parentSuiteName, sharedTags } from '../../../test-utils';

const localSuiteName = 'Web Vitals Utils - buildPageRouteDataObject';

// Mock checkDate to control time-based logic
vi.mock('../../../../src/integrations/webVitals/utils/checkDate', () => ({
	checkDate: (timestamp: number) => ({
		isInLast24Hours: () => timestamp === 1,
		isInLast7Days: () => timestamp === 1 || timestamp === 2,
		isInLast30Days: () => timestamp === 1 || timestamp === 2 || timestamp === 3,
	}),
}));

describe(parentSuiteName, () => {
	let webVitalData: WebVitalsResponseItem[];

	beforeEach(() => {
		// @ts-expect-error - testing mock data
		webVitalData = [
			{ pathname: '/home', route: 'home', timestamp: 1 },
			{ pathname: '/about', route: 'about', timestamp: 2 },
			{ pathname: '/home', route: 'home', timestamp: 2 },
			{ pathname: '/contact', route: 'contact', timestamp: 3 },
			{ pathname: '/home', route: 'home', timestamp: 3 },
			{ pathname: '/about', route: 'about', timestamp: 4 }, // Not in any range
		] as WebVitalsResponseItem[];
	});

	[
		{
			type: 'perRouteData',
			expected: [
				{
					pagePathname: '/home',
					analyticData: { pageRoute: 'home', pageViews: 3 },
				},
				{
					pagePathname: '/about',
					analyticData: { pageRoute: 'about', pageViews: 2 },
				},
				{
					pagePathname: '/contact',
					analyticData: { pageRoute: 'contact', pageViews: 1 },
				},
			],
		},
		{
			type: 'last24HoursData',
			expected: [
				{
					pagePathname: '/home',
					analyticData: { pageRoute: 'home', pageViews: 1 },
				},
			],
		},
		{
			type: 'last7DaysData',
			expected: [
				{
					pagePathname: '/home',
					analyticData: { pageRoute: 'home', pageViews: 2 },
				},
				{
					pagePathname: '/about',
					analyticData: { pageRoute: 'about', pageViews: 1 },
				},
			],
		},
		{
			type: 'last30DaysData',
			expected: [
				{
					pagePathname: '/home',
					analyticData: { pageRoute: 'home', pageViews: 3 },
				},
				{
					pagePathname: '/about',
					analyticData: { pageRoute: 'about', pageViews: 1 },
				},
				{
					pagePathname: '/contact',
					analyticData: { pageRoute: 'contact', pageViews: 1 },
				},
			],
		},
	].forEach(({ type, expected }) => {
		test(`should aggregate page views correctly for ${type}`, async () => {
			const tags = [...sharedTags, 'integration:webVitals', `webVitals:utils:${type}`];

			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`buildPageRouteDataObject - ${type}`);
			await allure.tags(...tags);

			const result = buildPageRouteDataObject(webVitalData);
			await allure.parameter('webVitalData', JSON.stringify(webVitalData));

			expect(result[type as keyof typeof result]).toEqual(expected);
		});
	});

	test('buildPageRouteDataObject handles empty input', async () => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:buildPageRouteDataObject'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildPageRouteDataObject empty input test');
		await allure.tags(...tags);

		await allure.step('Aggregating with empty input', async () => {
			const result = buildPageRouteDataObject([]);

			expect(result.perRouteData).toEqual([]);
			expect(result.last24HoursData).toEqual([]);
			expect(result.last7DaysData).toEqual([]);
			expect(result.last30DaysData).toEqual([]);
		});
	});
});
