import { User } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import type { MiddlewareHandler } from 'astro';
import { defineMiddleware, sequence } from 'astro/middleware';
import micromatch from 'micromatch';
import { genLogger } from '../lib/effects/index.js';

/**
 * Represents an array of route configurations for middleware handling.
 *
 * Each route configuration object contains:
 * - `includePaths`: An array of path strings to explicitly include for the middleware.
 * - `excludePaths` (optional): An array of path strings to exclude from the middleware.
 * - `handler`: The middleware handler function to process requests.
 */
export type Router = {
	includePaths: string[];
	excludePaths?: string[];
	handler: MiddlewareHandler;
}[];

/**
 * Defines a middleware router that sequences middleware handlers based on path matching.
 *
 * Filters the provided `router` array to include handlers whose `includePaths` match the current request's pathname
 * and whose `excludePaths` do not match. The resulting handlers are composed into a sequence and executed.
 *
 * @param router - An array of route objects, each containing `includePaths`, `excludePaths`, and a `handler`.
 * @returns A `MiddlewareHandler` that executes the matched handlers in sequence.
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
				const include =
					includePaths == null || (Array.isArray(includePaths) && includePaths.length === 0)
						? true
						: micromatch.isMatch(pathname, includePaths as string | string[]);
				const exclude =
					excludePaths == null || (Array.isArray(excludePaths) && excludePaths.length === 0)
						? false
						: micromatch.isMatch(pathname, excludePaths as string | string[]);
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
