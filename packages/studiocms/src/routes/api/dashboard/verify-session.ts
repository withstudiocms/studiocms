import { Session } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/verify-session.POST')(function* () {
			const ses = yield* Session;
			const sdk = yield* SDKCore;

			const { cookies } = context;

			const sessionToken = cookies.get(Session.sessionCookieName)?.value ?? null;

			if (!sessionToken) {
				return apiResponseLogger(400, 'No session token found');
			}

			const { session, user } = yield* ses.validateSessionToken(sessionToken);

			if (session === null) {
				yield* ses.deleteSessionTokenCookie(context);
				return apiResponseLogger(400, 'Invalid session token');
			}

			if (!user || user === null) {
				return apiResponseLogger(400, 'Invalid user');
			}

			const result = yield* sdk.AUTH.permission.currentStatus(user.id);

			if (!result) {
				return apiResponseLogger(400, 'Failed to get user permission level');
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
						logout: context.locals.routeMap.authLinks.logoutURL,
						userProfile: context.locals.routeMap.mainLinks.userProfile,
						contentManagement: context.locals.routeMap.mainLinks.contentManagement,
						dashboardIndex: context.locals.routeMap.mainLinks.dashboardIndex,
					},
				}),
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}).pipe(Session.Provide, SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
