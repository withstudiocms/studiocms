import { describe, expect, it } from 'vitest';
import {
	CoreWebVitalsMetricTypeSchema,
	MetricSummaryRowSchema,
	RouteSummaryRowSchema,
	WebVitalsMetricTypeSchema,
	WebVitalsRatingSchema,
} from '../../../src/integrations/webVitals/schemas';

describe('WebVitalsRatingSchema', () => {
	it('should parse valid ratings', () => {
		expect(WebVitalsRatingSchema.parse('good')).toBe('good');
		expect(WebVitalsRatingSchema.parse('needs-improvement')).toBe('needs-improvement');
		expect(WebVitalsRatingSchema.parse('poor')).toBe('poor');
	});

	it('should throw on invalid rating', () => {
		expect(() => WebVitalsRatingSchema.parse('excellent')).toThrow();
	});
});

describe('CoreWebVitalsMetricTypeSchema', () => {
	it('should parse valid core metrics', () => {
		expect(CoreWebVitalsMetricTypeSchema.parse('CLS')).toBe('CLS');
		expect(CoreWebVitalsMetricTypeSchema.parse('INP')).toBe('INP');
		expect(CoreWebVitalsMetricTypeSchema.parse('LCP')).toBe('LCP');
	});

	it('should throw on invalid core metric', () => {
		expect(() => CoreWebVitalsMetricTypeSchema.parse('FCP')).toThrow();
	});
});

describe('WebVitalsMetricTypeSchema', () => {
	it('should parse both core and additional metrics', () => {
		expect(WebVitalsMetricTypeSchema.parse('CLS')).toBe('CLS');
		expect(WebVitalsMetricTypeSchema.parse('INP')).toBe('INP');
		expect(WebVitalsMetricTypeSchema.parse('LCP')).toBe('LCP');
		expect(WebVitalsMetricTypeSchema.parse('FCP')).toBe('FCP');
		expect(WebVitalsMetricTypeSchema.parse('FID')).toBe('FID');
		expect(WebVitalsMetricTypeSchema.parse('TTFB')).toBe('TTFB');
	});

	it('should throw on invalid metric type', () => {
		expect(() => WebVitalsMetricTypeSchema.parse('XYZ')).toThrow();
	});
});

describe('RouteSummaryRowSchema', () => {
	it('should parse a valid route summary row', () => {
		const row = ['/home', 'CLS', 'good', 0.12, 100] as const;
		expect(RouteSummaryRowSchema.parse(row)).toEqual(row);
	});

	it('should throw if value is negative', () => {
		const row = ['/home', 'CLS', 'good', -1, 100] as const;
		expect(() => RouteSummaryRowSchema.parse(row)).toThrow();
	});

	it('should throw if sample size is not a number', () => {
		const row = ['/home', 'CLS', 'good', 0.12, 'many'];
		expect(() => RouteSummaryRowSchema.parse(row)).toThrow();
	});
});

describe('MetricSummaryRowSchema', () => {
	it('should parse a valid metric summary row', () => {
		const row = ['FCP', 'needs-improvement', 1.23, 0.45, 1, 95, 200] as const;
		const parsed = MetricSummaryRowSchema.parse(row);
		expect(parsed[0]).toBe('FCP');
		expect(parsed[1]).toBe('needs-improvement');
		expect(parsed[2]).toBe(1.23);
		expect(parsed[3]).toBe(0.45);
		expect(parsed[4]).toBe(true); // 1 transformed to true
		expect(parsed[5]).toBe(95);
		expect(parsed[6]).toBe(200);
	});

	it('should transform rating end 0 to false', () => {
		const row = ['FID', 'poor', 0.5, 0.1, 0, null, 50] as const;
		const parsed = MetricSummaryRowSchema.parse(row);
		expect(parsed[4]).toBe(false);
		expect(parsed[5]).toBeNull();
	});

	it('should throw if value or density is negative', () => {
		const row = ['TTFB', 'good', -0.1, 0.2, 1, 80, 10] as const;
		expect(() => MetricSummaryRowSchema.parse(row)).toThrow();

		const row2 = ['TTFB', 'good', 0.1, -0.2, 1, 80, 10] as const;
		expect(() => MetricSummaryRowSchema.parse(row2)).toThrow();
	});
});
