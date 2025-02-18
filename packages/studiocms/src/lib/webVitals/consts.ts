import type { WebVitalsMetricType } from "./schemas.js";
import { asDrizzleTable } from '@astrojs/db/utils';
import { column, defineTable } from 'astro:db';

export const WEB_VITALS_METRIC_TABLE = 'AstrojsWebVitals_Metric';

export const WEB_VITALS_METRIC_LABELS: Record<WebVitalsMetricType, string> = {
	LCP: 'Largest Contentful Paint',
	INP: 'Interaction to Next Paint',
	CLS: 'Cumulative Layout Shift',
	FCP: 'First Contentful Paint',
	FID: 'First Input Delay',
	TTFB: 'Time to First Byte',
};

// Table definition from `@astrojs/web-vitals` db-config
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