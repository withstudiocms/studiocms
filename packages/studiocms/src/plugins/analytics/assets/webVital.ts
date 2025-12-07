/* v8 ignore start */
/*

  This file is ignored by v8 coverage as it contains imports from 'astro:db' and 'studiocms:sdk' which
  are not available outside of the Astro runtime with the `@astrojs/db` package installed.

*/

import config from 'studiocms:config';
import { runEffect } from '@withstudiocms/effect';
import { Effect, Schema } from 'effect';
import { getAnalyticsDbClient } from '#analytics/db-client';
import { StudioCMSMetricTable } from '../table.js';
import { EmptyReturn } from './consts.js';
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
 * Retrieves and processes web vitals metrics data from the analytics database.
 *
 * Fetches all web vitals metrics and organizes them into different time-based summaries:
 * - Last 24 hours
 * - Last 7 days
 * - Last 30 days
 *
 * Each time range includes both an overall summary and a route-specific summary of web vitals metrics.
 *
 * @returns {Promise<GetWebVitalsData>} A promise that resolves to an object containing:
 * - `raw`: All raw metrics data from the database
 * - `routeSummary`: Summary of metrics grouped by route
 * - `summary`: Overall summary of all metrics
 * - `twentyFourHours`: Metrics and summaries for the last 24 hours
 * - `sevenDays`: Metrics and summaries for the last 7 days
 * - `thirtyDays`: Metrics and summaries for the last 30 days
 *
 * @throws Returns `EmptyReturn` if an error occurs during execution
 *
 * @example
 * ```typescript
 * const vitals = await getWebVitals();
 * console.log(vitals.summary); // Overall web vitals summary
 * console.log(vitals.twentyFourHours.routeSummary); // Route-specific metrics for last 24 hours
 * ```
 */
export async function getWebVitals(): Promise<GetWebVitalsData> {
	const program = Effect.gen(function* () {
		// Get the analytics database client
		const dbClient = yield* getAnalyticsDbClient(config.db.dialect);

		/**
		 * Fetches all web vitals metrics from the database.
		 */
		const getMetrics = dbClient.withDecoder({
			decoder: Schema.Array(StudioCMSMetricTable.Select),
			callbackFn: (client) =>
				client((db) => db.selectFrom('StudioCMSMetric').selectAll().execute()),
		});

		// Fetch all metrics
		const raw = yield* getMetrics();

		// Filter data for different time ranges
		const last24HoursData = raw.filter((item) => checkDate(item.timestamp).isInLast24Hours());
		const last7DaysData = raw.filter((item) => checkDate(item.timestamp).isInLast7Days());
		const last30DaysData = raw.filter((item) => checkDate(item.timestamp).isInLast30Days());

		// Process summaries and route summaries
		const routeSummary = processWebVitalsRouteSummary(raw as WebVitalsResponseItem[]);
		const summary = processWebVitalsSummary(raw as WebVitalsResponseItem[]);

		// Process time range specific summaries
		const twentyFourHours = {
			summary: processWebVitalsSummary(last24HoursData),
			routeSummary: processWebVitalsRouteSummary(last24HoursData),
		};

		// Process 7 days summary
		const sevenDays = {
			summary: processWebVitalsSummary(last7DaysData),
			routeSummary: processWebVitalsRouteSummary(last7DaysData),
		};

		// Process 30 days summary
		const thirtyDays = {
			summary: processWebVitalsSummary(last30DaysData),
			routeSummary: processWebVitalsRouteSummary(last30DaysData),
		};

		return {
			raw,
			routeSummary,
			summary,
			twentyFourHours,
			sevenDays,
			thirtyDays,
		} as GetWebVitalsData;
	});

	try {
		return await runEffect(program);
	} catch (_error) {
		return EmptyReturn;
	}
}
/* v8 ignore stop */
