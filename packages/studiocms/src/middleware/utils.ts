import { User } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import type { MiddlewareHandler } from 'astro';
import { defineMiddleware, sequence } from 'astro/middleware';
import micromatch from 'micromatch';
import { genLogger } from '../lib/effects/index.js';

/**
 * Middleware Router Type.
 */
export type Router = Record<string, MiddlewareHandler>;

const excludePaths = (dashboardRoute: string): string[] => [
  '/_web-vitals**',
  `/${dashboardRoute}/login**`,
  `/${dashboardRoute}/signup**`,
  `/${dashboardRoute}/logout**`,
  `/${dashboardRoute}/forgot-password**`
];

/**
 * Define a middleware router that routes requests to different handlers based on the request path.
 *
 * @example
 * ```ts
 * const router: Router = {};
 * router["/"] = (context, next) => {};
 * router["/about"] = (context, next) => {};
 * export const onRequest = defineMiddlewareRouter(router);
 * ```
 */
export function defineMiddlewareRouter(router: Router, dashboardRoute: string): MiddlewareHandler {
	const entries = Object.entries(router);
	return defineMiddleware((context, next) => {
		return sequence(
			...entries
				.filter(([path]) => (micromatch.isMatch(context.url.pathname, path)) && !micromatch.isMatch(context.url.pathname, excludePaths(dashboardRoute)))
				.map(([_, handler]) => handler)
		)(context, next);
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
