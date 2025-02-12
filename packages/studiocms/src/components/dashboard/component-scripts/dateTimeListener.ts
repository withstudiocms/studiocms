export function dateTimeListener(id: string) {
	const lastCheckedDate = document.getElementById(id) as HTMLTimeElement;

	lastCheckedDate.textContent = new Date(lastCheckedDate.dateTime).toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		timeZoneName: 'short',
	});
}
