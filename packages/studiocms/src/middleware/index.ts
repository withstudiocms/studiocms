import crypto from 'node:crypto';
import { User, VerifyEmail } from 'studiocms:auth/lib';
import { dashboardConfig } from 'studiocms:config';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import type { SiteConfigCacheObject } from 'studiocms:sdk/types';
import SCMSUiVersion from 'studiocms:ui/version';
import SCMSVersion from 'studiocms:version';
import { Effect, Layer } from 'effect';
import { convertToVanilla, genLogger } from '../lib/effects/index.js';
import { defineMiddlewareRouter, getUserPermissions, type Router } from './utils.js';

const dashboardRoute = dashboardConfig.dashboardRouteOverride || 'dashboard';

const fallbackSiteConfig: SiteConfigCacheObject = {
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

const mainRouteEffectDeps = Layer.merge(User.Default, VerifyEmail.Default);

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
router['/**'] = {
	handlers: [
		async (context, next) =>
			await convertToVanilla(
				genLogger('studiocms/middleware/middlewareEffect')(function* () {
					const {
						GET: { latestVersion, siteConfig },
						MIDDLEWARES: { verifyCache },
					} = yield* SDKCore;

					const [version, siteConf] = yield* Effect.all([
						latestVersion(),
						siteConfig(),
						verifyCache(),
					]);

					context.locals.SCMSGenerator = `StudioCMS v${SCMSVersion}`;
					context.locals.SCMSUiGenerator = `StudioCMS UI v${SCMSUiVersion}`;
					context.locals.latestVersion = version;
					context.locals.siteConfig = siteConf || fallbackSiteConfig;
					context.locals.defaultLang = defaultLang;
					context.locals.routeMap = StudioCMSRoutes;

					return next();
				})
			),
	],
};

/**
 * Middleware function to handle the main route effect for the dashboard.
 * This middleware retrieves user session data, checks if email verification is enabled,
 * and determines the user's permission level. It populates the `context.locals` object
 * with this information for use in subsequent middleware or route handlers.
 *
 * @param context - The API context object containing request and response information.
 * @param next - The next middleware function in the chain to be executed.
 *
 * @returns A generator function that yields effects for user and email operations,
 *          and then proceeds to the next middleware.
 */
router[`/${dashboardRoute}/**`] = {
	handlers: [
		async (context, next) =>
			await convertToVanilla(
				genLogger('studiocms/middleware/mainRouteEffect')(function* () {
					const [{ getUserData }, { isEmailVerificationEnabled }] = yield* Effect.all([
						User,
						VerifyEmail,
					]);

					const [userSessionData, emailVerificationEnabled] = yield* Effect.all([
						getUserData(context),
						isEmailVerificationEnabled(),
					]);

					const userPermissionLevel = yield* getUserPermissions(userSessionData);

					context.locals.userSessionData = userSessionData;
					context.locals.emailVerificationEnabled = emailVerificationEnabled;
					context.locals.userPermissionLevel = userPermissionLevel;

					return next();
				}).pipe(Effect.provide(mainRouteEffectDeps))
			),
	],
};

/**
 * Middleware function to ensure that the user is logged in before accessing any dashboard routes.
 * If the user is not logged in, they are redirected to the login page.
 *
 * @param context - The API context object containing request and response information.
 * @param next - The next middleware function in the chain to be executed.
 *
 * @returns A generator function that checks the user's session data and redirects if necessary.
 */
router[`/${dashboardRoute}/**`] = {
	excludePaths: [
		`/${dashboardRoute}/login**`,
		`/${dashboardRoute}/signup**`,
		`/${dashboardRoute}/logout**`,
		`/${dashboardRoute}/forgot-password**`,
	],
	handlers: [
		async (context, next) =>
			await convertToVanilla(
				genLogger('studiocms/middleware/middlewareEffect')(function* () {
					const { getUserData } = yield* User;

					const userSessionData = yield* getUserData(context);

					if (!userSessionData.isLoggedIn)
						return context.redirect(StudioCMSRoutes.authLinks.loginURL);

					return next();
				}).pipe(Effect.provide(User.Default))
			),
	],
};

// TODO: Add a way for plugins to enable CSRF protection on their own editors
/**
 * Middleware function to set a CSRF token for the WYSIWYG editor.
 * This middleware generates a new CSRF token and sets it in the cookies
 * for the WYSIWYG editor routes.
 *
 * @param context - The API context object containing request and response information.
 * @param next - The next middleware function in the chain to be executed.
 *
 * @returns A generator function that generates a CSRF token and sets it in the cookies.
 */
router[`/${dashboardRoute}/content-management/edit/**`] = {
	handlers: [
		async (context, next) => {
			const csrfToken = crypto.randomBytes(32).toString('hex');
			context.cookies.set('wysiwyg-csrf-token', csrfToken, {
				httpOnly: true,
				path: '/',
				sameSite: 'strict',
				secure: context.url.protocol === 'https:',
				maxAge: 60 * 60 * 2,
			});

			context.locals.wysiwygCsrfToken = csrfToken;

			return next();
		},
	],
};

export const onRequest = defineMiddlewareRouter(router);
