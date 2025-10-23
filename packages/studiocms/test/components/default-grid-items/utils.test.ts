import { describe, expect, it } from 'vitest';
import {
	allowedIdentifiers,
	sortByDate,
	withinLast30Days,
} from '../../../src/handlers/plugin-components/utils';

describe('allowedIdentifiers', () => {
	it('should contain the expected identifiers', () => {
		expect(allowedIdentifiers).toEqual([
			'studiocms/markdown',
			'studiocms/html',
			'studiocms/mdx',
			'studiocms/markdoc',
			'studiocms/wysiwyg',
		]);
	});
});

describe('withinLast30Days', () => {
	it('returns true for a date within the last 30 days', () => {
		const recentDate = new Date();
		recentDate.setDate(recentDate.getDate() - 10);
		expect(withinLast30Days(recentDate)).toBe(true);
	});

	it('returns false for a date older than 30 days', () => {
		const oldDate = new Date();
		oldDate.setDate(oldDate.getDate() - 31);
		expect(withinLast30Days(oldDate)).toBe(false);
	});

	it('returns false for a future date', () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 1);
		expect(withinLast30Days(futureDate)).toBe(true);
	});
});

describe('sortByDate', () => {
	const dateA = new Date('2023-01-01');
	const dateB = new Date('2023-02-01');

	it('sorts ascending by default', () => {
		expect(sortByDate(dateA, dateB)).toBeGreaterThan(0);
		expect(sortByDate(dateB, dateA)).toBeLessThan(0);
		expect(sortByDate(dateA, dateA)).toBe(0);
	});

	it('sorts descending when desc is true', () => {
		expect(sortByDate(dateA, dateB, true)).toBeLessThan(0);
		expect(sortByDate(dateB, dateA, true)).toBeGreaterThan(0);
		expect(sortByDate(dateA, dateA, true)).toBe(0);
	});

	it('handles null dates as epoch', () => {
		expect(sortByDate(null, dateA)).toBeGreaterThan(0);
		expect(sortByDate(dateA, null)).toBeLessThan(0);
		expect(sortByDate(null, null)).toBe(0);
	});
});
