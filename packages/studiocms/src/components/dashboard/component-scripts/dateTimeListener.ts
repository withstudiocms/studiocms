import { DTConfig } from './dateWithTimeAndZone.js';

export function dateTimeListener(id: string) {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLTimeElement)) return;

	el.textContent = new Date(el.dateTime).toLocaleString(undefined, DTConfig);
}
