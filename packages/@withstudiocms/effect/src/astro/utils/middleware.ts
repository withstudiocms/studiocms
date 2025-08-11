import type { APIContext, MiddlewareNext } from 'astro';
import { sequence } from 'astro/middleware';
import micromatch from 'micromatch';
import { defineMiddleware } from '../middleware.js';
import type { EffectMiddlewareRouterEntry } from '../types.js';

/**
 * Checks if a given pathname matches specified paths using micromatch.
 *
 * If `paths` is `undefined`, an empty array, or an empty string, returns `defaultValue`.
 * Otherwise, uses `micromatch.isMatch` to determine if `pathname` matches any of the provided paths.
 *
 * @param paths - A string or array of strings representing path patterns to match against, or `undefined`.
 * @param pathname - The pathname to test against the provided patterns.
 * @param defaultValue - The value to return if `paths` is not specified or empty.
 * @returns `defaultValue` if `paths` is empty or not provided; otherwise, the result of `micromatch.isMatch`.
 */
export const matchFilterCheck = (
	paths: string | string[] | undefined,
	pathname: string,
	defaultValue: boolean
): boolean => {
	if (
		paths === null ||
		(Array.isArray(paths) && paths.length === 0) ||
		(typeof paths === 'string' && paths.trim() === '')
	) {
		// If paths is undefined, empty array, or empty string, return defaultValue
		return defaultValue;
	}

	let cleanedPaths: string[];

	if (typeof paths === 'string') {
		if (paths.trim() === '') {
			// If the string is empty, return defaultValue
			return defaultValue;
		}
		cleanedPaths = [paths.trim()];
	} else if (Array.isArray(paths)) {
		if (paths.length === 0 || paths.every((p) => p.trim() === '')) {
			// If the array is empty or all elements are empty strings, return defaultValue
			return defaultValue;
		}
		cleanedPaths = paths.map((p) => p.trim()).filter((p) => p !== '');
	} else {
		// If paths is neither a string nor an array, return defaultValue
		return defaultValue;
	}

	return micromatch.isMatch(pathname, cleanedPaths, {
		nocase: true, // Case-insensitive matching
	});
};

/**
 * Determines whether a given pathname should be included or excluded based on provided include and exclude path patterns.
 *
 * @param includePaths - A string or array of strings representing glob patterns to include. If `undefined`, empty, or blank, all paths are included.
 * @param excludePaths - A string or array of strings representing glob patterns to exclude. If `undefined`, empty, or blank, no paths are excluded.
 * @param pathname - The pathname to test against the include and exclude patterns.
 * @returns `true` if the pathname matches the include patterns and does not match the exclude patterns; otherwise, `false`.
 */
export function handlerFilter(
	includePaths: string | string[] | undefined,
	excludePaths: string | string[] | undefined,
	pathname: string
) {
	const include = matchFilterCheck(includePaths, pathname, true);
	const exclude = matchFilterCheck(excludePaths, pathname, false);
	return include && !exclude;
}

/**
 * Comparator function to sort numbers by priority, with lower numbers executing first.
 *
 * If a priority value is `undefined` or `null`, it defaults to `Number.MAX_SAFE_INTEGER`,
 * ensuring that items without a set priority are sorted to the end of the array.
 * If both values are not set, their order is preserved.
 *
 * @param a - The first priority value to compare.
 * @param b - The second priority value to compare.
 * @returns A negative number if `a` should come before `b`, a positive number if `b` should come before `a`, or zero if they are equal.
 */
export const sortByPriority = (a?: number | null, b?: number | null) => {
	const priorityA = a ?? Number.MAX_SAFE_INTEGER;
	const priorityB = b ?? Number.MAX_SAFE_INTEGER;
	return priorityA - priorityB;
};

/**
 * Builds and executes a sequence of middleware handlers based on the current request pathname.
 *
 * Filters the provided router entries by matching the request pathname against their `includePaths` and `excludePaths`
 * using `micromatch`. Only handlers whose paths match the inclusion criteria and do not match the exclusion criteria
 * are included in the sequence. The resulting handlers are wrapped with `defineMiddleware` and executed in order.
 * If no handlers match, the `next` middleware is called directly.
 *
 * @param context - The API context containing the request information, including the URL pathname.
 * @param next - The next middleware function to call if no handlers match or after all handlers have executed.
 * @param router - An array of middleware router entries, each specifying path matching rules and a handler.
 * @returns The result of executing the middleware sequence or the next middleware.
 */
export function buildMiddlewareSequence(
	context: APIContext,
	next: MiddlewareNext,
	router: EffectMiddlewareRouterEntry[]
) {
	const pathname = context.url.pathname;

	const handlers = router
		.filter(({ includePaths, excludePaths }) => handlerFilter(includePaths, excludePaths, pathname))
		.sort((a, b) => sortByPriority(a.priority, b.priority))
		.map(({ handler }) => defineMiddleware(handler));

	if (handlers.length === 0) return next();

	return sequence(...handlers)(context, next);
}
