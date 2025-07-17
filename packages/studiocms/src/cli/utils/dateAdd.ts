import { Effect } from '../../effect.js';

export type Interval = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

/**
 * Adds time to a date. Modelled after MySQL DATE_ADD function.
 * Example: dateAdd(new Date(), 'minute', 30)  //returns 30 minutes from now.
 * https://stackoverflow.com/a/1214753/18511
 *
 * @param date  Date to start with
 * @param interval  One of: year, quarter, month, week, day, hour, minute, second
 * @param units  Number of units of the given interval to add.
 */
export const dateAdd = (date: Date, interval: Interval, units: number) =>
	Effect.try({
		try: () => {
			const ret: Date = new Date(date); //don't change original date
			const checkRollover = () => {
				if (ret.getDate() !== date.getDate()) ret.setDate(0);
			};
			switch (String(interval).toLowerCase()) {
				case 'year':
					ret.setFullYear(ret.getFullYear() + units);
					checkRollover();
					break;
				case 'quarter':
					ret.setMonth(ret.getMonth() + 3 * units);
					checkRollover();
					break;
				case 'month':
					ret.setMonth(ret.getMonth() + units);
					checkRollover();
					break;
				case 'week':
					ret.setDate(ret.getDate() + 7 * units);
					break;
				case 'day':
					ret.setDate(ret.getDate() + units);
					break;
				case 'hour':
					ret.setTime(ret.getTime() + units * 3600000);
					break;
				case 'minute':
					ret.setTime(ret.getTime() + units * 60000);
					break;
				case 'second':
					ret.setTime(ret.getTime() + units * 1000);
					break;
				default: {
					throw new RangeError(
						`dateAdd: unsupported interval "${interval}". ` +
							`Expected one of ${['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second'].join(', ')}.`
					);
				}
			}
			return ret;
		},
		catch: () =>
			new RangeError(
				`dateAdd: unsupported interval "${interval}". ` +
					`Expected one of ${['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second'].join(', ')}.`
			),
	});
