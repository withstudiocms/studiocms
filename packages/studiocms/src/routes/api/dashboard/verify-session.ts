import { Session } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import { apiResponseLogger } from 'studiocms:logger';
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

			const { cookies } = context;

			const { originPathname } = yield* getParsedData(context);

			const sessionToken = cookies.get(Session.sessionCookieName)?.value ?? null;

			if (!sessionToken) {
				return apiResponseLogger(
					400,
					`No session token found, User is not logged in. (originUrl: ${originPathname})`
				);
			}

			const { session, user } = yield* ses.validateSessionToken(sessionToken);

			if (session === null) {
				yield* ses.deleteSessionTokenCookie(context);
				return apiResponseLogger(400, `Invalid session token, User is not logged in. (originUrl: ${originPathname})`);
			}

			if (!user || user === null) {
				return apiResponseLogger(400, `Invalid user, User is not logged in. (originUrl: ${originPathname})`);
			}

			const result = yield* sdk.AUTH.permission.currentStatus(user.id);

			if (!result) {
				return apiResponseLogger(400, `Failed to get user permission level from SDKCore. (originUrl: ${originPathname})`);
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
		}).pipe(Session.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
