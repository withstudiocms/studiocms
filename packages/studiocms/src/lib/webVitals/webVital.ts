import { db } from 'astro:db';
import { tsMetric, WEB_VITALS_METRIC_TABLE } from './consts.js';

export * from './webVitalsRouteSummary.js';
export * from './webVitalsSummary.js';

export type WebVitalsResponseItem = {
	id: string;
	pathname: string;
	route: string;
	name: string;
	value: number;
	rating: string;
	timestamp: Date;
};

export async function getWebVitals(): Promise<WebVitalsResponseItem[]> {
	try {
		const AstroDB = await import('astro:db');

		if (WEB_VITALS_METRIC_TABLE in AstroDB) {
			if (AstroDB.AstrojsWebVitals_Metric) {
				const webVitals = await db.select().from(tsMetric);
				return webVitals as WebVitalsResponseItem[];
			}
		}
	} catch (error) {
		return [] as WebVitalsResponseItem[];
	}

	return [] as WebVitalsResponseItem[];
}
