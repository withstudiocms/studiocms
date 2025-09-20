import { describe, expect, it } from 'vitest';
import { checkDate } from '../../../../src/integrations/webVitals/utils/checkDate';

describe('checkDate', () => {
	const now = new Date();

	it('should return true for a date within the last 24 hours', () => {
		const date = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
		expect(checkDate(date).isInLast24Hours()).toBe(true);
	});

	it('should return false for a date older than 24 hours', () => {
		const date = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
		expect(checkDate(date).isInLast24Hours()).toBe(false);
	});

	it('should return true for a date within the last 7 days', () => {
		const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
		expect(checkDate(date).isInLast7Days()).toBe(true);
	});

	it('should return false for a date older than 7 days', () => {
		const date = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
		expect(checkDate(date).isInLast7Days()).toBe(false);
	});

	it('should return true for a date within the last 30 days', () => {
		const date = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
		expect(checkDate(date).isInLast30Days()).toBe(true);
	});

	it('should return false for a date older than 30 days', () => {
		const date = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
		expect(checkDate(date).isInLast30Days()).toBe(false);
	});

	it('should return true for current date in all checks', () => {
		expect(checkDate(now).isInLast24Hours()).toBe(true);
		expect(checkDate(now).isInLast7Days()).toBe(true);
		expect(checkDate(now).isInLast30Days()).toBe(true);
	});

	it('should return false for a future date in all checks', () => {
		const futureDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day in future
		expect(checkDate(futureDate).isInLast24Hours()).toBe(false);
		expect(checkDate(futureDate).isInLast7Days()).toBe(false);
		expect(checkDate(futureDate).isInLast30Days()).toBe(false);
	});
});
