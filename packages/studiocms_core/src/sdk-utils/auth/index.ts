import type { STUDIOCMS_SDK } from '../types';
import StudioCMS_SDK_AUTHOAuth from './oAuth';
import StudioCMS_SDK_AUTHPermission from './permission';
import StudioCMS_SDK_AUTHSession from './session';
import StudioCMS_SDK_AUTHUser from './user';

/**
 * Utilities for the `@studiocms/auth` package to interact
 * 		with the StudioCMS SDK
 */
export const StudioCMS_SDK_AUTH: STUDIOCMS_SDK['AUTH'] = {
	session: StudioCMS_SDK_AUTHSession,
	user: StudioCMS_SDK_AUTHUser,
	permission: StudioCMS_SDK_AUTHPermission,
	oAuth: StudioCMS_SDK_AUTHOAuth,
};

export default StudioCMS_SDK_AUTH;
