import type { WebVitalsResponseItem } from 'studiocms-dashboard:web-vitals';
import type { SlProgressRing } from '@matthiesenxyz/astrolace/types';

// Misc Utils
export function msToSeconds(ms: number): number {
	return ms / 1000;
}

// CLS Calculations
// Combine all CLS values and calculate average
export function calculateClsAverage(clsValues: number[]): number {
	const sum = clsValues.reduce((acc, curr) => acc + curr, 0);
	const average = sum / clsValues.length;

	// Round average to two decimal places
	return Math.round(average * 100) / 100;
}

// Get CLS data from Web Vitals API response
// Return the Calculated average CLS value
export const clsDataAverage = (webVitalData: WebVitalsResponseItem[]) => {
	const clsData: number[] = [];
	if (webVitalData) {
		for (const item of webVitalData) {
			if (item.name === 'CLS') {
				clsData.push(item.value);
			}
		}
	}
	return calculateClsAverage(clsData);
};

// Calculate CLS score based on the average CLS value
// Return the score as a string (Excellent, Good, Fair, Poor)
// This is based on the https://web.dev/cls/ guidelines
export function calculateClsScoreText(cls: number): string {
	if (cls <= 0.1) {
		return 'Excellent'; // Excellent
	}
	if (cls <= 0.25) {
		return 'Good'; // Good to Excellent
	}
	if (cls <= 0.5) {
		return 'Fair'; // Fair to Good
	}
	return 'Poor'; // Poor to Fair
}

// Calculate CLS score based on the average CLS value
// Return the score as a percentage (0-100)
// This is based on the https://web.dev/cls/ guidelines
export function calculateClsScorePercent(cls: number): number {
	if (cls <= 0.1) {
		return 100; // Excellent
	}
	if (cls <= 0.25) {
		return Math.round(100 - ((cls - 0.1) / (0.25 - 0.1)) * 25); // Good to Excellent
	}
	if (cls <= 0.5) {
		return Math.round(75 - ((cls - 0.25) / (0.5 - 0.25)) * 25); // Fair to Good
	}
	return Math.round(50 - ((cls - 0.5) / (1 - 0.5)) * 50); // Poor to Fair
}

// Calculate CLS progress bar color based on the average CLS value
// Return the color as a string (green, yellow, red)
// This is based on the https://web.dev/cls/ guidelines
export const progressBarClsColor = (clsData: number) => {
	if (clsData <= 0.25) {
		return 'green';
	}
	if (clsData > 0.25 && clsData <= 0.5) {
		return 'yellow';
	}
	return 'red';
};

// Calculate CLS progress bar track color based on the average CLS value
// Return the color as a string (yellow, red)
// This is based on the https://web.dev/cls/ guidelines
export const progressBarClsTrackColor = (clsData: number) => {
	if (clsData <= 0.25) {
		return 'yellow';
	}
	if (clsData > 0.25) {
		return 'red';
	}
	return 'red';
};

// Calculate CLS text color based on the average CLS value
// Return the color as a string (green, yellow, red)
// This is based on the https://web.dev/cls/ guidelines
export const clsTextColor = (clsData: number) => {
	if (clsData <= 0.25) {
		return 'green';
	}
	if (clsData > 0.25 && clsData <= 0.5) {
		return 'yellow';
	}
	return 'red';
};

// LCP Calculations
// Combine all LCP values and calculate average
// Return the Calculated average LCP value
export function calculateLcpAverage(lcpValues: number[]): number {
	const sum = lcpValues.reduce((acc, curr) => acc + curr, 0);
	const average = sum / lcpValues.length;

	// Round average to two decimal places
	return Math.floor(Math.round(average * 100) / 100);
}

// Get LCP data from Web Vitals API response
// Return the Calculated average LCP value
export const lcpDataAverage = (webVitalData: WebVitalsResponseItem[]) => {
	const lcpData: number[] = [];
	if (webVitalData) {
		for (const item of webVitalData) {
			if (item.name === 'LCP') {
				lcpData.push(item.value);
			}
		}
	}
	return calculateLcpAverage(lcpData);
};

// Calculate LCP score based on the average LCP value
// Return the score as a string (Excellent, Good, Fair, Poor)
// This is based on the https://web.dev/lcp/ guidelines
export function calculateLcpScoreText(lcp: number): string {
	if (msToSeconds(lcp) <= 2) {
		return 'Excellent'; // Excellent
	}
	if (msToSeconds(lcp) <= 4) {
		return 'Good'; // Good to Excellent
	}
	if (msToSeconds(lcp) <= 6) {
		return 'Fair'; // Fair to Good
	}
	return 'Poor'; // Poor to Fair
}

// Calculate LCP score based on the average LCP value
// Return the score as a percentage (0-100)
// This is based on the https://web.dev/lcp/ guidelines
export function calculateLcpScorePercent(lcp: number): number {
	if (msToSeconds(lcp) <= 2) {
		return 100; // Excellent
	}
	if (msToSeconds(lcp) <= 4) {
		return Math.round(100 - ((lcp - 2) / (4 - 2)) * 50); // Good to Excellent
	}
	if (msToSeconds(lcp) <= 6) {
		return Math.round(50 - ((lcp - 4) / (6 - 4)) * 50); // Fair to Good
	}
	return Math.round(0 - ((lcp - 6) / (10 - 6)) * 50); // Poor to Fair
}

// Calculate LCP progress bar color based on the average LCP value
// Return the color as a string (green, yellow, red)
// This is based on the https://web.dev/lcp/ guidelines
export const progressBarLcpColor = (lcpData: number) => {
	if (msToSeconds(lcpData) <= 2.5) {
		return 'green';
	}
	if (msToSeconds(lcpData) > 2.5 && lcpData <= 4) {
		return 'yellow';
	}
	return 'red';
};

// Calculate LCP progress bar track color based on the average LCP value
// Return the color as a string (yellow, red)
// This is based on the https://web.dev/lcp/ guidelines
export const progressBarLcpTrackColor = (lcpData: number) => {
	if (msToSeconds(lcpData) <= 2.5) {
		return 'yellow';
	}
	if (msToSeconds(lcpData) > 2.5) {
		return 'red';
	}
	return 'red';
};

// Calculate LCP text color based on the average LCP value
// Return the color as a string (green, yellow, red)
// This is based on the https://web.dev/lcp/ guidelines
export const lcpTextColor = (lcpData: number) => {
	if (msToSeconds(lcpData) <= 2.5) {
		return 'green';
	}
	if (msToSeconds(lcpData) > 2.5 && lcpData <= 4) {
		return 'yellow';
	}
	return 'red';
};

// INP Calculations
// Combine all INP values and calculate average
// Return the Calculated average INP value
export function calculateInpAverage(inpValues: number[]): number {
	const sum = inpValues.reduce((acc, curr) => acc + curr, 0);
	const average = sum / inpValues.length;

	// Round average to two decimal places
	return Math.round(average * 100) / 100;
}

// Get INP data from Web Vitals API response
// Return the Calculated average INP value
export function inpDataAverage(webVitalData: WebVitalsResponseItem[]): number {
	const inpData: number[] = [];
	if (webVitalData) {
		for (const item of webVitalData) {
			if (item.name === 'INP') {
				inpData.push(item.value);
			}
		}
	}
	return Math.floor(calculateInpAverage(inpData));
}

// Calculate INP score based on the average INP value
// Return the score as a string (Excellent, Good, Fair, Poor)
// This is based on the https://web.dev/inp/ guidelines
export function calculateInpScoreText(inp: number): string {
	if (inp <= 50) {
		return 'Excellent'; // Excellent
	}
	if (inp <= 100) {
		return 'Good'; // Good to Excellent
	}
	if (inp <= 200) {
		return 'Fair'; // Fair to Good
	}
	return 'Poor'; // Poor to Fair
}

// Calculate INP score based on the average INP value
// Return the score as a percentage (0-100)
// This is based on the https://web.dev/inp/ guidelines
export function calculateInpScorePercent(inp: number): number {
	if (inp <= 50) {
		return 100; // Excellent
	}
	if (inp <= 100) {
		return Math.round(100 - ((inp - 50) / (100 - 50)) * 50); // Good to Excellent
	}
	if (inp <= 200) {
		return Math.round(50 - ((inp - 100) / (200 - 100)) * 50); // Fair to Good
	}
	return Math.round(0 - ((inp - 200) / (300 - 200)) * 50); // Poor to Fair
}

// Calculate INP progress bar color based on the average INP value
// Return the color as a string (green, yellow, red)
// This is based on the https://web.dev/inp/ guidelines
export const progressBarInpColor = (inpData: number) => {
	if (inpData <= 100) {
		return 'green';
	}
	if (inpData > 100 && inpData <= 200) {
		return 'yellow';
	}
	return 'red';
};

// Calculate INP progress bar track color based on the average INP value
// Return the color as a string (yellow, red)
// This is based on the https://web.dev/inp/ guidelines
export const progressBarInpTrackColor = (inpData: number) => {
	if (inpData <= 100) {
		return 'yellow';
	}
	if (inpData > 100) {
		return 'red';
	}
	return 'red';
};

// Calculate INP text color based on the average INP value
// Return the color as a string (green, yellow, red)
// This is based on the https://web.dev/inp/ guidelines
export const inpTextColor = (inpData: number) => {
	if (inpData <= 100) {
		return 'green';
	}
	if (inpData > 100 && inpData <= 200) {
		return 'yellow';
	}
	return 'red';
};

//
// Pagespeed Insights Utils
//
export function generateLighthouseFetchUrl(
	url: string,
	strategy: 'mobile' | 'desktop' | 'mixed-content' = 'mobile'
): string {
	// Base URL for Google PageSpeed Insights API
	const baseUrl: string = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

	// Final URL with encoded parameters
	const fetchUrl: string = `${baseUrl}?url=${encodeURIComponent(url)}&fields=lighthouseResult%2Fcategories%2F*%2Fscore&prettyPrint=false&strategy=${strategy}&category=performance&category=pwa&category=best-practices&category=accessibility&category=seo`;

	return fetchUrl;
}

export const setProgressRing = (ProgressRing: SlProgressRing, value: number) => {
	ProgressRing.value = value;
	ProgressRing.textContent = value.toString();
	ProgressRing.style.color = value >= 90 ? 'green' : value >= 50 ? 'rgb(208, 208, 0)' : 'red';
	ProgressRing.style.setProperty(
		'--indicator-color',
		value >= 90 ? 'green' : value >= 50 ? 'yellow' : 'red'
	);
	if (value < 90) {
		ProgressRing.style.webkitTextStroke = '2px black;';
	}
};
