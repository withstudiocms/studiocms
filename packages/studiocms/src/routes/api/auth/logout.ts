import { Session } from 'studiocms:auth/lib';
import { StudioCMSRoutes } from 'studiocms:lib';
import { AuthSessionCookieName } from '../../../consts.js';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/auth/logout/POST')(function* () {
				const { validateSessionToken, deleteSessionTokenCookie, invalidateSession } =
					yield* Session;

				const { cookies, redirect } = ctx;

				const sessionToken = cookies.get(AuthSessionCookieName)?.value ?? null;

				if (!sessionToken) return redirect(StudioCMSRoutes.authLinks.loginURL);

				const { session, user } = yield* validateSessionToken(sessionToken);

				// If there is no session, redirect to the login page
				if (session === null) {
					yield* deleteSessionTokenCookie(ctx);
					return redirect(StudioCMSRoutes.authLinks.loginURL);
				}

				// If there is no user, delete cookie and redirect to the login page
				if (!user || user === null) {
					yield* deleteSessionTokenCookie(ctx);
					return redirect(StudioCMSRoutes.authLinks.loginURL);
				}

				// Invalidate the session and delete the session token cookie
				yield* Effect.all([invalidateSession(session.id), deleteSessionTokenCookie(ctx)]);

				return redirect(StudioCMSRoutes.mainLinks.baseSiteURL);
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
