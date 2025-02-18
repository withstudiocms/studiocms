import { z } from "astro/zod";
import studioCMS_SDK from 'studiocms:sdk';
import { CoreWebVitalsMetricTypeSchema, WebVitalsRatingSchema, type CoreWebVitalsMetricType, type WebVitalsRating } from "./schemas.js";
import { WEB_VITALS_METRIC_TABLE } from "./consts.js";

interface MetricStats {
	value: number;
	rating: WebVitalsRating;
	sampleSize: number;
}
interface IntermediateWebVitalsRouteSummary {
	route: string;
	passingCoreWebVitals: boolean;
	metrics: Partial<Record<CoreWebVitalsMetricType, MetricStats>>;
}
interface WebVitalsRouteSummary extends IntermediateWebVitalsRouteSummary {
	metrics: Record<CoreWebVitalsMetricType, MetricStats>;
}

const RouteSummaryRowSchema = z.tuple([
	// route path
	z.string(),
	CoreWebVitalsMetricTypeSchema,
	WebVitalsRatingSchema,
	// value
	z.number().gte(0),
	// sample size
	z.number(),
]);

export async function useWebVitalsRouteSummaries({
    startDate,
    endDate,
  }: {
    startDate: Date;
    endDate: Date;
  }) {

    // Drizzle ORM's raw query execution
  const sqlQuery = `
  WITH MetricSummary AS (
    WITH BucketedMetric AS (
      SELECT DISTINCT
        ${WEB_VITALS_METRIC_TABLE}."route",
        ${WEB_VITALS_METRIC_TABLE}."name",
        ${WEB_VITALS_METRIC_TABLE}."rating",
        ${WEB_VITALS_METRIC_TABLE}."value",
        count(*) OVER MetricBucket AS metric_size,
        NTILE(4) OVER MetricBucket AS quartile
      FROM
        "${WEB_VITALS_METRIC_TABLE}"
      WHERE
        ${WEB_VITALS_METRIC_TABLE}."name" IN ("LCP", "CLS", "INP")
        AND ${WEB_VITALS_METRIC_TABLE}."timestamp" BETWEEN ? AND ?
      WINDOW
        MetricBucket AS (
          PARTITION BY ${WEB_VITALS_METRIC_TABLE}."route", ${WEB_VITALS_METRIC_TABLE}."name"
          ORDER BY ${WEB_VITALS_METRIC_TABLE}."route", ${WEB_VITALS_METRIC_TABLE}."name", ${WEB_VITALS_METRIC_TABLE}."rating", ${WEB_VITALS_METRIC_TABLE}."value"
        )
    )
    SELECT
      BucketedMetric."route",
      BucketedMetric."name",
      BucketedMetric."rating",
      BucketedMetric."value",
      BucketedMetric."quartile",
      MAX(BucketedMetric."metric_size") OVER MetricName as sample_size,
      CASE WHEN LEAD(1) OVER MetricQuartile IS NULL THEN TRUE ELSE FALSE END AS quartile_end
    FROM
      BucketedMetric
    WINDOW MetricName AS (
      PARTITION BY BucketedMetric."route", BucketedMetric."name"
      ORDER BY BucketedMetric."route", BucketedMetric."name"
    ),
    MetricQuartile AS (
      PARTITION BY BucketedMetric."route", BucketedMetric."name", BucketedMetric."quartile"
      ORDER BY BucketedMetric."route", BucketedMetric."name", BucketedMetric."quartile", BucketedMetric."value"
    )
  )
  SELECT
    MetricSummary."route",
    MetricSummary."name",
    MetricSummary."rating",
    MetricSummary."value",
    MetricSummary."sample_size"
  FROM
    MetricSummary
  WHERE
    MetricSummary."sample_size" >= 4
    AND MetricSummary."quartile_end" IS TRUE
    AND MetricSummary."quartile" IS 3
`;

    // @ts-expect-error - TS doesn't know about the `query` method on the db object.
    const result = await studioCMS_SDK.db.query(sqlQuery, [startDate.toISOString(), endDate.toISOString()]);


  const grouped: Record<string, IntermediateWebVitalsRouteSummary> = {};
  for (const row of result.rows) {
    const result = RouteSummaryRowSchema.safeParse(row);
    if (!result.success) continue;

    const [route, metric, rating, value, sampleSize] = result.data;
    // Initialize summary object for this route if needed.
    const routeData = (grouped[route] ||= { route, passingCoreWebVitals: true, metrics: {} });
    routeData.metrics[metric] = { rating, value, sampleSize };
    if (['LCP', 'CLS', 'INP'].includes(metric) && rating !== 'good') {
      routeData.passingCoreWebVitals = false;
    }
  }

  const routes: Array<WebVitalsRouteSummary> = Object.values(grouped)
    .filter((route): route is WebVitalsRouteSummary =>
      Boolean(route.metrics.CLS && route.metrics.LCP && route.metrics.INP),
    )
    .map((route) => {
      const score = simpleScore(
        route.metrics.LCP.rating,
        route.metrics.CLS.rating,
        route.metrics.INP.rating,
      );
      return { ...route, score };
    })
    .sort((a, b) => a.score - b.score);

  return routes;
  }

const weighting = { LCP: 0.4, CLS: 0.3, INP: 0.3 };
const scoring = { good: 1, 'needs-improvement': 0.5, poor: 0 };

const simpleScore = (
  lcpRating: WebVitalsRating,
  clsRating: WebVitalsRating,
  inpRating: WebVitalsRating,
) =>
  scoring[lcpRating] * weighting.LCP +
  scoring[clsRating] * weighting.CLS +
  scoring[inpRating] * weighting.INP;