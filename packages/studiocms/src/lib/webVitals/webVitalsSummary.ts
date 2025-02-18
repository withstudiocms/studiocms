import studioCMS_SDK from 'studiocms:sdk';
import { WEB_VITALS_METRIC_TABLE } from './consts.js';
import { MetricSummaryRowSchema, type WebVitalsMetricType } from './schemas.js';
import type { WebVitalsSummary } from './types.js';

/**
 * Fetches a summary of web vitals data for the given date range.
 * 
 * @param startDate - The start date of the date range.
 * @param endDate - The end date of the date range.
 * @param metrics - The web vitals metrics to include in the summary.
 * 
 * Returns a record with metric acronyms as keys (`CLS`, `LCP`, etc.) and an object with
 * `histogram`, `percentiles`, and `sampleSize` keys, e.g.
 *
 * ```js
 * CLS: {
 *   "histogram": { "good": 0.6, "needs-improvement": 0.2, "poor": 0.2 },
 *   "percentiles": {
 *     "p75": { "value": 2800, "rating": "needs-improvement" }
 *   },
 *   "sampleSize": 56
 * },
 * ```
 */
export async function getWebVitalsSummary({
  startDate,
  endDate,
  metrics = ['LCP', 'CLS', 'INP'],
}: {
  startDate: Date;
  endDate: Date;
  metrics?: WebVitalsMetricType[];
}) {
  const metricArray = metrics.map((name) => '"' + name + '"').join(',');
  
  const sqlQuery = `
  WITH MetricSummary AS (
    WITH BucketedMetric AS (
      SELECT DISTINCT
        ${WEB_VITALS_METRIC_TABLE}."name",
        ${WEB_VITALS_METRIC_TABLE}."rating",
        ${WEB_VITALS_METRIC_TABLE}."value",
        count(*) OVER MetricRatingBucket AS rating_size,
        count(*) OVER MetricBucket AS metric_size,
        NTILE(4) OVER MetricBucket AS quartile,
        CASE WHEN LEAD(1) OVER MetricRatingBucket IS NULL THEN TRUE ELSE FALSE END AS rating_end
      FROM
        "${WEB_VITALS_METRIC_TABLE}"
      WHERE
        ${WEB_VITALS_METRIC_TABLE}."timestamp" BETWEEN ? AND ?
        AND ${WEB_VITALS_METRIC_TABLE}."name" IN (${metricArray})
      WINDOW
        MetricBucket AS (
          PARTITION BY ${WEB_VITALS_METRIC_TABLE}."name"
          ORDER BY ${WEB_VITALS_METRIC_TABLE}."name", ${WEB_VITALS_METRIC_TABLE}.rating, ${WEB_VITALS_METRIC_TABLE}."value"
        ),
        MetricRatingBucket AS (
          PARTITION BY ${WEB_VITALS_METRIC_TABLE}."name", ${WEB_VITALS_METRIC_TABLE}."rating"
          ORDER BY ${WEB_VITALS_METRIC_TABLE}."name", ${WEB_VITALS_METRIC_TABLE}."rating", ${WEB_VITALS_METRIC_TABLE}."value"
        )
    )
    SELECT
      BucketedMetric."name",
      BucketedMetric."rating",
      BucketedMetric."value",
      BucketedMetric."rating_size" / CAST(MAX(BucketedMetric."metric_size") OVER MetricName AS REAL) as density,
      BucketedMetric."rating_end",
      CASE WHEN LEAD(1) OVER MetricQuartile IS NULL THEN BucketedMetric."quartile" * 25 ELSE NULL END AS percentile,
      MAX(BucketedMetric."metric_size") OVER MetricName as sample_size
    FROM
      BucketedMetric
    GROUP BY BucketedMetric."name", BucketedMetric."rating", BucketedMetric."rating_end", BucketedMetric."quartile"
    WINDOW MetricName AS (
      PARTITION BY BucketedMetric."name"
      ORDER by BucketedMetric."name"
    ),
    MetricQuartile AS (
      PARTITION BY BucketedMetric."name", BucketedMetric."quartile"
      ORDER by BucketedMetric."name", BucketedMetric."quartile", BucketedMetric."value"
    )
  )
  SELECT
    *
  FROM
    MetricSummary
  WHERE
    MetricSummary."sample_size" >= 4
    AND (
      MetricSummary."percentile" IS 75
      OR MetricSummary."rating_end" IS TRUE
    )
`;

    // @ts-expect-error - TS doesn't know about the `query` method on the db object.
    const result = await studioCMS_SDK.db.query(sqlQuery, [startDate.toISOString(), endDate.toISOString()]);

    const summary: WebVitalsSummary = {};

    for (const row of result.rows) {
        const result = MetricSummaryRowSchema.safeParse(row);
        if (!result.success) continue;
    
        const [name, rating, value, density, rating_end, percentile, sampleSize] = result.data;
        // Initialize summary object for this metric if needed.
        const metric = (summary[name] ||= {
          histogram: { good: 0, 'needs-improvement': 0, poor: 0 },
          percentiles: {},
          sampleSize,
        });
        // Update metric data
        if (percentile === 75) metric.percentiles.p75 = { value, rating };
        if (rating_end) metric.histogram[rating] = density;
      }
    
      return summary;
}