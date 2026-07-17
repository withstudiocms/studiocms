import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import config from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext } from 'astro';
import { LinkNewOAuthCookieName } from 'studiocms/consts';
import { genLogger } from 'studiocms/effect';

/**
 * Handles the OAuth callback flow for a user whose provider ID is already linked to an
 * existing account. Verifies email status, creates a session, and redirects to the dashboard.
 *
 * @param context - The current API context.
 * @param existingOAuthAccount - The existing linked OAuth account record (must have `userId`).
 */
export const handleExistingOAuthAccount = (
	context: APIContext,
	existingOAuthAccount: { userId: string }
) =>
	genLogger('studiocms/oauth/shared/handleExistingOAuthAccount')(function* () {
		const { redirect } = context;
		const sdk = yield* SDKCore;
		const { isEmailVerified } = yield* VerifyEmail;
		const { createUserSession } = yield* Session;

		const user = yield* sdk.GET.users.byId(existingOAuthAccount.userId);

		if (!user) {
			return new Response('User not found', { status: 404 });
		}

		const isEmailAccountVerified = yield* isEmailVerified(user);

		// If Mailer is enabled, is the user verified?
		if (!isEmailAccountVerified) {
			return new Response('Email not verified, please verify your account first.', {
				status: 400,
			});
		}

		yield* createUserSession(user.id, context);
		return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
	});

/**
 * Handles linking a new OAuth provider to an already-authenticated user.
 *
 * If the user is not logged in or the link-new-OAuth cookie is absent, returns `null` to
 * signal that the caller should fall through to the new-user creation flow.
 *
 * @param context - The current API context.
 * @param providerId - The OAuth provider identifier string (e.g. `'github'`).
 * @param providerUserId - The provider-scoped user identifier (always a string).
 * @returns A `Response`/redirect when linking succeeds, or `null` when not applicable.
 */
export const handleOAuthLinking = (
	context: APIContext,
	providerId: string,
	providerUserId: string
) =>
	genLogger('studiocms/oauth/shared/handleOAuthLinking')(function* () {
		const { cookies, redirect } = context;
		const sdk = yield* SDKCore;
		const { isEmailVerified } = yield* VerifyEmail;
		const { createUserSession } = yield* Session;
		const { getUserData } = yield* User;

		const loggedInUser = yield* getUserData(context);
		const linkNewOAuth = !!cookies.get(LinkNewOAuthCookieName)?.value;

		if (loggedInUser.user && linkNewOAuth) {
			const existingUser = yield* sdk.GET.users.byId(loggedInUser.user.id);

			if (existingUser) {
				yield* sdk.AUTH.oAuth.create({
					userId: existingUser.id,
					provider: providerId,
					providerUserId,
				});

				const isEmailAccountVerified = yield* isEmailVerified(existingUser);

				// If Mailer is enabled, is the user verified?
				if (!isEmailAccountVerified) {
					return new Response('Email not verified, please verify your account first.', {
						status: 400,
					}) as Response | null;
				}

				yield* createUserSession(existingUser.id, context);
				return redirect(StudioCMSRoutes.mainLinks.dashboardIndex) as Response | null;
			}
		}

		return null as Response | null;
	});

/**
 * Handles the post-creation flow for a newly created OAuth user.
 *
 * Covers: creation-error guard, first-time-setup redirect, sending the verification email,
 * email-verified check, session creation, and final dashboard redirect.
 *
 * @param context - The current API context.
 * @param newUser - The result of `createOAuthUser` — either a user record (`{ id }`) or an
 *   error object (`{ error }`).
 */
export const handleNewOAuthUser = (
	context: APIContext,
	newUser: { id: string } | { error: unknown }
) =>
	genLogger('studiocms/oauth/shared/handleNewOAuthUser')(function* () {
		const { redirect } = context;

		if ('error' in newUser) {
			return new Response('Error creating user', { status: 500 });
		}

		// FIRST-TIME-SETUP
		if (config.dbStartPage) {
			return redirect('/done');
		}

		const sdk = yield* SDKCore;
		const { isEmailVerified, sendVerificationEmail } = yield* VerifyEmail;
		const { createUserSession } = yield* Session;

		yield* sendVerificationEmail(newUser.id, true);

		const existingUser = yield* sdk.GET.users.byId(newUser.id);

		const isEmailAccountVerified = yield* isEmailVerified(existingUser);

		// If Mailer is enabled, is the user verified?
		if (!isEmailAccountVerified) {
			return new Response('Email not verified, please verify your account first.', {
				status: 400,
			});
		}

		yield* createUserSession(newUser.id, context);
		return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
	});
