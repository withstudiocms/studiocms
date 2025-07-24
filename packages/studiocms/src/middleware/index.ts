import { User, VerifyEmail } from 'studiocms:auth/lib';
import { dashboardConfig } from 'studiocms:config';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import SCMSUiVersion from 'studiocms:ui/version';
import SCMSVersion from 'studiocms:version';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../lib/effects/index.js';
import { type Router, defineMiddlewareRouter, getUserPermissions } from './utils.js';

const dashboardRoute = dashboardConfig.dashboardRouteOverride || 'dashboard';

const fallbackSiteConfig = {
	lastCacheUpdate: new Date(),
	data: {
		defaultOgImage: null,
		description: 'A StudioCMS Project',
		diffPerPage: 10,
		enableDiffs: false,
		enableMailer: false,
		gridItems: [],
		hideDefaultIndex: false,
		loginPageBackground: 'studiocms-curves',
		loginPageCustomImage: null,
		siteIcon: null,
		title: 'StudioCMS-Setup',
	},
};

// Define a middleware router that routes requests to different handlers based on the request path.
const router: Router = {};

/**
 * Middleware function for handling StudioCMS-specific context initialization.
 * This middleware performs the following operations:
 * - Retrieves the latest version of the StudioCMS SDK.
 * - Fetches the site configuration.
 * - Retrieves user session data.
 * - Checks if email verification is enabled.
 * - Determines the user's permission level.
 * - Populates the `context.locals` object with various StudioCMS-related data.
 *
 * @param context - The API context object containing request and response information.
 * @param next - The next middleware function in the chain to be executed.
 *
 * @returns A generator function that yields effects for SDK, user, and email operations,
 *          and then proceeds to the next middleware.
 */
router['/**'] = async (context, next) =>
	await convertToVanilla(
		genLogger('studiocms/middleware/middlewareEffect')(function* () {
			const {
				GET: { latestVersion, siteConfig },
			} = yield* SDKCore;
			const { getUserData } = yield* User;
			const { isEmailVerificationEnabled } = yield* VerifyEmail;

			const [version, siteConf, userSessionData, emailVerificationEnabled] = yield* Effect.all([
				latestVersion(),
				siteConfig(),
				getUserData(context),
				isEmailVerificationEnabled(),
			]);

			const userPermissionLevel = yield* getUserPermissions(userSessionData);

			context.locals.SCMSGenerator = `StudioCMS v${SCMSVersion}`;
			context.locals.SCMSUiGenerator = `StudioCMS UI v${SCMSUiVersion}`;
			context.locals.latestVersion = version;
			context.locals.siteConfig = siteConf || fallbackSiteConfig;
			context.locals.defaultLang = defaultLang;
			context.locals.routeMap = StudioCMSRoutes;
			context.locals.userSessionData = userSessionData;
			context.locals.emailVerificationEnabled = emailVerificationEnabled;
			context.locals.userPermissionLevel = userPermissionLevel;

			return next();
		}).pipe(
			Effect.provide(User.Default),
			Effect.provide(VerifyEmail.Default)
		)
	);

/**
 * Middleware function to ensure that the user is logged in before accessing any dashboard routes.
 * If the user is not logged in, they are redirected to the login page.
 *
 * @param context - The API context object containing request and response information.
 * @param next - The next middleware function in the chain to be executed.
 *
 * @returns A generator function that checks the user's session data and redirects if necessary.
 */
router[`/${dashboardRoute}/!(login|signup|logout|forgot-password)**`] = async (context, next) =>
	await convertToVanilla(
		genLogger('studiocms/middleware/middlewareEffect')(function* () {
			const { getUserData } = yield* User;

			const userSessionData = yield* getUserData(context);

			if (!userSessionData.isLoggedIn) return context.redirect(StudioCMSRoutes.authLinks.loginURL);

			return next();
		}).pipe(Effect.provide(User.Default))
	);

export const onRequest = defineMiddlewareRouter(router);
