import type { WebVitalsRating } from './schemas.js';
import type {
	IntermediateWebVitalsRouteSummary,
	WebVitalsResponseItem,
	WebVitalsRouteSummary,
} from './types.js';

/**
 * Processes an array of Web Vitals response items and returns a summary of web vitals for each route.
 *
 * @param data - An array of WebVitalsResponseItem objects representing the web vitals data.
 * @returns An array of WebVitalsRouteSummary objects summarizing the web vitals for each route.
 *
 * The function performs the following steps:
 * 1. Groups the data by route and name.
 * 2. Processes each group separately, ensuring the sample size is at least 4.
 * 3. Sorts the metrics within each group by rating and value.
 * 4. Assigns quartiles to the metrics using NTILE(4) logic.
 * 5. Identifies the end of each quartile.
 * 6. Selects only the metrics in quartile 3 where quartile_end is true.
 * 7. Converts the selected metrics into WebVitalsRouteSummary structures.
 *
 * The resulting summaries include the route, whether the route passes core web vitals, the metrics for LCP, CLS, and INP, and a score.
 */
export function processWebVitalsRouteSummary(
	data: WebVitalsResponseItem[]
): WebVitalsRouteSummary[] {
	// Step 1: Group data by route and name
	const grouped: Record<string, WebVitalsResponseItem[]> = data.reduce(
		(acc, item) => {
			const key = `${item.route}-${item.name}`;
			if (!acc[key]) acc[key] = [];
			acc[key].push(item);
			return acc;
		},
		{} as Record<string, WebVitalsResponseItem[]>
	);

	const results: WebVitalsResponseItem[] = [];

	// Step 2: Process each group separately
	for (const metrics of Object.values(grouped)) {
		if (metrics.length < 4) continue; // Ensure sample_size >= 4

		// Step 3: Sort within the group
		metrics.sort((a, b) => a.rating.localeCompare(b.rating) || a.value - b.value);

		// Step 4: Assign quartiles (NTILE(4) logic)
		const quartileSize = Math.ceil(metrics.length / 4);
		metrics.forEach((metric, index) => {
			metric.quartile = Math.floor(index / quartileSize) + 1; // 1-based quartile index
		});

		// Step 5: Identify `quartile_end`
		metrics.forEach((metric, index, arr) => {
			const nextItem = arr[index + 1];
			metric.quartile_end = !nextItem || nextItem.quartile !== metric.quartile;
		});

		// Step 6: Select only quartile 3 where quartile_end is true
		results.push(...metrics.filter((metric) => metric.quartile === 3 && metric.quartile_end));
	}

	// Step 7: Convert into WebVitalsRouteSummary structure
	const summaries: Record<string, IntermediateWebVitalsRouteSummary> = {};
	for (const item of results) {
		const { route, name, rating, value } = item;
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		const routeSummary = (summaries[route] ||= {
			route,
			passingCoreWebVitals: true,
			metrics: {},
			score: 0,
		});
		routeSummary.metrics[name as 'LCP' | 'CLS' | 'INP'] = {
			rating,
			value,
			sampleSize: results.length,
		};
		if (['LCP', 'CLS', 'INP'].includes(name) && rating !== 'good') {
			routeSummary.passingCoreWebVitals = false;
		}
	}

	return Object.values(summaries)
		.filter((route): route is WebVitalsRouteSummary =>
			Boolean(route.metrics.CLS && route.metrics.LCP && route.metrics.INP)
		)
		.map((route) => ({
			...route,
			score: simpleScore(
				route.metrics.LCP.rating,
				route.metrics.CLS.rating,
				route.metrics.INP.rating
			),
		}))
		.sort((a, b) => a.score - b.score);
}

/**
 * Scoring Function: Computes a weighted score for core web vitals
 */
const weighting = { LCP: 0.4, CLS: 0.3, INP: 0.3 };
const scoring = { good: 1, 'needs-improvement': 0.5, poor: 0 };

const simpleScore = (
	lcpRating: WebVitalsRating,
	clsRating: WebVitalsRating,
	inpRating: WebVitalsRating
) =>
	scoring[lcpRating] * weighting.LCP +
	scoring[clsRating] * weighting.CLS +
	scoring[inpRating] * weighting.INP;
