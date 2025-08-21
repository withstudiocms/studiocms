import { column, defineTable } from 'astro:db';
import { asDrizzleTable } from '@astrojs/db/utils';
import type { WebVitalsMetricType } from './schemas.js';
import type { GetWebVitalsData } from './types.js';

export const WEB_VITALS_METRIC_TABLE = 'AstrojsWebVitals_Metric';

export const CoreWebVitals: WebVitalsMetricType[] = ['LCP', 'CLS', 'INP'];

export const WEB_VITALS_METRIC_LABELS: Record<WebVitalsMetricType, string> = {
	LCP: 'Largest Contentful Paint',
	INP: 'Interaction to Next Paint',
	CLS: 'Cumulative Layout Shift',
	FCP: 'First Contentful Paint',
	FID: 'First Input Delay',
	TTFB: 'Time to First Byte',
};

const Metric = defineTable({
	columns: {
		pathname: column.text(),
		route: column.text(),
		name: column.text(),
		id: column.text({ primaryKey: true }),
		value: column.number(),
		rating: column.text(),
		timestamp: column.date(),
	},
	deprecated: Boolean(process.env.DEPRECATE_WEB_VITALS) ?? false,
});

export const tsMetric = asDrizzleTable(WEB_VITALS_METRIC_TABLE, Metric);

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
