export const DTConfig: Intl.DateTimeFormatOptions = {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	timeZoneName: 'short',
};

export function dateWithTimeAndZone(date: Date) {
	return date.toLocaleString(undefined, DTConfig);
}
