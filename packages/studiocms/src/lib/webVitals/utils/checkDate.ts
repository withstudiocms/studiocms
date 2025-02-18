export const checkDate = (date: Date) => {
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
