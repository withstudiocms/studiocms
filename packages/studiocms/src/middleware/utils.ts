import { User } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import type { MiddlewareHandler } from 'astro';
import { defineMiddleware, sequence } from 'astro/middleware';
import micromatch from 'micromatch';
import { genLogger } from '../lib/effects/index.js';

export type Router = {
	handler: MiddlewareHandler;
	excludePaths?: string[];
	includePaths?: string[];
}[];

export function defineMiddlewareRouter(router: Router): MiddlewareHandler {
	return defineMiddleware((context, next) => {
		return sequence(
			...router
				.filter(({ includePaths = [], excludePaths = [] }) => {
					const pathname = context.url.pathname;
					return (
						micromatch.isMatch(pathname, includePaths) &&
						!micromatch.isMatch(pathname, excludePaths)
					);
				})
				.map(({ handler }) => handler)
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
