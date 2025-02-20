import studioCMS_SDK from 'studiocms:sdk';
import { EmptyReturn, WEB_VITALS_METRIC_TABLE, tsMetric } from './consts.js';
import type {
	GetWebVitalsData,
	IntermediateWebVitalsRouteSummary,
	MetricStats,
	WebVitalsMetricSummary,
	WebVitalsResponseItem,
	WebVitalsRouteSummary,
	WebVitalsSummary,
} from './types.js';
import { checkDate } from './utils/checkDate.js';
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

export async function getWebVitals(): Promise<GetWebVitalsData> {
	try {
		const AstroDB = await import('astro:db');

		if (WEB_VITALS_METRIC_TABLE in AstroDB) {
			if (AstroDB.AstrojsWebVitals_Metric) {
				const raw = (await studioCMS_SDK.db.select().from(tsMetric)) as WebVitalsResponseItem[];

				const last24HoursData = raw.filter((item) => checkDate(item.timestamp).isInLast24Hours());
				const last7DaysData = raw.filter((item) => checkDate(item.timestamp).isInLast7Days());
				const last30DaysData = raw.filter((item) => checkDate(item.timestamp).isInLast30Days());

				const routeSummary = processWebVitalsRouteSummary(raw as WebVitalsResponseItem[]);
				const summary = processWebVitalsSummary(raw as WebVitalsResponseItem[]);

				const twentyFourHours = {
					summary: processWebVitalsSummary(last24HoursData),
					routeSummary: processWebVitalsRouteSummary(last24HoursData),
				};

				const sevenDays = {
					summary: processWebVitalsSummary(last7DaysData),
					routeSummary: processWebVitalsRouteSummary(last7DaysData),
				};

				const thirtyDays = {
					summary: processWebVitalsSummary(last30DaysData),
					routeSummary: processWebVitalsRouteSummary(last30DaysData),
				};

				return { raw, routeSummary, summary, twentyFourHours, sevenDays, thirtyDays };
			}

			return EmptyReturn;
		}

		return EmptyReturn;
	} catch (error) {
		return EmptyReturn;
	}
}
