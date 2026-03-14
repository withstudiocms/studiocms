import type { CoreWebVitalsMetricType, WebVitalsRating } from './schemas.js';

/**
 * Represents a single web vitals response item.
 *
 * @property {string} id - The unique identifier for the web vitals response item.
 * @property {string} pathname - The pathname of the web page.
 * @property {string} route - The route of the web page.
 * @property {string} name - The name of the web vital metric.
 * @property {number} value - The value of the web vital metric.
 * @property {'good' | 'needs-improvement' | 'poor'} rating - The rating of the web vital metric.
 * @property {Date} timestamp - The timestamp when the web vital metric was recorded.
 * @property {boolean} [rating_end] - Optional flag indicating if the rating is final.
 * @property {number} [quartile] - Optional quartile value of the web vital metric.
 * @property {boolean} [quartile_end] - Optional flag indicating if the quartile value is final.
 */
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

/**
 * Represents a summary of web vitals metrics.
 */
export interface WebVitalsMetricSummary {
	/**
	 * A histogram that maps each web vitals rating to a number.
	 */
	histogram: Record<WebVitalsRating, number>;

	/**
	 * An object containing percentiles, specifically the 75th percentile (p75),
	 * with its value and corresponding web vitals rating.
	 */
	percentiles: Partial<Record<'p75', { value: number; rating: WebVitalsRating }>>;

	/**
	 * The size of the sample used to calculate the metrics.
	 */
	sampleSize: number;
}

/**
 * This type is a record where the keys are strings representing the names of the metrics,
 * and the values are `WebVitalsMetricSummary` objects containing the summary details for each metric.
 */
export type WebVitalsSummary = Record<string, WebVitalsMetricSummary>;

/**
 * Represents the statistics of a web vital metric.
 */
export interface MetricStats {
	value: number;
	rating: WebVitalsRating;
	sampleSize: number;
}

/**
 * Represents a summary of web vitals for a specific route.
 */
export interface IntermediateWebVitalsRouteSummary {
	/**
	 * The route for which the web vitals are summarized.
	 */
	route: string;

	/**
	 * Indicates whether the core web vitals for the route are passing.
	 */
	passingCoreWebVitals: boolean;

	/**
	 * A partial record of core web vitals metrics and their statistics.
	 */
	metrics: Partial<Record<CoreWebVitalsMetricType, MetricStats>>;

	score: number;
}

/**
 * Represents a summary of web vitals metrics for a specific route.
 * Extends the `IntermediateWebVitalsRouteSummary` interface.
 *
 * @interface WebVitalsRouteSummary
 * @extends {IntermediateWebVitalsRouteSummary}
 *
 * @property {Record<CoreWebVitalsMetricType, MetricStats>} metrics -
 * A record of core web vitals metrics and their corresponding statistics.
 */
export interface WebVitalsRouteSummary extends IntermediateWebVitalsRouteSummary {
	metrics: Record<CoreWebVitalsMetricType, MetricStats>;
}

/**
 * Interface representing the data structure for web vitals.
 */
export interface GetWebVitalsData {
	/**
	 * Array of raw web vitals data items, excluding 'rating_end', 'quartile', and 'quartile_end' properties.
	 */
	raw: Omit<WebVitalsResponseItem, 'rating_end' | 'quartile' | 'quartile_end'>[];

	/**
	 * Summary of web vitals data for different routes.
	 */
	routeSummary: WebVitalsRouteSummary[];

	/**
	 * Overall summary of web vitals data.
	 */
	summary: WebVitalsSummary;

	/**
	 * Web vitals data for the last 24 hours.
	 */
	twentyFourHours: {
		/**
		 * Summary of web vitals data for the last 24 hours.
		 */
		summary: WebVitalsSummary;

		/**
		 * Summary of web vitals data for different routes in the last 24 hours.
		 */
		routeSummary: WebVitalsRouteSummary[];
	};

	/**
	 * Web vitals data for the last 7 days.
	 */
	sevenDays: {
		/**
		 * Summary of web vitals data for the last 7 days.
		 */
		summary: WebVitalsSummary;

		/**
		 * Summary of web vitals data for different routes in the last 7 days.
		 */
		routeSummary: WebVitalsRouteSummary[];
	};

	/**
	 * Web vitals data for the last 30 days.
	 */
	thirtyDays: {
		/**
		 * Summary of web vitals data for the last 30 days.
		 */
		summary: WebVitalsSummary;

		/**
		 * Summary of web vitals data for different routes in the last 30 days.
		 */
		routeSummary: WebVitalsRouteSummary[];
	};
}
