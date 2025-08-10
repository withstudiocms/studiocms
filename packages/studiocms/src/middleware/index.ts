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
const router: Router = [
	{
		/**
		 * Main middleware function that sets up the context for the StudioCMS application.
		 * It initializes the generator for the StudioCMS version, UI version, latest version,
		 * site configuration, default language, and route map.
		 */
		includePaths: ['/**'],
		handler: async (context, next) => {
			return convertToVanilla(
				genLogger('studiocms/middleware/mainMiddleware')(function* () {
					const { GET } = yield* SDKCore;

					const [latestVersion, siteConfig] = yield* Effect.all([
						GET.latestVersion(),
						GET.siteConfig(),
					]);

					context.locals.StudioCMS = {
						SCMSGenerator: `StudioCMS v${SCMSVersion}`,
						SCMSUiGenerator: `StudioCMS UI v${SCMSUiVersion}`,
						siteConfig: siteConfig || fallbackSiteConfig,
						routeMap: StudioCMSRoutes,
						defaultLang,
						latestVersion,
					};

					// Set deprecated locals for backward compatibility
					context.locals.SCMSGenerator = `StudioCMS v${SCMSVersion}`;
					context.locals.SCMSUiGenerator = `StudioCMS UI v${SCMSUiVersion}`;
					context.locals.latestVersion = latestVersion;
					context.locals.siteConfig = siteConfig || fallbackSiteConfig;
					context.locals.defaultLang = defaultLang;
					context.locals.routeMap = StudioCMSRoutes;

					return next();
				})
			);
		},
	},
	{
		/**
		 * Middleware function to handle the main route for the dashboard.
		 * This middleware sets up the user session data, email verification status,
		 * and user permission levels for the dashboard routes.
		 */
		includePaths: [`/${dashboardRoute}/**`],
		handler: async (context, next) =>
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

					context.locals.StudioCMS.security = {
						userSessionData,
						emailVerificationEnabled,
						userPermissionLevel,
					};

					// Set deprecated locals for backward compatibility
					context.locals.userSessionData = userSessionData;
					context.locals.emailVerificationEnabled = emailVerificationEnabled;
					context.locals.userPermissionLevel = userPermissionLevel;

					return next();
				}).pipe(Effect.provide(mainRouteEffectDeps))
			),
	},
	{
		/**
		 * Middleware function to handle user authentication for the dashboard.
		 * This middleware checks if the user is logged in and redirects to the login page if not
		 * authenticated. It also excludes certain paths from this check, such as login, signup,
		 * logout, and forgot password routes.
		 */
		includePaths: [`/${dashboardRoute}/**`],
		excludePaths: [
			`/${dashboardRoute}/login**`,
			`/${dashboardRoute}/signup**`,
			`/${dashboardRoute}/logout**`,
			`/${dashboardRoute}/forgot-password**`,
		],
		handler: async (context, next) =>
			await convertToVanilla(
				genLogger('studiocms/middleware/middlewareEffect')(function* () {
					const { getUserData } = yield* User;

					const userSessionData = yield* getUserData(context);

					if (!userSessionData.isLoggedIn)
						return context.redirect(StudioCMSRoutes.authLinks.loginURL);

					return next();
				}).pipe(Effect.provide(User.Default))
			),
	},
	{
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
		includePaths: [`/${dashboardRoute}/content-management/edit/**`],
		handler: async (context, next) => {
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
	},
];

export const onRequest = defineMiddlewareRouter(router);
