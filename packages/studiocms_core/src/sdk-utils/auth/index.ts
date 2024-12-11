import type { STUDIOCMS_SDK } from '../types';
import authOAuth from './oAuth';
import authPermission from './permission';
import authSession from './session';
import authUser from './user';

export { authUser, authOAuth, authPermission, authSession };

/**
 * Utilities for the `@studiocms/auth` package to interact
 * 		with the StudioCMS SDK
 */
export const studioCMS_SDK_AUTH: STUDIOCMS_SDK['AUTH'] = {
	session: authSession,
	user: authUser,
	permission: authPermission,
	oAuth: authOAuth,
};

export default studioCMS_SDK_AUTH;
