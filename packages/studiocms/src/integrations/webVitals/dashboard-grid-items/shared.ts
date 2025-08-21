import type { HeroIconName } from 'studiocms:ui/components';

export const ratingIcons: {
	good: HeroIconName;
	'needs-improvement': HeroIconName;
	poor: HeroIconName;
} = {
	good: 'check-circle',
	'needs-improvement': 'exclamation-circle',
	poor: 'x-circle',
};

export const ratingText = {
	good: 'text-green-600',
	'needs-improvement': 'text-yellow-600',
	poor: 'text-red-600',
};

export const ratingCardClasses = {
	good: 'border-green-600 bg-green-100',
	'needs-improvement': 'border-yellow-600 bg-yellow-100',
	poor: 'border-red-600 bg-red-100',
};

// return Math.round(average * 100) / 100;

export const webVitalsMetricFormatters = {
	CLS: (v: number) => v.toFixed(0),
	FCP: (v: number) => v.toFixed(0),
	FID: (v: number) => v.toFixed(0),
	LCP: (v: number) => `${Math.floor(Math.round(v * 100) / 100)} ms`,
	TTFB: (v: number) => v.toFixed(0),
	INP: (v: number) => `${v.toFixed(0)} ms`,
};

export const barSegments = {
	good: 'good',
	'needs-improvement': 'needs-improvement',
	poor: 'poor',
};
