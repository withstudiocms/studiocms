import type { UserSessionData } from 'studiocms:auth/lib/types';
import { User, UserPermissionLevel } from 'studiocms:auth/lib/user';
import { genLogger } from '../lib/effects/index.js';

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
		const user = yield* User;

		const userPermissionLevel = yield* user.getUserPermissionLevel(userData);

		return {
			isVisitor: userPermissionLevel >= UserPermissionLevel.visitor,
			isEditor: userPermissionLevel >= UserPermissionLevel.editor,
			isAdmin: userPermissionLevel >= UserPermissionLevel.admin,
			isOwner: userPermissionLevel >= UserPermissionLevel.owner,
		};
	});
