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
