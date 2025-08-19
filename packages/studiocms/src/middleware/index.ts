import crypto from 'node:crypto';
import { User, VerifyEmail } from 'studiocms:auth/lib';
import { dashboardConfig } from 'studiocms:config';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import SCMSUiVersion from 'studiocms:ui/version';
import SCMSVersion from 'studiocms:version';
import { STUDIOCMS_EDITOR_CSRF_COOKIE_NAME } from '../consts.js';
import { defineMiddlewareRouter, Effect } from '../effect.js';
import { getUserPermissions, makeFallbackSiteConfig, SetLocal, setLocals } from './utils.js';

// Import the dashboard route override from the configuration
// If no override is set, it defaults to 'dashboard'
// This allows for flexibility in the dashboard route without hardcoding it
const dashboardRoute = dashboardConfig.dashboardRouteOverride || 'dashboard';

/**
 * Main middleware sequence for StudioCMS.
 *
 * This middleware sets up the base context locals for StudioCMS, including the generator version,
 * site configuration, route map, and default language. It also handles user session data,
 * email verification status, and user permission levels for the dashboard routes.
 * Additionally, it manages CSRF token setup for the editor and ensures that the user is authenticated
 * for dashboard routes, redirecting to the login page if not authenticated.
 */
export const onRequest = defineMiddlewareRouter([
	{
		/**
		 * Middleware function to handle the main locals setup for StudioCMS.
		 * This middleware sets the base context locals for StudioCMS, including the generator version,
		 * site configuration, route map, and default language.
		 */
		includePaths: ['/**'],
		excludePaths: ['/_studiocms-devapps/**', '/_web-vitals**'],
		priority: 1,
		handler: Effect.fn(function* (context, next) {
			const {
				GET,
				MIDDLEWARES: { verifyCache },
			} = yield* SDKCore;

			if (!['/studiocms_api/dashboard/verify-session'].includes(context.url.pathname)) {
				yield* verifyCache();
			}

			const [latestVersion, siteConfig] = yield* Effect.all([
				GET.latestVersion(),
				GET.siteConfig(),
			]);

			// Set the StudioCMS base context locals
			yield* setLocals(context, SetLocal.GENERAL, {
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
		}),
	},
	{
		/**
		 * Middleware function to handle the main route for the dashboard.
		 * This middleware sets up the user session data, email verification status,
		 * and user permission levels for the dashboard routes.
		 */
		includePaths: [`/${dashboardRoute}/**`, '/studiocms_api/**'],
		priority: 2,
		handler: Effect.fn(function* (context, next) {
			const { getUserData, isEmailVerificationEnabled } = yield* Effect.gen(function* () {
				const [{ getUserData }, { isEmailVerificationEnabled }] = yield* Effect.all([
					User,
					VerifyEmail,
				]);
				return { getUserData, isEmailVerificationEnabled };
			}).pipe(User.Provide, VerifyEmail.Provide);

			// Retrieve the user session data from the context locals or fetch it
			const [userSessionData, emailVerificationEnabled] = yield* Effect.all([
				getUserData(context),
				isEmailVerificationEnabled(),
			]);

			// Get the user permission levels based on the session data
			const userPermissionLevel = yield* getUserPermissions(userSessionData).pipe(User.Provide);

			// Set the security-related data in the context locals
			yield* setLocals(context, SetLocal.SECURITY, {
				userSessionData,
				emailVerificationEnabled,
				userPermissionLevel,
			});

			// Set deprecated locals for backward compatibility
			context.locals.userSessionData = userSessionData;
			context.locals.emailVerificationEnabled = emailVerificationEnabled;
			context.locals.userPermissionLevel = userPermissionLevel;

			// Continue to the next middleware
			return next();
		}),
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
		priority: 3,
		handler: Effect.fn(function* (context, next) {
			const getUserData = yield* Effect.gen(function* () {
				const { getUserData } = yield* User;
				return getUserData;
			}).pipe(User.Provide);

			// Retrieve the user session data from the context locals or fetch it
			const userSessionData =
				context.locals.StudioCMS.security?.userSessionData ?? (yield* getUserData(context));

			// Check if the user is logged in and redirect to the login page if not
			if (!userSessionData.isLoggedIn) return context.redirect(StudioCMSRoutes.authLinks.loginURL);

			// Else, Continue to the next middleware
			return next();
		}),
	},
	{
		/**
		 * Middleware function to handle the CSRF token setup for the editor.
		 * This middleware generates a CSRF token, sets it as a cookie, and updates the context locals
		 * with the CSRF token for use in the editor.
		 */
		includePaths: [`/${dashboardRoute}/content-management/edit/**`],
		priority: 4,
		handler: Effect.fn(function* (context, next) {
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
			yield* setLocals(context, SetLocal.PLUGINS, {
				editorCSRFToken: csrfToken,
			});

			// Set deprecated locals for backward compatibility
			context.locals.wysiwygCsrfToken = csrfToken;

			return next();
		}),
	},
]);
