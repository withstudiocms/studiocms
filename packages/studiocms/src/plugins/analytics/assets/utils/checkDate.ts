/**
 * Utility functions to check if a given date falls within specific time ranges.
 *
 * @param {Date} date - The date to be checked.
 * @returns {Object} An object containing methods to check if the date is within the last 24 hours, 7 days, or 30 days.
 */
export const checkDate = (
	date: Date
): {
	isInLast24Hours(): boolean;
	isInLast7Days(): boolean;
	isInLast30Days(): boolean;
} => {
	return {
		isInLast24Hours(): boolean {
			const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // Subtract 24 hours in milliseconds
			return date >= twentyFourHoursAgo && date <= new Date();
		},
		isInLast7Days(): boolean {
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Subtract 7 days in milliseconds
			return date >= sevenDaysAgo && date <= new Date();
		},
		isInLast30Days(): boolean {
			const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Subtract 30 days in milliseconds
			return date >= thirtyDaysAgo && date <= new Date();
		},
	};
};
