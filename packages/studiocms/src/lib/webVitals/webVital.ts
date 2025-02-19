import studioCMS_SDK from 'studiocms:sdk';
import { WEB_VITALS_METRIC_TABLE, tsMetric } from './consts.js';
import type {
	IntermediateWebVitalsRouteSummary,
	MetricStats,
	WebVitalsMetricSummary,
	WebVitalsResponseItem,
	WebVitalsRouteSummary,
	WebVitalsSummary,
} from './types.js';

export type {
	WebVitalsResponseItem,
	IntermediateWebVitalsRouteSummary,
	MetricStats,
	WebVitalsMetricSummary,
	WebVitalsRouteSummary,
	WebVitalsSummary,
};

export async function getWebVitals(): Promise<WebVitalsResponseItem[]> {
	try {
		const AstroDB = await import('astro:db');

		if (WEB_VITALS_METRIC_TABLE in AstroDB) {
			if (AstroDB.AstrojsWebVitals_Metric) {
				const webVitals = await studioCMS_SDK.db.select().from(tsMetric);
				return webVitals as WebVitalsResponseItem[];
			}
		}
	} catch (error) {
		return [] as WebVitalsResponseItem[];
	}

	return [] as WebVitalsResponseItem[];
}
