export function dateWithTimeAndZone(date: Date) {
	return date.toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		timeZoneName: 'short',
	});
}
