import { z } from "astro/zod";

export const WebVitalsRatingSchema = z.enum(['good', 'needs-improvement', 'poor']);
export type WebVitalsRating = z.infer<typeof WebVitalsRatingSchema>;

export const CoreWebVitalsMetricTypeSchema = z.enum(['CLS', 'INP', 'LCP']);
export type CoreWebVitalsMetricType = z.infer<typeof CoreWebVitalsMetricTypeSchema>;

export const WebVitalsMetricTypeSchema = CoreWebVitalsMetricTypeSchema.or(
	z.enum(['FCP', 'FID', 'TTFB']),
);
export type WebVitalsMetricType = z.infer<typeof WebVitalsMetricTypeSchema>;

export const RouteSummaryRowSchema = z.tuple([
	// route path
	z.string(),
	CoreWebVitalsMetricTypeSchema,
	WebVitalsRatingSchema,
	// value
	z.number().gte(0),
	// sample size
	z.number(),
]);

export const MetricSummaryRowSchema = z.tuple([
	WebVitalsMetricTypeSchema,
	WebVitalsRatingSchema,
	// value
	z.number().gte(0),
	// density
	z.number().gte(0),
	// rating end
	z.union([z.literal(0), z.literal(1)]).transform(Boolean),
	// percentile
	z.number().or(z.null()),
	// sample size
	z.number(),
]);