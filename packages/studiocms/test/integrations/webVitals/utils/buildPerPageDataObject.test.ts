import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebVitalsResponseItem } from '../../../../src/integrations/webVitals/types';
import { buildPerPageRouteDataObject } from '../../../../src/integrations/webVitals/utils/buildPerPageDataObject';

// Mock dependencies
vi.mock('../../../../src/integrations/webVitals/utils/checkDate', () => ({
	checkDate: (timestamp: number) => ({
		isInLast24Hours: () => timestamp >= 1000 && timestamp < 2000,
		isInLast7Days: () => timestamp >= 1000 && timestamp < 7000,
		isInLast30Days: () => timestamp >= 1000 && timestamp < 30000,
	}),
}));

vi.mock('../../../../src/integrations/webVitals/utils/webVitalsUtils', () => ({
	calculateClsAverage: (values: number[]) =>
		values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
	calculateClsScoreText: (avg: number) =>
		avg < 0.1 ? 'good' : avg < 0.25 ? 'needs improvement' : 'poor',
	calculateLcpAverage: (values: number[]) =>
		values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
	calculateLcpScoreText: (avg: number) =>
		avg < 2.5 ? 'good' : avg < 4 ? 'needs improvement' : 'poor',
	calculateInpAverage: (values: number[]) =>
		values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
	calculateInpScoreText: (avg: number) =>
		avg < 200 ? 'good' : avg < 500 ? 'needs improvement' : 'poor',
}));

describe('buildPerPageRouteDataObject', () => {
	let sampleData: WebVitalsResponseItem[];

	beforeEach(() => {
		sampleData = [
			// @ts-expect-error - testing mock data
			{ route: '/home', name: 'CLS', value: 0.05, timestamp: 1500 },
			// @ts-expect-error - testing mock data
			{ route: '/home', name: 'LCP', value: 2.0, timestamp: 1500 },
			// @ts-expect-error - testing mock data
			{ route: '/home', name: 'INP', value: 180, timestamp: 1500 },
			// @ts-expect-error - testing mock data
			{ route: '/about', name: 'CLS', value: 0.2, timestamp: 1600 },
			// @ts-expect-error - testing mock data
			{ route: '/about', name: 'LCP', value: 3.5, timestamp: 1600 },
			// @ts-expect-error - testing mock data
			{ route: '/about', name: 'INP', value: 300, timestamp: 1600 },
			// @ts-expect-error - testing mock data
			{ route: '/home', name: 'CLS', value: 0.08, timestamp: 8000 }, // Only in last30Days
			// @ts-expect-error - testing mock data
			{ route: '/home', name: 'LCP', value: 2.8, timestamp: 8000 },
			// @ts-expect-error - testing mock data
			{ route: '/home', name: 'INP', value: 220, timestamp: 8000 },
		];
	});

	it('should aggregate historical data correctly', () => {
		const result = buildPerPageRouteDataObject(sampleData);

		expect(result.historicalData).toEqual([
			{
				pageRoute: '/home',
				sampleSize: 6,
				CLS: { average: (0.05 + 0.08) / 2, rating: 'good' },
				LCP: { average: (2.0 + 2.8) / 2, rating: 'good' },
				INP: { average: (180 + 220) / 2, rating: 'needs improvement' },
			},
			{
				pageRoute: '/about',
				sampleSize: 3,
				CLS: { average: 0.2, rating: 'needs improvement' },
				LCP: { average: 3.5, rating: 'needs improvement' },
				INP: { average: 300, rating: 'needs improvement' },
			},
		]);
	});

	it('should aggregate last24HoursData correctly', () => {
		const result = buildPerPageRouteDataObject(sampleData);

		expect(result.last24HoursData).toEqual([
			{
				pageRoute: '/home',
				sampleSize: 3,
				CLS: { average: 0.05, rating: 'good' },
				LCP: { average: 2.0, rating: 'good' },
				INP: { average: 180, rating: 'good' },
			},
			{
				pageRoute: '/about',
				sampleSize: 3,
				CLS: { average: 0.2, rating: 'needs improvement' },
				LCP: { average: 3.5, rating: 'needs improvement' },
				INP: { average: 300, rating: 'needs improvement' },
			},
		]);
	});

	it('should aggregate last7DaysData correctly', () => {
		const result = buildPerPageRouteDataObject(sampleData);

		expect(result.last7DaysData).toEqual([
			{
				pageRoute: '/home',
				sampleSize: 3,
				CLS: { average: 0.05, rating: 'good' },
				LCP: { average: 2.0, rating: 'good' },
				INP: { average: 180, rating: 'good' },
			},
			{
				pageRoute: '/about',
				sampleSize: 3,
				CLS: { average: 0.2, rating: 'needs improvement' },
				LCP: { average: 3.5, rating: 'needs improvement' },
				INP: { average: 300, rating: 'needs improvement' },
			},
		]);
	});

	it('should aggregate last30DaysData correctly', () => {
		const result = buildPerPageRouteDataObject(sampleData);

		expect(result.last30DaysData).toEqual([
			{
				pageRoute: '/home',
				sampleSize: 6,
				CLS: { average: 0.065, rating: 'good' },
				LCP: { average: 2.4, rating: 'good' },
				INP: { average: 200, rating: 'needs improvement' },
			},
			{
				CLS: {
					average: 0.2,
					rating: 'needs improvement',
				},
				INP: {
					average: 300,
					rating: 'needs improvement',
				},
				LCP: {
					average: 3.5,
					rating: 'needs improvement',
				},
				pageRoute: '/about',
				sampleSize: 3,
			},
		]);
	});

	it('should handle empty input', () => {
		const result = buildPerPageRouteDataObject([]);
		expect(result.historicalData).toEqual([]);
		expect(result.last24HoursData).toEqual([]);
		expect(result.last7DaysData).toEqual([]);
		expect(result.last30DaysData).toEqual([]);
	});
});
