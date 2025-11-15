import { beforeEach, describe, expect, vi } from 'vitest';
import type { WebVitalsResponseItem } from '../../../../src/integrations/webVitals/types';
import { buildPageRouteDataObject } from '../../../../src/integrations/webVitals/utils/buildPageRouteDataObject';
import { allureTester } from '../../../fixtures/allureTester';
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
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

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
		test(`should aggregate page views correctly for ${type}`, async ({ setupAllure }) => {
			const tags = [...sharedTags, 'integration:webVitals', `webVitals:utils:${type}`];

			await setupAllure({
				subSuiteName: `buildPageRouteDataObject - ${type}`,
				tags,
				parameters: {
					webVitalData: JSON.stringify(webVitalData),
				},
			});

			const result = buildPageRouteDataObject(webVitalData);

			expect(result[type as keyof typeof result]).toEqual(expected);
		});
	});

	test('buildPageRouteDataObject handles empty input', async ({ setupAllure, step }) => {
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:buildPageRouteDataObject'];

		await setupAllure({
			subSuiteName: 'buildPageRouteDataObject empty input test',
			tags,
		});

		await step('Aggregating with empty input', async () => {
			const result = buildPageRouteDataObject([]);

			expect(result.perRouteData).toEqual([]);
			expect(result.last24HoursData).toEqual([]);
			expect(result.last7DaysData).toEqual([]);
			expect(result.last30DaysData).toEqual([]);
		});
	});
});
