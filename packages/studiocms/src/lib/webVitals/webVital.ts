import { SDKCoreJs } from 'studiocms:sdk';
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

/**
 * Fetches web vitals data from the Astro database.
 *
 * @returns {Promise<GetWebVitalsData>} A promise that resolves to an object containing web vitals data.
 *
 * The returned object contains the following properties:
 * - `raw`: The raw web vitals data.
 * - `routeSummary`: A summary of web vitals data by route.
 * - `summary`: A general summary of web vitals data.
 * - `twentyFourHours`: An object containing web vitals data for the last 24 hours, with `summary` and `routeSummary` properties.
 * - `sevenDays`: An object containing web vitals data for the last 7 days, with `summary` and `routeSummary` properties.
 * - `thirtyDays`: An object containing web vitals data for the last 30 days, with `summary` and `routeSummary` properties.
 *
 * If the web vitals metric table is not found in the Astro database, or if an error occurs, an empty return object is returned.
 *
 * @throws {Error} If there is an issue with fetching or processing the web vitals data.
 */
export async function getWebVitals(): Promise<GetWebVitalsData> {
	try {
		const AstroDB = await import('astro:db');

		if (WEB_VITALS_METRIC_TABLE in AstroDB) {
			if (AstroDB.AstrojsWebVitals_Metric) {
				const raw = (await SDKCoreJs.db.select().from(tsMetric)) as WebVitalsResponseItem[];

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
