import { db } from 'astro:db';
import { tsMetric, WEB_VITALS_METRIC_TABLE } from './consts.js';
import type { WebVitalsResponseItem, IntermediateWebVitalsRouteSummary, MetricStats, WebVitalsMetricSummary, WebVitalsRouteSummary, WebVitalsSummary } from './types.js';
import { getWebVitalsRouteSummaries } from './webVitalsRouteSummary.js';
import { getWebVitalsSummary } from './webVitalsSummary.js';

export { getWebVitalsRouteSummaries, getWebVitalsSummary };
export type { WebVitalsResponseItem, IntermediateWebVitalsRouteSummary, MetricStats, WebVitalsMetricSummary, WebVitalsRouteSummary, WebVitalsSummary };

export async function getWebVitals(): Promise<WebVitalsResponseItem[]> {
	try {
		const AstroDB = await import('astro:db');

		if (WEB_VITALS_METRIC_TABLE in AstroDB) {
			if (AstroDB.AstrojsWebVitals_Metric) {
				const webVitals = await db.select().from(tsMetric);
				return webVitals as WebVitalsResponseItem[];
			}
		}
	} catch (error) {
		return [] as WebVitalsResponseItem[];
	}

	return [] as WebVitalsResponseItem[];
}
