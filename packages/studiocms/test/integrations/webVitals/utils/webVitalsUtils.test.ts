import { describe, expect, it } from 'vitest';
import type { WebVitalsResponseItem } from '../../../../src/integrations/webVitals/types';
import {
	calculateClsAverage,
	calculateClsScorePercent,
	calculateClsScoreText,
	calculateInpAverage,
	calculateInpScorePercent,
	calculateInpScoreText,
	calculateLcpAverage,
	calculateLcpScorePercent,
	calculateLcpScoreText,
	clsDataAverage,
	clsTextColor,
	generateLighthouseFetchUrl,
	inpDataAverage,
	inpTextColor,
	lcpDataAverage,
	lcpTextColor,
	msToSeconds,
	progressBarClsColor,
	progressBarClsTrackColor,
	progressBarInpColor,
	progressBarInpTrackColor,
	progressBarLcpColor,
	progressBarLcpTrackColor,
} from '../../../../src/integrations/webVitals/utils/webVitalsUtils';

describe('webVitalsUtils', () => {
	describe('msToSeconds', () => {
		it('converts milliseconds to seconds', () => {
			expect(msToSeconds(1000)).toBe(1);
			expect(msToSeconds(2500)).toBe(2.5);
		});
	});

	describe('calculateClsAverage', () => {
		it('calculates average and rounds to two decimals', () => {
			expect(calculateClsAverage([0.1, 0.2, 0.3])).toBe(0.2);
			expect(calculateClsAverage([0.123, 0.456])).toBe(0.29);
		});
		it('returns NaN for empty array', () => {
			expect(calculateClsAverage([])).toBeNaN();
		});
	});

	describe('clsDataAverage', () => {
		const data: WebVitalsResponseItem[] = [
			// @ts-expect-error - testing mock data
			{ name: 'CLS', value: 0.1 },
			// @ts-expect-error - testing mock data
			{ name: 'CLS', value: 0.2 },
			// @ts-expect-error - testing mock data
			{ name: 'LCP', value: 1000 },
		];
		it('extracts CLS values and calculates average', () => {
			expect(clsDataAverage(data)).toBe(0.15);
		});
		it('returns NaN if no CLS values', () => {
			// @ts-expect-error - testing mock data
			expect(clsDataAverage([{ name: 'LCP', value: 1 }])).toBeNaN();
		});
	});

	describe('calculateClsScoreText', () => {
		it('returns correct score text', () => {
			expect(calculateClsScoreText(0.05)).toBe('Excellent');
			expect(calculateClsScoreText(0.2)).toBe('Good');
			expect(calculateClsScoreText(0.4)).toBe('Fair');
			expect(calculateClsScoreText(0.6)).toBe('Poor');
		});
	});

	describe('calculateClsScorePercent', () => {
		it('returns correct percent for ranges', () => {
			expect(calculateClsScorePercent(0.05)).toBe(100);
			expect(calculateClsScorePercent(0.2)).toBeLessThan(100);
			expect(calculateClsScorePercent(0.3)).toBeLessThan(75);
			expect(calculateClsScorePercent(0.6)).toBeLessThan(50);
		});
	});

	describe('progressBarClsColor', () => {
		it('returns green for <=0.25', () => {
			expect(progressBarClsColor(0.2)).toBe('green');
		});
		it('returns yellow for >0.25 and <=0.5', () => {
			expect(progressBarClsColor(0.4)).toBe('yellow');
		});
		it('returns red for >0.5', () => {
			expect(progressBarClsColor(0.6)).toBe('red');
		});
	});

	describe('progressBarClsTrackColor', () => {
		it('returns yellow for <=0.25', () => {
			expect(progressBarClsTrackColor(0.2)).toBe('yellow');
		});
		it('returns red for >0.25', () => {
			expect(progressBarClsTrackColor(0.4)).toBe('red');
		});
	});

	describe('clsTextColor', () => {
		it('returns green for <=0.25', () => {
			expect(clsTextColor(0.1)).toBe('green');
		});
		it('returns yellow for >0.25 and <=0.5', () => {
			expect(clsTextColor(0.4)).toBe('yellow');
		});
		it('returns red for >0.5', () => {
			expect(clsTextColor(0.6)).toBe('red');
		});
	});

	describe('calculateLcpAverage', () => {
		it('calculates average and floors to two decimals', () => {
			expect(calculateLcpAverage([1000, 2000, 3000])).toBe(2000);
			expect(calculateLcpAverage([1234, 5678])).toBe(3456);
		});
		it('returns NaN for empty array', () => {
			expect(calculateLcpAverage([])).toBeNaN();
		});
	});

	describe('lcpDataAverage', () => {
		const data: WebVitalsResponseItem[] = [
			// @ts-expect-error - testing mock data
			{ name: 'LCP', value: 1000 },
			// @ts-expect-error - testing mock data
			{ name: 'LCP', value: 2000 },
			// @ts-expect-error - testing mock data
			{ name: 'CLS', value: 0.1 },
		];
		it('extracts LCP values and calculates average', () => {
			expect(lcpDataAverage(data)).toBe(1500);
		});
		it('returns NaN if no LCP values', () => {
			// @ts-expect-error - testing mock data
			expect(lcpDataAverage([{ name: 'CLS', value: 1 }])).toBeNaN();
		});
	});

	describe('calculateLcpScoreText', () => {
		it('returns correct score text', () => {
			expect(calculateLcpScoreText(1000)).toBe('Excellent');
			expect(calculateLcpScoreText(3000)).toBe('Good');
			expect(calculateLcpScoreText(5000)).toBe('Fair');
			expect(calculateLcpScoreText(7000)).toBe('Poor');
		});
	});

	describe('calculateLcpScorePercent', () => {
		it('returns correct percent for ranges', () => {
			expect(calculateLcpScorePercent(1000)).toBe(100);
			expect(calculateLcpScorePercent(3000)).toBeLessThan(100);
			expect(calculateLcpScorePercent(5000)).toBeLessThan(50);
			expect(calculateLcpScorePercent(7000)).toBeLessThan(0);
		});
	});

	describe('progressBarLcpColor', () => {
		it('returns green for <=2.5s', () => {
			expect(progressBarLcpColor(2000)).toBe('green');
		});
		it('returns yellow for >2.5s and <=4s', () => {
			expect(progressBarLcpColor(3500)).toBe('yellow');
		});
		it('returns red for >4s', () => {
			expect(progressBarLcpColor(5000)).toBe('red');
		});
	});

	describe('progressBarLcpTrackColor', () => {
		it('returns yellow for <=2.5s', () => {
			expect(progressBarLcpTrackColor(2000)).toBe('yellow');
		});
		it('returns red for >2.5s', () => {
			expect(progressBarLcpTrackColor(3500)).toBe('red');
		});
	});

	describe('lcpTextColor', () => {
		it('returns green for <=2.5s', () => {
			expect(lcpTextColor(2000)).toBe('green');
		});
		it('returns yellow for >2.5s and <=4s', () => {
			expect(lcpTextColor(3500)).toBe('yellow');
		});
		it('returns red for >4s', () => {
			expect(lcpTextColor(5000)).toBe('red');
		});
	});

	describe('calculateInpAverage', () => {
		it('calculates average and rounds to two decimals', () => {
			expect(calculateInpAverage([50, 100, 150])).toBe(100);
			expect(calculateInpAverage([123, 456])).toBeCloseTo(289.5);
		});
		it('returns NaN for empty array', () => {
			expect(calculateInpAverage([])).toBeNaN();
		});
	});

	describe('inpDataAverage', () => {
		const data: WebVitalsResponseItem[] = [
			// @ts-expect-error - testing mock data
			{ name: 'INP', value: 50 },
			// @ts-expect-error - testing mock data
			{ name: 'INP', value: 100 },
			// @ts-expect-error - testing mock data
			{ name: 'CLS', value: 0.1 },
		];
		it('extracts INP values and calculates floored average', () => {
			expect(inpDataAverage(data)).toBe(75);
		});
		it('returns NaN if no INP values', () => {
			// @ts-expect-error - testing mock data
			expect(inpDataAverage([{ name: 'CLS', value: 1 }])).toBeNaN();
		});
	});

	describe('calculateInpScoreText', () => {
		it('returns correct score text', () => {
			expect(calculateInpScoreText(40)).toBe('Excellent');
			expect(calculateInpScoreText(80)).toBe('Good');
			expect(calculateInpScoreText(150)).toBe('Fair');
			expect(calculateInpScoreText(250)).toBe('Poor');
		});
	});

	describe('calculateInpScorePercent', () => {
		it('returns correct percent for ranges', () => {
			expect(calculateInpScorePercent(40)).toBe(100);
			expect(calculateInpScorePercent(80)).toBeLessThan(100);
			expect(calculateInpScorePercent(150)).toBeLessThan(50);
			expect(calculateInpScorePercent(250)).toBeLessThan(0);
		});
	});

	describe('progressBarInpColor', () => {
		it('returns green for <=100', () => {
			expect(progressBarInpColor(80)).toBe('green');
		});
		it('returns yellow for >100 and <=200', () => {
			expect(progressBarInpColor(150)).toBe('yellow');
		});
		it('returns red for >200', () => {
			expect(progressBarInpColor(250)).toBe('red');
		});
	});

	describe('progressBarInpTrackColor', () => {
		it('returns yellow for <=100', () => {
			expect(progressBarInpTrackColor(80)).toBe('yellow');
		});
		it('returns red for >100', () => {
			expect(progressBarInpTrackColor(150)).toBe('red');
		});
	});

	describe('inpTextColor', () => {
		it('returns green for <=100', () => {
			expect(inpTextColor(80)).toBe('green');
		});
		it('returns yellow for >100 and <=200', () => {
			expect(inpTextColor(150)).toBe('yellow');
		});
		it('returns red for >200', () => {
			expect(inpTextColor(250)).toBe('red');
		});
	});

	describe('generateLighthouseFetchUrl', () => {
		it('generates correct fetch URL for mobile', () => {
			const url = generateLighthouseFetchUrl('https://example.com');
			expect(url).toContain('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
			expect(url).toContain('url=https%3A%2F%2Fexample.com');
			expect(url).toContain('strategy=mobile');
		});
		it('generates correct fetch URL for desktop', () => {
			const url = generateLighthouseFetchUrl('https://example.com', 'desktop');
			expect(url).toContain('strategy=desktop');
		});
		it('generates correct fetch URL for mixed-content', () => {
			const url = generateLighthouseFetchUrl('https://example.com', 'mixed-content');
			expect(url).toContain('strategy=mixed-content');
		});
	});
});
