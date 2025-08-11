import type { APIContext, MiddlewareNext } from "astro";
import { sequence } from "astro/middleware";
import micromatch from "micromatch";
import { defineMiddleware } from "../middleware.js";
import type { EffectMiddlewareRouterEntry } from "../types.js";


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
): boolean =>
	paths == null ||
	(Array.isArray(paths) && paths.length === 0) ||
	(typeof paths === 'string' && paths.trim() === '')
		? defaultValue
		: micromatch.isMatch(pathname, paths);

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
		.map(({ handler }) => defineMiddleware(handler));

	if (handlers.length === 0) return next();

	return sequence(...handlers)(context, next);
}