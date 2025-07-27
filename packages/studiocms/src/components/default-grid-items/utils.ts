// Only allow the following identifiers for pages
export const allowedIdentifiers = ['studiocms/markdown', 'studiocms/html', 'studiocms/mdx', 'studiocms/markdoc', 'studiocms/wysiwyg'];

/**
 * Checks if a given date is within the last 30 days from the current date.
 *
 * @param date - The date to check.
 * @returns True if the date is within the last 30 days, otherwise false.
 */
export function withinLast30Days(date: Date) {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
	return date > thirtyDaysAgo;
}

/**
 * Sorts two dates in ascending or descending order.
 *
 * @param a - The first date to compare. Can be null.
 * @param b - The second date to compare. Can be null.
 * @param desc - If true, sorts in descending order. Defaults to ascending order.
 * @returns A negative number if `a` is less than `b`, zero if they are equal, or a positive number if `a` is greater than `b`.
 */
export function sortByDate(a: Date | null, b: Date | null, desc?: boolean) {
	if (!a && !b) {
		return 0;
	}

	if (!a) {
		a = new Date(0);
	}

	if (!b) {
		b = new Date(0);
	}

	if (desc) {
		return a.getTime() - b.getTime();
	}

	return b.getTime() - a.getTime();
}
