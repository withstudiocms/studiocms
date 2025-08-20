import { DTConfig } from './dateWithTimeAndZone.js';

export function dateTimeListener(id: string) {
	const lastCheckedDate = document.getElementById(id) as HTMLTimeElement;

	lastCheckedDate.textContent = new Date(lastCheckedDate.dateTime).toLocaleString(
		undefined,
		DTConfig
	);
}
