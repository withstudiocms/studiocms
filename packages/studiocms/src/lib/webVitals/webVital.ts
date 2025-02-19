import studioCMS_SDK from 'studiocms:sdk';
import { WEB_VITALS_METRIC_TABLE, tsMetric } from './consts.js';
import type {
	GetWebVitalsData,
	IntermediateWebVitalsRouteSummary,
	MetricStats,
	WebVitalsMetricSummary,
	WebVitalsResponseItem,
	WebVitalsRouteSummary,
	WebVitalsSummary,
} from './types.js';
import { processWebVitalsRouteSummary } from './webVitalsRouteSummary.js';
import { processWebVitalsSummary } from './webVitalsSummary.js';

export type {
	WebVitalsResponseItem,
	IntermediateWebVitalsRouteSummary,
	MetricStats,
	WebVitalsMetricSummary,
	WebVitalsRouteSummary,
	WebVitalsSummary,
	GetWebVitalsData,
};

export { processWebVitalsRouteSummary, processWebVitalsSummary };

export async function getWebVitals(): Promise<GetWebVitalsData> {
	try {
		const AstroDB = await import('astro:db');

		if (WEB_VITALS_METRIC_TABLE in AstroDB) {
			if (AstroDB.AstrojsWebVitals_Metric) {
				const raw = (await studioCMS_SDK.db.select().from(tsMetric)) as WebVitalsResponseItem[];

				const routeSummary = processWebVitalsRouteSummary(raw as WebVitalsResponseItem[]);
				const summary = processWebVitalsSummary(raw as WebVitalsResponseItem[]);

				return { raw, routeSummary, summary };
			}

			return { raw: [], routeSummary: [], summary: {} };
		}

		return { raw: [], routeSummary: [], summary: {} };
	} catch (error) {
		return { raw: [], routeSummary: [], summary: {} };
	}
}
