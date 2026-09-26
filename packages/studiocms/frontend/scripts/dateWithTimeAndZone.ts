/**
 * Default Intl.DateTimeFormat options for displaying a date with time and timezone.
 *
 * Produces a short month name, numeric day and year, numeric hour and minute, and a
 * short timezone name (for example "GMT" or "PST"). The object is frozen and exposed
 * as a readonly value so it can be reused safely by callers without risk of mutation.
 *
 * Example:
 * @example
 * const formatted = new Intl.DateTimeFormat('en-US', DTConfig).format(new Date());
 *
 * @public
 * @readonly
 * @type {Readonly<Intl.DateTimeFormatOptions>}
 */
export const DTConfig: Readonly<Intl.DateTimeFormatOptions> = Object.freeze({
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	timeZoneName: 'short',
});

/**
 * Format a Date as a localized date and time string using the module's DTConfig options.
 *
 * This function calls Date.prototype.toLocaleString with an undefined locale (which uses the
 * environment/runtime default locale) and the DTConfig options object to produce a localized
 * date/time representation that can include time zone information if DTConfig specifies it.
 *
 * @param date - The Date instance to format. If the date is invalid, the returned string will typically be "Invalid Date".
 * @returns A localized date and time string formatted according to the current environment locale and DTConfig.
 *
 * @example
 * const formatted = dateWithTimeAndZone(new Date());
 * // Example output: "10/23/2025, 11:05:30 PM GMT+1"
 *
 * @remarks
 * Ensure DTConfig is defined in the module and contains the desired Intl.DateTimeFormat options
 * (for example: timeZone, year, month, day, hour, minute, second) for the expected output.
 */
export function dateWithTimeAndZone(date: Date): string {
	return date.toLocaleString(undefined, DTConfig);
}
