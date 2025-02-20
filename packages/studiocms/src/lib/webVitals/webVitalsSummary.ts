import type { WebVitalsRating } from './schemas.js';
import type { WebVitalsResponseItem, WebVitalsSummary } from './types.js';

/**
 * Processes an array of Web Vitals data, replicating SQL logic.
 */
export function processWebVitalsSummary(data: WebVitalsResponseItem[]): WebVitalsSummary {
	// Step 1: Group by `name`
	const grouped: Record<string, WebVitalsResponseItem[]> = data.reduce(
		(acc, item) => {
			if (!acc[item.name]) acc[item.name] = [];
			acc[item.name].push(item);
			return acc;
		},
		{} as Record<string, WebVitalsResponseItem[]>
	);

	const summary: WebVitalsSummary = {};

	// Step 2: Process each metric separately
	for (const [metricName, metrics] of Object.entries(grouped)) {
		if (metrics.length < 4) continue; // Ensure sample_size >= 4

		// Step 3: Sort within the group
		metrics.sort((a, b) => a.rating.localeCompare(b.rating) || a.value - b.value);

		// Step 4: Assign quartiles (NTILE(4) logic)
		const quartileSize = Math.ceil(metrics.length / 4);
		for (let i = 0; i < metrics.length; i++) {
			metrics[i].quartile = Math.floor(i / quartileSize) + 1; // 1-based quartile index
		}

		// Step 5: Identify `rating_end`
		for (let i = 0; i < metrics.length; i++) {
			const nextItem = metrics[i + 1];
			metrics[i].rating_end = !nextItem || nextItem.rating !== metrics[i].rating;
		}

		// Step 6: Compute sample size
		const sampleSize = metrics.length;

		// Step 7: Compute histogram densities
		const histogram: Record<WebVitalsRating, number> = {
			good: 0,
			'needs-improvement': 0,
			poor: 0,
		};

		for (let i = 0; i < metrics.length; i++) {
			if (metrics[i].rating_end) {
				const ratingCount = metrics.filter((m) => m.rating === metrics[i].rating).length;
				histogram[metrics[i].rating] = ratingCount / sampleSize;
			}
		}

		// Step 8: Compute percentiles (P75)
		const p75Index = Math.floor(metrics.length * 0.75);
		const p75Metric = metrics[p75Index] || null;
		const percentiles: Partial<
			Record<'p75', { value: number; rating: WebVitalsRating }> | undefined
		> = p75Metric ? { p75: { value: p75Metric.value, rating: p75Metric.rating } } : {};

		// Step 9: Filter the final results based on SQL conditions
		const finalMetrics = metrics.filter(
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			(metric) => metric.rating_end || metric.quartile! * 25 === 75
		);

		if (finalMetrics.length > 0) {
			summary[metricName] = { histogram, percentiles, sampleSize };
		}
	}

	return summary;
}
