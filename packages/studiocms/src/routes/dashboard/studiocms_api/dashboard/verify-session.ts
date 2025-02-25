import {
	deleteSessionTokenCookie,
	sessionCookieName,
	validateSessionToken,
} from 'studiocms:auth/lib/session';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import { StudioCMSRoutes } from 'studiocms:lib';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../utils/simpleResponse.js';

export const POST: APIRoute = async (context: APIContext) => {
	const { cookies } = context;

	const sessionToken = cookies.get(sessionCookieName)?.value ?? null;

	if (!sessionToken) {
		return simpleResponse(400, 'No session token found');
	}

	const { session, user } = await validateSessionToken(sessionToken);

	if (session === null) {
		deleteSessionTokenCookie(context);
		return simpleResponse(400, 'Invalid session token');
	}

	if (!user || user === null) {
		return simpleResponse(400, 'Invalid user');
	}

	const result = await studioCMS_SDK.AUTH.permission.currentStatus(user.id);

	if (!result) {
		return simpleResponse(400, 'Failed to get user permission level');
	}

	let permissionLevel: UserSessionData['permissionLevel'] = 'unknown';

	switch (result.rank) {
		case 'owner':
			permissionLevel = 'owner';
			break;
		case 'admin':
			permissionLevel = 'admin';
			break;
		case 'editor':
			permissionLevel = 'editor';
			break;
		case 'visitor':
			permissionLevel = 'visitor';
			break;
		default:
			permissionLevel = 'unknown';
			break;
	}

	return new Response(
		JSON.stringify({
			isLoggedIn: true,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				avatar: user.avatar,
				name: user.name,
			},
			permissionLevel,
			routes: {
				logout: StudioCMSRoutes.authLinks.logoutURL,
				userProfile: StudioCMSRoutes.mainLinks.userProfile,
				contentManagement: StudioCMSRoutes.mainLinks.contentManagement,
				dashboardIndex: StudioCMSRoutes.mainLinks.dashboardIndex,
			},
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
};
