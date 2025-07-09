import { Session } from 'studiocms:auth/lib';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	return POST(context);
};

export const POST: APIRoute = async (context: APIContext): Promise<Response> =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/logout/POST')(function* () {
			const s = yield* Session;

			const { cookies, redirect } = context;

			const sessionToken = cookies.get(Session.sessionCookieName)?.value ?? null;

			if (!sessionToken) return redirect(context.locals.routeMap.authLinks.loginURL);

			const { session, user } = yield* s.validateSessionToken(sessionToken);

			// If there is no session, redirect to the login page
			if (session === null) {
				yield* s.deleteSessionTokenCookie(context);
				return redirect(context.locals.routeMap.authLinks.loginURL);
			}

			// If there is no user, redirect to the login page
			if (!user || user === null) {
				return redirect(context.locals.routeMap.authLinks.loginURL);
			}

			// Invalidate the session and delete the session token cookie
			yield* s.invalidateSession(user.id);
			yield* s.deleteSessionTokenCookie(context);

			return redirect(context.locals.routeMap.mainLinks.baseSiteURL);
		}).pipe(Session.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET', 'POST']);

export const ALL: APIRoute = async () => AllResponse();
