import type { CoreWebVitalsMetricType, WebVitalsRating } from "./schemas.js";

export type WebVitalsResponseItem = {
    id: string;
    pathname: string;
    route: string;
    name: string;
    value: number;
    rating: string;
    timestamp: Date;
};

export interface WebVitalsMetricSummary {
    histogram: Record<WebVitalsRating, number>;
    percentiles: Partial<Record<'p75', { value: number; rating: WebVitalsRating }>>;
    sampleSize: number;
}

export type WebVitalsSummary = Record<string, WebVitalsMetricSummary>;

export interface MetricStats {
    value: number;
    rating: WebVitalsRating;
    sampleSize: number;
}

export interface IntermediateWebVitalsRouteSummary {
    route: string;
    passingCoreWebVitals: boolean;
    metrics: Partial<Record<CoreWebVitalsMetricType, MetricStats>>;
}

export interface WebVitalsRouteSummary extends IntermediateWebVitalsRouteSummary {
    metrics: Record<CoreWebVitalsMetricType, MetricStats>;
}