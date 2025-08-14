import { Session } from 'studiocms:auth/lib';
import type { SessionValidationResult, UserSessionData } from 'studiocms:auth/lib/types';
import { logger as _logger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext } from 'astro';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	parseAPIContextJson,
	Schema,
} from '../../../effect.js';

/**
 * Represents the JSON data structure for verifying a session in the dashboard API.
 *
 * @remarks
 * This class extends a schema definition for type-safe validation.
 *
 * @property originPathname - The original pathname as a string.
 */
export class JsonData extends Schema.Class<JsonData>('JsonData')({
	originPathname: Schema.String,
}) {}

/**
 * Represents the response data for verifying a user session on the dashboard API.
 *
 * @property isLoggedIn - Indicates whether the user is currently logged in.
 * @property user - The authenticated user's information, or `null` if not logged in.
 * @property user.id - The unique identifier of the user.
 * @property user.name - The display name of the user.
 * @property user.email - The user's email address, or `null` if not available.
 * @property user.avatar - The URL to the user's avatar image, or `null` if not set.
 * @property user.username - The user's unique username.
 * @property permissionLevel - The user's permission level, as defined in `UserSessionData`.
 * @property routes - An object containing route paths relevant to the dashboard.
 * @property routes.logout - The route for logging out.
 * @property routes.userProfile - The route to the user's profile page.
 * @property routes.contentManagement - The route for content management.
 * @property routes.dashboardIndex - The route to the dashboard index page.
 */
type ResponseData = {
	isLoggedIn: boolean;
	user: {
		id: string;
		name: string;
		email: string | null;
		avatar: string | null;
		username: string;
	} | null;
	permissionLevel: UserSessionData['permissionLevel'];
	routes: {
		logout: string;
		userProfile: string;
		contentManagement: string;
		dashboardIndex: string;
	};
};

/**
 * Builds a JSON HTTP response containing session verification data for the dashboard API.
 *
 * @param context - The API context containing local route mappings and other request-specific data.
 * @param isLoggedIn - Indicates whether the user is currently logged in.
 * @param user - The validated user object from the session, or `null` if not logged in.
 * @param permissionLevel - The user's permission level within the session.
 * @returns A `Response` object with a JSON body containing login status, user info, permission level, and relevant route URLs.
 */
const responseBuilder = (
	context: APIContext,
	isLoggedIn: boolean,
	user: SessionValidationResult['user'],
	permissionLevel: UserSessionData['permissionLevel']
) => {
	const data: ResponseData = {
		isLoggedIn,
		user: user
			? {
					id: user.id,
					name: user.name,
					email: user.email,
					avatar: user.avatar,
					username: user.username,
				}
			: null,
		permissionLevel: permissionLevel,
		routes: {
			logout: context.locals.StudioCMS.routeMap.authLinks.logoutURL,
			userProfile: context.locals.StudioCMS.routeMap.mainLinks.userProfile,
			contentManagement: context.locals.StudioCMS.routeMap.mainLinks.contentManagement,
			dashboardIndex: context.locals.StudioCMS.routeMap.mainLinks.dashboardIndex,
		},
	};

	return createJsonResponse(data);
};

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/verify-session.POST')(function* () {
				const [ses, sdk] = yield* Effect.all([Session, SDKCore]);

				const logger = _logger.fork('studiocms:runtime:api:verify-session');

				const { cookies } = ctx;

				const { originPathname } = yield* parseAPIContextJson(ctx, JsonData);

				const sessionToken = cookies.get(Session.sessionCookieName)?.value ?? null;

				if (!sessionToken) {
					logger.info(
						`No session token found in cookies, returning unknown session status. Origin: ${originPathname}`
					);
					return responseBuilder(ctx, false, null, 'unknown');
				}

				const { session, user } = yield* ses.validateSessionToken(sessionToken);

				if (session === null) {
					yield* ses.deleteSessionTokenCookie(ctx);
					logger.info(
						`Session token is invalid or expired, deleting cookie. Origin: ${originPathname}`
					);
					return responseBuilder(ctx, false, null, 'unknown');
				}

				if (!user || user === null) {
					logger.info(
						`No user found for session token, returning unknown session status. Origin: ${originPathname}`
					);
					return responseBuilder(ctx, false, null, 'unknown');
				}

				const result = yield* sdk.AUTH.permission.currentStatus(user.id);

				if (!result) {
					logger.error(
						`Failed to retrieve permission status for user ${user.id}, returning unknown session status. Origin: ${originPathname}`
					);
					return responseBuilder(ctx, false, null, 'unknown');
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

				return responseBuilder(ctx, true, user, permissionLevel);
			}).pipe(Session.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
