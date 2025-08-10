import crypto from 'node:crypto';
import { User, VerifyEmail } from 'studiocms:auth/lib';
import { dashboardConfig } from 'studiocms:config';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import SCMSUiVersion from 'studiocms:ui/version';
import SCMSVersion from 'studiocms:version';
import { Effect, Layer } from 'effect';
import { STUDIOCMS_EDITOR_CSRF_COOKIE_NAME } from '../consts.js';
import { convertToVanilla, genLogger } from '../lib/effects/index.js';
import {
	defineMiddlewareRouter,
	getUserPermissions,
	makeFallbackSiteConfig,
	type Router,
	updateLocals,
} from './utils.js';

const dashboardRoute = dashboardConfig.dashboardRouteOverride || 'dashboard';

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
					const {
						GET,
						MIDDLEWARES: { verifyCache },
					} = yield* SDKCore;

					const [latestVersion, siteConfig] = yield* Effect.all([
						GET.latestVersion(),
						GET.siteConfig(),
						verifyCache(),
					]);

					// Set the StudioCMS base context locals
					updateLocals(context, {
						SCMSGenerator: `StudioCMS v${SCMSVersion}`,
						SCMSUiGenerator: `StudioCMS UI v${SCMSUiVersion}`,
						siteConfig: siteConfig ?? makeFallbackSiteConfig(),
						routeMap: StudioCMSRoutes,
						defaultLang,
						latestVersion,
					});

					// Set deprecated locals for backward compatibility
					context.locals.SCMSGenerator = `StudioCMS v${SCMSVersion}`;
					context.locals.SCMSUiGenerator = `StudioCMS UI v${SCMSUiVersion}`;
					context.locals.latestVersion = latestVersion;
					context.locals.siteConfig = siteConfig ?? makeFallbackSiteConfig();
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
		includePaths: [`/${dashboardRoute}/**`, '/studiocms_api/**'],
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

					// Set the security-related data in the context locals
					updateLocals(context, {
						security: {
							userSessionData,
							emailVerificationEnabled,
							userPermissionLevel,
						},
					});

					// Set deprecated locals for backward compatibility
					context.locals.userSessionData = userSessionData;
					context.locals.emailVerificationEnabled = emailVerificationEnabled;
					context.locals.userPermissionLevel = userPermissionLevel;

					return next();
				}).pipe(Effect.provide(Layer.merge(User.Default, VerifyEmail.Default)))
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
			`/${dashboardRoute}/login`,
			`/${dashboardRoute}/login/**`,
			`/${dashboardRoute}/signup`,
			`/${dashboardRoute}/signup/**`,
			`/${dashboardRoute}/logout`,
			`/${dashboardRoute}/logout/**`,
			`/${dashboardRoute}/forgot-password`,
			`/${dashboardRoute}/forgot-password/**`,
		],
		handler: async (context, next) =>
			await convertToVanilla(
				genLogger('studiocms/middleware/middlewareEffect')(function* () {
					const { getUserData } = yield* User;
					const userSessionData =
						context.locals.StudioCMS.security?.userSessionData ?? (yield* getUserData(context));

					if (!userSessionData.isLoggedIn)
						return context.redirect(StudioCMSRoutes.authLinks.loginURL);

					return next();
				}).pipe(Effect.provide(User.Default))
			),
	},
	{
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
			context.cookies.set(STUDIOCMS_EDITOR_CSRF_COOKIE_NAME, csrfToken, {
				httpOnly: true,
				path: '/',
				sameSite: 'strict',
				secure: (() => {
					if (context.url.protocol === 'https:') return true;
					const xfp = context.request.headers.get('x-forwarded-proto')?.toLowerCase() ?? '';
					return xfp
						.split(',')
						.map((s) => s.trim())
						.includes('https');
				})(),
			});

			// Update the context locals with the CSRF token for the editor
			updateLocals(context, {
				plugins: {
					editorCSRFToken: csrfToken,
				},
			});

			// Set deprecated locals for backward compatibility
			context.locals.wysiwygCsrfToken = csrfToken;

			return next();
		},
	},
];

export const onRequest = defineMiddlewareRouter(router);
