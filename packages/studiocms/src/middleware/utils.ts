import type { UserSessionData } from 'studiocms:auth/lib/types';
import { UserPermissionLevel, getUserPermissionLevel } from 'studiocms:auth/lib/user';

export const getUserPermissions = (userData: UserSessionData) => {
	const userPermissionLevel = getUserPermissionLevel(userData);
	return {
		isVisitor: userPermissionLevel >= UserPermissionLevel.visitor,
		isEditor: userPermissionLevel >= UserPermissionLevel.editor,
		isAdmin: userPermissionLevel >= UserPermissionLevel.admin,
		isOwner: userPermissionLevel >= UserPermissionLevel.owner,
	};
};
