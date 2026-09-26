import { DTConfig } from './dateWithTimeAndZone.js';

/**
 * Updates the visible text of a <time> element to a localized date/time string.
 *
 * Looks up an element by the provided id and, if it is an HTMLTimeElement,
 * parses its `dateTime` attribute and sets the element's `textContent` to the
 * result of `new Date(...).toLocaleString(undefined, DTConfig)`.
 *
 * @param id - The id of the target element expected to be a <time> element.
 *
 * @remarks
 * - If no element with the given id exists or the element is not an instance
 *   of HTMLTimeElement, the function returns immediately and makes no changes.
 * - The function relies on a `DTConfig` object (in scope) supplying options
 *   accepted by `toLocaleString` (e.g. locale options, timeZone, date/time style).
 * - If the `dateTime` attribute cannot be parsed into a valid Date, the output
 *   depends on the platform's handling of invalid dates (may yield "Invalid Date").
 * - This function mutates the DOM by writing to `textContent`.
 *
 * @returns void
 */
export function dateTimeListener(id: string) {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLTimeElement)) return;

	el.textContent = new Date(el.dateTime).toLocaleString(undefined, DTConfig);
}
