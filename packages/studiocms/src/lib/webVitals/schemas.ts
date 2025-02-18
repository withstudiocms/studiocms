import { z } from "astro/zod";

export const WebVitalsRatingSchema = z.enum(['good', 'needs-improvement', 'poor']);
export type WebVitalsRating = z.infer<typeof WebVitalsRatingSchema>;

export const CoreWebVitalsMetricTypeSchema = z.enum(['CLS', 'INP', 'LCP']);
export type CoreWebVitalsMetricType = z.infer<typeof CoreWebVitalsMetricTypeSchema>;

export const WebVitalsMetricTypeSchema = CoreWebVitalsMetricTypeSchema.or(
	z.enum(['FCP', 'FID', 'TTFB']),
);
export type WebVitalsMetricType = z.infer<typeof WebVitalsMetricTypeSchema>;