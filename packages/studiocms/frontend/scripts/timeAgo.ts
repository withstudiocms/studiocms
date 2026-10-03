/**
 * Returns a human-readable "time ago" string for a given date relative to now.
 *
 * The output is English-only and formatted as:
 * - "X day(s) ago" when at least 1 day has passed.
 * - "H hour(s), M min(s) ago" when less than a day has passed. Minutes are always included
 *   when hours are omitted (e.g., "0 min ago" for dates equal to now).
 *
 * Pluralization is handled for days, hours, and minutes (e.g., "1 day", "2 days").
 *
 * @param date - The Date to compare against the current time. (The function constructs a new Date
 *               from the provided value, so non-Date values that are valid for `new Date(...)`
 *               may produce a result, but the declared type is `Date`.)
 * @returns A string describing how long ago the given date was (e.g. "3 hours, 5 mins ago"),
 *          or the string "Invalid date" if the provided value cannot be parsed as a valid date.
 *
 * @example
 * // ~1 minute ago
 * timeAgo(new Date(Date.now() - 90_000)); // "1 min ago"
 *
 * @example
 * // ~3 hours, 5 minutes ago
 * timeAgo(new Date(Date.now() - (3 * 60 + 5) * 60_000)); // "3 hours, 5 mins ago"
 *
 * @example
 * // ~2 days ago
 * timeAgo(new Date(Date.now() - 2 * 24 * 60 * 60_000)); // "2 days ago"
 *
 * @example
 * // invalid input
 * timeAgo(new Date('invalid-date')); // "Invalid date"
 *
 * @remarks
 * - The function assumes the input represents a past time. Passing a future date can produce
 *   unexpected output (currently the implementation does not explicitly handle future dates and
 *   may return an empty prefix followed by " ago"). If future dates must be handled, normalize
 *   the input before calling this function or extend the implementation to cover future times
 *   (e.g., "in 5 mins").
 * - Output format and language are fixed; localize if different language/formatting is required.
 */
export function timeAgo(date: Date) {
	const now = new Date();
	const past = new Date(date);
	const diffInMs = now.getTime() - past.getTime();

	if (Number.isNaN(diffInMs)) {
		return 'Invalid date';
	}

	const minutes = Math.floor(diffInMs / (1000 * 60)) % 60;
	const hours = Math.floor(diffInMs / (1000 * 60 * 60)) % 24;
	const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	const parts: string[] = [];

	// If days is greater than 0, add days to parts array
	if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

	// If days is 0, add hours and minutes to parts array
	if (days === 0) {
		if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
		if (minutes > 0 || parts.length === 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
	}

	return `${parts.join(', ')} ago`;
}
