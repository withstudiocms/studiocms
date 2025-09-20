import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebVitalsResponseItem } from '../../../../src/integrations/webVitals/types';
import { buildPageRouteDataObject } from '../../../../src/integrations/webVitals/utils/buildPageRouteDataObject';

// Mock checkDate to control time-based logic
vi.mock('../../../../src/integrations/webVitals/utils/checkDate', () => ({
	checkDate: (timestamp: number) => ({
		isInLast24Hours: () => timestamp === 1,
		isInLast7Days: () => timestamp === 1 || timestamp === 2,
		isInLast30Days: () => timestamp === 1 || timestamp === 2 || timestamp === 3,
	}),
}));

describe('buildPageRouteDataObject', () => {
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

	it('should aggregate page views correctly for perRouteData', () => {
		const result = buildPageRouteDataObject(webVitalData);
		expect(result.perRouteData).toEqual([
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
		]);
	});

	it('should aggregate page views for last24HoursData', () => {
		const result = buildPageRouteDataObject(webVitalData);
		expect(result.last24HoursData).toEqual([
			{
				pagePathname: '/home',
				analyticData: { pageRoute: 'home', pageViews: 1 },
			},
		]);
	});

	it('should aggregate page views for last7DaysData', () => {
		const result = buildPageRouteDataObject(webVitalData);
		expect(result.last7DaysData).toEqual([
			{
				pagePathname: '/home',
				analyticData: { pageRoute: 'home', pageViews: 2 },
			},
			{
				pagePathname: '/about',
				analyticData: { pageRoute: 'about', pageViews: 1 },
			},
		]);
	});

	it('should aggregate page views for last30DaysData', () => {
		const result = buildPageRouteDataObject(webVitalData);
		expect(result.last30DaysData).toEqual([
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
		]);
	});

	it('should return empty arrays if input is empty', () => {
		const result = buildPageRouteDataObject([]);
		expect(result.last24HoursData).toEqual([]);
		expect(result.last7DaysData).toEqual([]);
		expect(result.last30DaysData).toEqual([]);
		expect(result.perRouteData).toEqual([]);
	});
});
