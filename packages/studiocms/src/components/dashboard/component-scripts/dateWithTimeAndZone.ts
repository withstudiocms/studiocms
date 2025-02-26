export function dateWithTimeAndZone(date: Date) {
	return date.toLocaleString(undefined, {
		month: 'numeric',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	});
}
