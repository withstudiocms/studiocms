export const DTConfig: Readonly<Intl.DateTimeFormatOptions> = Object.freeze({
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	timeZoneName: 'short',
});

export function dateWithTimeAndZone(date: Date): string {
	return date.toLocaleString(undefined, DTConfig);
}
