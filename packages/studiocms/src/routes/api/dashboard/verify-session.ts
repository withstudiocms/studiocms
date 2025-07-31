import { Session } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import { logger as _logger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect, Schema } from '../../../effect.js';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

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
 * Parses and validates JSON data from the API request context.
 *
 * This function attempts to read the JSON body from the incoming request,
 * then decodes and validates it against the `JsonData` schema.
 *
 * @param context - The API context containing the request object.
 * @returns An Effect that yields the validated and parsed data.
 * @throws If the request body cannot be parsed as JSON or fails schema validation.
 */
export const getParsedData = (context: APIContext) =>
	Effect.gen(function* () {
		const jsonData = yield* Effect.tryPromise(() => context.request.json());
		return yield* Schema.decodeUnknown(JsonData)(jsonData);
	});

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

const responseBuilder = (
	context: APIContext,
	isLoggedIn: boolean,
	user: UserData | null,
	permissionLevel: PermissionLevel
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
			logout: context.locals.routeMap.authLinks.logoutURL,
			userProfile: context.locals.routeMap.mainLinks.userProfile,
			contentManagement: context.locals.routeMap.mainLinks.contentManagement,
			dashboardIndex: context.locals.routeMap.mainLinks.dashboardIndex,
		},
	};

	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

/**
 * Handles POST requests to verify the user's session and return session details.
 *
 * This API route performs the following steps:
 * - Retrieves the session token from cookies.
 * - Validates the session token and user.
 * - Determines the user's permission level using the SDKCore.
 * - Returns a JSON response with user info, permission level, and relevant dashboard routes.
 * - If the session token or user is invalid, returns a 400 error response.
 *
 * @param context - The API context containing cookies and route information.
 * @returns A Response object with session verification results or an error message.
 */
export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/verify-session.POST')(function* () {
			const ses = yield* Session;
			const sdk = yield* SDKCore;

			const logger = _logger.fork('studiocms:runtime:api:verify-session');

			const { cookies } = context;

			const { originPathname } = yield* getParsedData(context);

			const sessionToken = cookies.get(Session.sessionCookieName)?.value ?? null;

			if (!sessionToken) {
				logger.info(
					`No session token found in cookies, returning unknown session status. Origin: ${originPathname}`
				);
				return responseBuilder(
					context,
					false,
					null,
					'unknown'
				);
			}

			const { session, user } = yield* ses.validateSessionToken(sessionToken);

			if (session === null) {
				yield* ses.deleteSessionTokenCookie(context);
				logger.info(
					`Session token is invalid or expired, deleting cookie. Origin: ${originPathname}`
				);
				return responseBuilder(
					context,
					false,
					null,
					'unknown'
				);
			}

			if (!user || user === null) {
				logger.info(
					`No user found for session token, returning unknown session status. Origin: ${originPathname}`
				);
				return responseBuilder(
					context,
					false,
					null,
					'unknown'
				);
			}

			const result = yield* sdk.AUTH.permission.currentStatus(user.id);

			if (!result) {
				logger.error(
					`Failed to retrieve permission status for user ${user.id}, returning unknown session status. Origin: ${originPathname}`
				);
				return responseBuilder(
					context,
					false,
					null,
					'unknown'
				);
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

			return responseBuilder(
				context,
				true,
				user,
				permissionLevel
			);
		}).pipe(Session.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
