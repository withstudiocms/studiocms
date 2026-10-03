import { Schema } from 'effect';
import { RatingSchema } from '../schemas.js';

/**
 * Enum schema for Web Vitals rating.
 *
 * This schema defines the possible ratings for Web Vitals:
 * - 'good': Indicates that the web vitals are performing well.
 * - 'needs-improvement': Indicates that the web vitals need improvement.
 * - 'poor': Indicates that the web vitals are performing poorly.
 */
export const WebVitalsRatingSchema = RatingSchema;

/**
 * Type representing the inferred type of the WebVitalsRatingSchema.
 * This type is generated using the `z.infer` utility from the `zod` library.
 */
export type WebVitalsRating = typeof RatingSchema.Type;

/**
 * Enum schema for Core Web Vitals metric types.
 *
 * This schema defines the allowed values for Core Web Vitals metrics:
 * - `CLS`: Cumulative Layout Shift
 * - `INP`: Interaction to Next Paint
 * - `LCP`: Largest Contentful Paint
 *
 * These metrics are used to measure the performance and user experience of web pages.
 */
export const CoreWebVitalsMetricTypeSchema = Schema.Literal('CLS', 'INP', 'LCP');

/**
 * Type definition for Core Web Vitals metrics.
 *
 * This type is inferred from the `CoreWebVitalsMetricTypeSchema` schema using Zod.
 * It represents the structure of the core web vitals metrics used in the application.
 *
 */
export type CoreWebVitalsMetricType = typeof CoreWebVitalsMetricTypeSchema.Type;

/**
 * Schema for Web Vitals Metric Types.
 *
 * This schema combines the `CoreWebVitalsMetricTypeSchema` with an enumeration
 * of additional metric types: 'FCP', 'FID', and 'TTFB'.
 *
 * - `FCP`: First Contentful Paint
 * - `FID`: First Input Delay
 * - `TTFB`: Time to First Byte
 */
export const WebVitalsMetricTypeSchema = Schema.Union(
	CoreWebVitalsMetricTypeSchema,
	Schema.Literal('FCP', 'FID', 'TTFB')
);

/**
 * Represents the type for Web Vitals metrics.
 *
 * This type is inferred from the `WebVitalsMetricTypeSchema` using Zod's `infer` utility.
 * It is used to ensure that the metrics conform to the schema defined for Web Vitals.
 *
 * @see WebVitalsMetricTypeSchema
 */
export type WebVitalsMetricType = typeof WebVitalsMetricTypeSchema.Type;

/**
 * Schema for summarizing route metrics.
 *
 * This schema defines a tuple with the following elements:
 * 1. Route path (string)
 * 2. Core web vitals metric type (CoreWebVitalsMetricTypeSchema)
 * 3. Web vitals rating (WebVitalsRatingSchema)
 * 4. Value (number, must be greater than or equal to 0)
 * 5. Sample size (number)
 */
export const RouteSummaryRowSchema = Schema.Tuple(
	// route path
	Schema.String,
	CoreWebVitalsMetricTypeSchema,
	WebVitalsRatingSchema,
	// value
	Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
	// sample size
	Schema.Number
);

/**
 * Type representing a summary row of route metrics.
 */
export const RatingEndSchema = Schema.transform(Schema.Literal(0, 1), Schema.Boolean, {
	strict: true,
	decode: (input) => input === 1,
	encode: (input) => (input ? 1 : 0),
});

/**
 * Schema for a summary row of web vitals metrics.
 *
 * The tuple consists of:
 * - `WebVitalsMetricTypeSchema`: The type of web vitals metric.
 * - `WebVitalsRatingSchema`: The rating of the web vitals metric.
 * - `value`: A number representing the value of the metric, must be greater than or equal to 0.
 * - `density`: A number representing the density of the metric, must be greater than or equal to 0.
 * - `rating end`: A boolean indicating the end of the rating, derived from a union of 0 and 1.
 * - `percentile`: A number representing the percentile of the metric, or null.
 * - `sample size`: A number representing the sample size.
 */
export const MetricSummaryRowSchema = Schema.Tuple(
	WebVitalsMetricTypeSchema,
	WebVitalsRatingSchema,
	// value
	Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
	// density
	Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
	// rating end
	RatingEndSchema,
	// percentile
	Schema.NullOr(Schema.Number),
	// sample size
	Schema.Number
);
