import { defineMiddleware } from 'astro:middleware';
import { User } from 'studiocms:auth/lib/user';
import { VerifyEmail } from 'studiocms:auth/lib/verify-email';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import SCMSUiVersion from 'studiocms:ui/version';
import SCMSVersion from 'studiocms:version';
import type { APIContext, MiddlewareNext } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../lib/effects/index.js';
import { getUserPermissions } from './utils.js';

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
const middlewareEffect = (context: APIContext, next: MiddlewareNext) =>
	genLogger('studiocms/middleware/middlewareEffect')(function* () {
		const sdk = yield* SDKCore;
		const user = yield* User;
		const email = yield* VerifyEmail;

		const [latestVersion, siteConfig, userSessionData, emailVerificationEnabled] =
			yield* Effect.all([
				sdk.GET.latestVersion(),
				sdk.GET.siteConfig(),
				user.getUserData(context),
				email.isEmailVerificationEnabled(),
			]);

		const userPermissionLevel = yield* getUserPermissions(userSessionData);

		context.locals.SCMSGenerator = `StudioCMS v${SCMSVersion}`;
		context.locals.SCMSUiGenerator = `StudioCMS UI v${SCMSUiVersion}`;
		context.locals.latestVersion = latestVersion;
		context.locals.siteConfig = siteConfig;
		context.locals.defaultLang = defaultLang;
		context.locals.routeMap = StudioCMSRoutes;
		context.locals.userSessionData = userSessionData;
		context.locals.emailVerificationEnabled = emailVerificationEnabled;
		context.locals.userPermissionLevel = userPermissionLevel;

		return next();
	}).pipe(
		Effect.provide(SDKCore.Default),
		Effect.provide(User.Default),
		Effect.provide(VerifyEmail.Default)
	);

export const onRequest = defineMiddleware(
	async (context, next) => await convertToVanilla(middlewareEffect(context, next))
);
