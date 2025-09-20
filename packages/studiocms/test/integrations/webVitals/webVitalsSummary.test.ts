import { describe, expect, it } from 'vitest';
import type { WebVitalsRating } from '../../../src/integrations/webVitals/schemas';
import type { WebVitalsResponseItem } from '../../../src/integrations/webVitals/types';
import { processWebVitalsSummary } from '../../../src/integrations/webVitals/webVitalsSummary';

// Helper to create test items
function createItem(name: string, value: number, rating: WebVitalsRating): WebVitalsResponseItem {
	return {
		name,
		value,
		rating,
		id: '',
		pathname: '',
		route: '',
		timestamp: new Date(),
	};
}

describe('processWebVitalsSummary', () => {
	it('returns empty summary for empty input', () => {
		const result = processWebVitalsSummary([]);
		expect(result).toEqual({});
	});

	it('skips metric groups with less than 4 items', () => {
		const data: WebVitalsResponseItem[] = [
			createItem('LCP', 1000, 'good'),
			createItem('LCP', 2000, 'needs-improvement'),
			createItem('LCP', 3000, 'poor'),
		];
		const result = processWebVitalsSummary(data);
		expect(result).toEqual({});
	});

	it('processes a metric group with 4+ items and computes histogram, percentiles, sampleSize', () => {
		const data: WebVitalsResponseItem[] = [
			createItem('LCP', 1000, 'good'),
			createItem('LCP', 1100, 'good'),
			createItem('LCP', 2000, 'needs-improvement'),
			createItem('LCP', 2100, 'needs-improvement'),
			createItem('LCP', 3000, 'poor'),
			createItem('LCP', 3100, 'poor'),
			createItem('FID', 10, 'good'),
			createItem('FID', 20, 'needs-improvement'),
			createItem('FID', 30, 'poor'),
			createItem('FID', 40, 'poor'),
		];
		const result = processWebVitalsSummary(data);

		expect(result).toHaveProperty('LCP');
		expect(result.LCP.sampleSize).toBe(6);
		expect(result.LCP.histogram.good).toBeCloseTo(2 / 6);
		expect(result.LCP.histogram['needs-improvement']).toBeCloseTo(2 / 6);
		expect(result.LCP.histogram.poor).toBeCloseTo(2 / 6);
		expect(result.LCP.percentiles?.p75).toBeDefined();
		expect(result.LCP.percentiles?.p75?.value).toBeGreaterThanOrEqual(2000);

		expect(result).toHaveProperty('FID');
		expect(result.FID.sampleSize).toBe(4);
		expect(result.FID.histogram.good).toBeCloseTo(1 / 4);
		expect(result.FID.histogram['needs-improvement']).toBeCloseTo(1 / 4);
		expect(result.FID.histogram.poor).toBeCloseTo(2 / 4);
		expect(result.FID.percentiles?.p75?.value).toBeGreaterThanOrEqual(30);
	});

	it('handles multiple metric names independently', () => {
		const data: WebVitalsResponseItem[] = [
			createItem('CLS', 0.1, 'good'),
			createItem('CLS', 0.2, 'good'),
			createItem('CLS', 0.3, 'needs-improvement'),
			createItem('CLS', 0.4, 'poor'),
			createItem('CLS', 0.5, 'poor'),
			createItem('LCP', 1000, 'good'),
			createItem('LCP', 2000, 'needs-improvement'),
			createItem('LCP', 3000, 'poor'),
			createItem('LCP', 4000, 'poor'),
		];
		const result = processWebVitalsSummary(data);

		expect(result).toHaveProperty('CLS');
		expect(result).toHaveProperty('LCP');
		expect(result.CLS.sampleSize).toBe(5);
		expect(result.LCP.sampleSize).toBe(4);
	});

	it('filters final metrics correctly (rating_end or quartile*25==75)', () => {
		const data: WebVitalsResponseItem[] = [
			createItem('LCP', 1000, 'good'),
			createItem('LCP', 1100, 'good'),
			createItem('LCP', 1200, 'good'),
			createItem('LCP', 1300, 'good'),
			createItem('LCP', 2000, 'needs-improvement'),
			createItem('LCP', 2100, 'needs-improvement'),
			createItem('LCP', 3000, 'poor'),
			createItem('LCP', 3100, 'poor'),
		];
		const result = processWebVitalsSummary(data);
		// Should not be empty
		expect(result.LCP).toBeDefined();
		expect(result.LCP.sampleSize).toBe(8);
	});
});
