import { Session } from 'studiocms:auth/lib';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';

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

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, POST',
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
	});
};
