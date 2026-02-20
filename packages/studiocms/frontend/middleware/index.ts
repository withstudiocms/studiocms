/* v8 ignore start */

/*

  This file is excluded from v8 coverage reports because it is not
  feasible to test the middleware in a unit test environment.

  The middleware relies on the full application context and
  interactions that are better suited for integration or end-to-end testing.

*/

import crypto from 'node:crypto';
import { User, VerifyEmail } from 'studiocms:auth/lib';
import config, { dashboardConfig } from 'studiocms:config';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import SCMSUiVersion from 'studiocms:ui/version';
import SCMSVersion from 'studiocms:version';
import {
	Config,
	defineDataMiddleware,
	defineMiddlewareRouter,
	Effect,
	Layer,
	Logger,
	type LogLevel,
	MiddlewareError,
	Schema,
} from '@withstudiocms/effect';
import { STUDIOCMS_EDITOR_CSRF_COOKIE_NAME } from '#consts';
import { getUserPermissions, makeFallbackSiteConfig, SetLocal, setLocals } from './utils.js';

// Load the log level from the configuration and apply it as a layer
const LogLevelLive = Config.withDefault(
	Config.logLevel('STUDIOCMS_LOGLEVEL'),
	config.logLevel
).pipe(
	Effect.tap((level) => Effect.log(`StudioCMS Middleware Log Level set to: ${level}`)),
	Effect.andThen((level) =>
		// Set the minimum log level
		Logger.minimumLogLevel(level as LogLevel.LogLevel)
	),
	Layer.unwrapEffect, // Convert the effect into a layer
	Layer.provide(Logger.pretty) // Ensure that the Logger.pretty layer is included
);

// Import the dashboard route override from the configuration
// If no override is set, it defaults to 'dashboard'
// This allows for flexibility in the dashboard route without hardcoding it
const dashboardRoute = dashboardConfig.dashboardRouteOverride || 'dashboard';

/**
 * Helper function to create a standard 200 OK response.
 *
 * This function is used to return a successful response from the middleware when access is granted.
 * It simplifies the response creation process and ensures consistency across the middleware handlers.
 *
 * @returns A Response object with a 200 OK status.
 */
const okResponse = () => new Response(null, { status: 200 });

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
			}).pipe(VerifyEmail.Provide);

			// Retrieve the user session data from the context locals or fetch it
			const [userSessionData, emailVerificationEnabled] = yield* Effect.all([
				getUserData(context),
				isEmailVerificationEnabled(),
			]);

			// Get the user permission levels based on the session data
			const userPermissionLevel = yield* getUserPermissions(userSessionData);

			// Set the security-related data in the context locals
			yield* setLocals(context, SetLocal.SECURITY, {
				userSessionData,
				emailVerificationEnabled: emailVerificationEnabled ?? false,
				userPermissionLevel,
			});

			// Continue to the next middleware
			return next();
		}),
	},
	{
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
			`/${dashboardRoute}/password-reset`,
			`/${dashboardRoute}/password-reset/**`,
		],
		priority: 3,
		handler: defineDataMiddleware(
			Schema.Struct({
				'x-required-role': Schema.optional(
					Schema.Literal('owner', 'admin', 'editor', 'visitor', 'none')
				),
				'x-redirect-url': Schema.optional(Schema.String),
			}),
			Effect.fn(
				function* (context, data) {
					const getUserData = (yield* User).getUserData;

					yield* Effect.logDebug('Data middleware received headers:', data);

					// Get the required role from the headers, defaulting to 'none' if not provided
					// This is an 'Opt-in' Middleware
					const requiredRole = data['x-required-role'] ?? 'none';
					const redirectUrl = data['x-redirect-url'] ?? `/${dashboardRoute}`;

					// If the required role is 'none', allow access without checking user data
					if (requiredRole === 'none') {
						yield* Effect.logDebug(
							'No required role specified, allowing access without authentication'
						);
						return okResponse();
					}

					// Retrieve the user session data from the context locals or fetch it
					const userSessionData =
						context.locals.StudioCMS.security?.userSessionData ?? (yield* getUserData(context));

					if (!userSessionData.isLoggedIn) {
						yield* Effect.logDebug('User is not logged in, redirecting to login page');
						return context.redirect(StudioCMSRoutes.authLinks.loginURL);
					}

					yield* Effect.logDebug(
						'User is logged in, checking permissions for required role:',
						requiredRole
					);

					const userPermissionLevel =
						context.locals.StudioCMS.security?.userSessionData.permissionLevel;

					if (!userPermissionLevel) {
						yield* Effect.logDebug(
							'User permission level is missing, redirecting to logout to reset session'
						);
						// How did the user get here? Log them out to reset session
						return context.redirect(`/${dashboardRoute}/logout`);
					}

					yield* Effect.logDebug(
						`User permission level: ${userPermissionLevel}, required role: ${requiredRole}`
					);

					const levels = ['visitor', 'editor', 'admin', 'owner'];
					const userLevelIndex = levels.indexOf(userPermissionLevel);
					const requiredLevelIndex = levels.indexOf(requiredRole);

					if (userLevelIndex < requiredLevelIndex) {
						yield* Effect.logDebug(
							`User does not have required permissions (user level: ${userPermissionLevel}, required level: ${requiredRole}), redirecting to:`,
							redirectUrl
						);
						return context.redirect(redirectUrl);
					}

					yield* Effect.logDebug('User has required permissions, allowing access');
					return okResponse();
				},
				Effect.provide(LogLevelLive),
				Effect.catchAll(
					(cause) => new MiddlewareError({ message: 'Failed to get user data', cause })
				)
			)
		),
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

			return next();
		}),
	},
]);
/* v8 ignore stop */
