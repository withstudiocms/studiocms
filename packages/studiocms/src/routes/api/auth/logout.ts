import { Session } from 'studiocms:auth/lib';
import { StudioCMSRoutes } from 'studiocms:lib';
import type { APIContext, APIRoute } from 'astro';
import { AllResponse, defineAPIRoute, genLogger, OptionsResponse } from '../../../effect.js';

export const GET: APIRoute = async (context: APIContext) => POST(context);

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/auth/logout/POST')(function* () {
			const { validateSessionToken, deleteSessionTokenCookie, invalidateSession } = yield* Session;

			const { cookies, redirect } = ctx;

			const sessionToken = cookies.get(Session.sessionCookieName)?.value ?? null;

			if (!sessionToken) return redirect(StudioCMSRoutes.authLinks.loginURL);

			const { session, user } = yield* validateSessionToken(sessionToken);

			// If there is no session, redirect to the login page
			if (session === null) {
				yield* deleteSessionTokenCookie(ctx);
				return redirect(StudioCMSRoutes.authLinks.loginURL);
			}

			// If there is no user, redirect to the login page
			if (!user || user === null) {
				return redirect(StudioCMSRoutes.authLinks.loginURL);
			}

			// Invalidate the session and delete the session token cookie
			yield* invalidateSession(user.id);
			yield* deleteSessionTokenCookie(ctx);

			return redirect(StudioCMSRoutes.mainLinks.baseSiteURL);
		}).pipe(Session.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET', 'POST'] });

export const ALL: APIRoute = async () => AllResponse();
