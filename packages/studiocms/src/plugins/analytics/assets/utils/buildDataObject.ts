import type { WebVitalsResponseItem } from '../types.js';
import { checkDate } from './checkDate.js';

export type BuildDataObject = {
	historicalData: WebVitalsResponseItem[];
	last24HoursData: WebVitalsResponseItem[];
	last7DaysData: WebVitalsResponseItem[];
	last30DaysData: WebVitalsResponseItem[];
};

/**
 * Builds a data object categorizing web vital data into historical and specific time ranges.
 *
 * @param {WebVitalsResponseItem[]} webVitalData - The array of web vitals data items.
 * @param {string} collect - The specific web vital metric to filter by (e.g., 'LCP', 'CLS', 'INP').
 * @returns {BuildDataObject} An object containing categorized web vitals data.
 */
export function buildDataObject(
	webVitalData: WebVitalsResponseItem[],
	collect: string
): BuildDataObject {
	const data: BuildDataObject = {
		historicalData: [],
		last24HoursData: [],
		last7DaysData: [],
		last30DaysData: [],
	};

	for (const item of webVitalData) {
		const { name, timestamp } = item;

		if (name === collect) {
			data.historicalData.push(item);

			if (checkDate(timestamp).isInLast24Hours()) {
				data.last24HoursData.push(item);
			}

			if (checkDate(timestamp).isInLast7Days()) {
				data.last7DaysData.push(item);
			}

			if (checkDate(timestamp).isInLast30Days()) {
				data.last30DaysData.push(item);
			}
		}
	}

	return data;
}
