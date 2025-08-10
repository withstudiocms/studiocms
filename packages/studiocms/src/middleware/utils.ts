import { User } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import type { MiddlewareHandler } from 'astro';
import { defineMiddleware, sequence } from 'astro/middleware';
import micromatch from 'micromatch';
import { genLogger } from '../lib/effects/index.js';

/**
 * Represents an array of route configuration objects for middleware.
 *
 * Each route configuration object can specify:
 * - `includePaths`: Path(s) to include for the middleware. Can be a string or an array of strings.
 * - `excludePaths`: Optional path(s) to exclude from the middleware. Can be a string or an array of strings.
 * - `handler`: The middleware handler function to execute for the matched paths.
 */
export type Router = {
	includePaths: string | string[];
	excludePaths?: string | string[];
	handler: MiddlewareHandler;
}[];

/**
 * Defines a middleware router that filters and executes middleware handlers based on the request pathname.
 *
 * This function takes a `Router` object, which contains route definitions with `includePaths` and `excludePaths`.
 * It matches the current request's pathname against these paths using `micromatch`, and executes all matching handlers in sequence.
 *
 * - If no handlers match, the next middleware in the chain is called.
 * - If multiple handlers match, they are executed in order.
 *
 * @param router - The router containing route definitions with `includePaths`, `excludePaths`, and their respective handlers.
 * @returns A `MiddlewareHandler` that processes the request according to the matched route handlers.
 */
export function defineMiddlewareRouter(router: Router): MiddlewareHandler {
	return defineMiddleware((context, next) => {
		// Extract the pathname from the request URL
		// This is used to match against the `includePaths` and `excludePaths`
		// defined in the router.
		const pathname = context.url.pathname;

		// Filter the router to find handlers that match the current pathname
		// based on the include and exclude paths.
		const handlers = router
			.filter(({ includePaths, excludePaths }) => {
				// Check if the pathname matches any of the include paths
				// If no include paths are specified, default to true (include all).
				const include = micromatch.isMatch(pathname, includePaths);

				// Check if the pathname matches any of the exclude paths
				// If no exclude paths are specified, default to false (do not exclude).
				const exclude = excludePaths ? micromatch.isMatch(pathname, excludePaths) : false;

				// Return true if the pathname matches the include paths and does not match the exclude paths.
				return include && !exclude;
			})
			.map(({ handler }) => handler);

		// If no handlers match, proceed to the next middleware.
		if (handlers.length === 0) return next();

		// Execute the matched handlers in sequence.
		// This allows for multiple middleware functions to be executed in order.
		return sequence(...handlers)(context, next);
	});
}

/**
 * Retrieves the user's permission levels based on their session data.
 *
 * @param userData - The session data of the user.
 * @returns An object containing boolean flags indicating the user's permission levels:
 * - `isVisitor`: True if the user has at least visitor-level permissions.
 * - `isEditor`: True if the user has at least editor-level permissions.
 * - `isAdmin`: True if the user has at least admin-level permissions.
 * - `isOwner`: True if the user has owner-level permissions.
 */
export const getUserPermissions = (userData: UserSessionData) =>
	genLogger('studiocms/middleware/utils/getUserPermissions')(function* () {
		const { getUserPermissionLevel } = yield* User;
		const userPermissionLevel = yield* getUserPermissionLevel(userData);

		return {
			isVisitor: userPermissionLevel >= User.UserPermissionLevel.visitor,
			isEditor: userPermissionLevel >= User.UserPermissionLevel.editor,
			isAdmin: userPermissionLevel >= User.UserPermissionLevel.admin,
			isOwner: userPermissionLevel >= User.UserPermissionLevel.owner,
		};
	});
