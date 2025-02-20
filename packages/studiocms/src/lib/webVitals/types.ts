import type { CoreWebVitalsMetricType, WebVitalsRating } from './schemas.js';

export type WebVitalsResponseItem = {
	id: string;
	pathname: string;
	route: string;
	name: string;
	value: number;
	rating: 'good' | 'needs-improvement' | 'poor';
	timestamp: Date;
	rating_end?: boolean;
	quartile?: number;
	quartile_end?: boolean;
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

export interface GetWebVitalsData {
	raw: Omit<WebVitalsResponseItem, 'rating_end' | 'quartile' | 'quartile_end'>[];
	routeSummary: WebVitalsRouteSummary[];
	summary: WebVitalsSummary;
	twentyFourHours: {
		summary: WebVitalsSummary;
		routeSummary: WebVitalsRouteSummary[];
	};
	sevenDays: {
		summary: WebVitalsSummary;
		routeSummary: WebVitalsRouteSummary[];
	};
	thirtyDays: {
		summary: WebVitalsSummary;
		routeSummary: WebVitalsRouteSummary[];
	};
}
