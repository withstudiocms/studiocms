/* v8 ignore start */
/*

  This file is ignored by v8 coverage as it contains imports from 'astro:db' which
  are not available outside of the Astro runtime with the `@astrojs/db` package installed.

*/
import type { WebVitalsMetricType } from './schemas.js';
import type { GetWebVitalsData } from './types.js';

/**
 * List of core web vitals metrics.
 */
export const CoreWebVitals: WebVitalsMetricType[] = ['LCP', 'CLS', 'INP'];

/**
 * Labels for Web Vitals metrics.
 *
 * This object maps each Web Vitals metric type to its corresponding human-readable label.
 *
 * @constant
 * @type {Record<WebVitalsMetricType, string>}
 */
export const WEB_VITALS_METRIC_LABELS: Record<WebVitalsMetricType, string> = {
	LCP: 'Largest Contentful Paint',
	INP: 'Interaction to Next Paint',
	CLS: 'Cumulative Layout Shift',
	FCP: 'First Contentful Paint',
	FID: 'First Input Delay',
	TTFB: 'Time to First Byte',
};

/**
 * An object representing the default empty return value for web vitals data.
 *
 * @constant
 * @type {GetWebVitalsData}
 *
 * @property {Array} raw - An empty array representing raw web vitals data.
 * @property {Array} routeSummary - An empty array representing route summary data.
 * @property {Object} summary - An empty object representing the summary of web vitals data.
 * @property {Object} twentyFourHours - An object representing web vitals data for the last 24 hours.
 * @property {Object} twentyFourHours.summary - An empty object representing the summary of web vitals data for the last 24 hours.
 * @property {Array} twentyFourHours.routeSummary - An empty array representing route summary data for the last 24 hours.
 * @property {Object} sevenDays - An object representing web vitals data for the last 7 days.
 * @property {Object} sevenDays.summary - An empty object representing the summary of web vitals data for the last 7 days.
 * @property {Array} sevenDays.routeSummary - An empty array representing route summary data for the last 7 days.
 * @property {Object} thirtyDays - An object representing web vitals data for the last 30 days.
 * @property {Object} thirtyDays.summary - An empty object representing the summary of web vitals data for the last 30 days.
 * @property {Array} thirtyDays.routeSummary - An empty array representing route summary data for the last 30 days.
 */
export const EmptyReturn: GetWebVitalsData = {
	raw: [],
	routeSummary: [],
	summary: {},
	twentyFourHours: { summary: {}, routeSummary: [] },
	sevenDays: { summary: {}, routeSummary: [] },
	thirtyDays: { summary: {}, routeSummary: [] },
};
/* v8 ignore stop */
