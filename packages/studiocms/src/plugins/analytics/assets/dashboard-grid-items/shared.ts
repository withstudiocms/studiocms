import type { AvailableIcons } from 'studiocms:ui/icons';

/** Icons for web vitals ratings. */
export const ratingIcons: {
	good: AvailableIcons;
	'needs-improvement': AvailableIcons;
	poor: AvailableIcons;
} = {
	good: 'heroicons:check-circle',
	'needs-improvement': 'heroicons:exclamation-circle',
	poor: 'heroicons:x-circle',
};

/** Text color classes for web vitals ratings. */
export const ratingText = {
	good: 'text-green-600',
	'needs-improvement': 'text-yellow-600',
	poor: 'text-red-600',
};

/** Card classes for web vitals ratings. */
export const ratingCardClasses = {
	good: 'border-green-600 bg-green-100',
	'needs-improvement': 'border-yellow-600 bg-yellow-100',
	poor: 'border-red-600 bg-red-100',
};

/** Formatters for web vitals metrics. */
export const webVitalsMetricFormatters = {
	CLS: (v: number) => v.toFixed(0),
	FCP: (v: number) => v.toFixed(0),
	FID: (v: number) => v.toFixed(0),
	LCP: (v: number) => `${Math.floor(Math.round(v * 100) / 100)} ms`,
	TTFB: (v: number) => v.toFixed(0),
	INP: (v: number) => `${v.toFixed(0)} ms`,
};

/**
 * Bar segments for web vitals ratings.
 */
export const barSegments = {
	good: 'good',
	'needs-improvement': 'needs-improvement',
	poor: 'poor',
};
