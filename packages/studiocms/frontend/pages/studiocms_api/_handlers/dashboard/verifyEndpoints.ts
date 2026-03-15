import { Session, VerifyEmail } from 'studiocms:auth/lib';
import type { SessionValidationResult, UserSessionData } from 'studiocms:auth/lib/types';
import { developerConfig } from 'studiocms:config';
import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder, HttpServerResponse } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { AstroAPIContext } from '@withstudiocms/effect';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { AuthSessionCookieName } from '#consts';
import { sharedDBErrors, sharedNotifierErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Response Data object for the verifySession endpoint. This defines the structure of the response that will be sent back to the client when verifying a user's session. It includes information about whether the user is logged in, their user details, permission level, and relevant route links for the dashboard.
 */
type ResponseData = {
	isLoggedIn: boolean;
	user: {
		id: string;
		name: string;
		email: string | null;
		avatar: string | null;
		username: string;
	} | null;
	permissionLevel: UserSessionData['permissionLevel'];
	routes: {
		logout: string;
		userProfile: string;
		contentManagement: string;
		dashboardIndex: string;
	};
};

/**
 * Response builder for the verifySession endpoint. This function constructs a standardized response object containing the user's authentication status, user information, permission level, and relevant route links. It is used to provide consistent responses for session verification requests, allowing the frontend to easily determine the user's session state and permissions.
 */
const responseBuilder = (
	context: APIContext,
	isLoggedIn: boolean,
	user: SessionValidationResult['user'],
	permissionLevel: UserSessionData['permissionLevel']
) => {
	const data: ResponseData = {
		isLoggedIn,
		user: user
			? {
					id: user.id,
					name: user.name,
					email: user.email || null,
					avatar: user.avatar || null,
					username: user.username,
				}
			: null,
		permissionLevel: permissionLevel,
		routes: {
			logout: context.locals.StudioCMS.routeMap.authLinks.logoutAPI,
			userProfile: context.locals.StudioCMS.routeMap.mainLinks.userProfile,
			contentManagement: context.locals.StudioCMS.routeMap.mainLinks.contentManagement,
			dashboardIndex: context.locals.StudioCMS.routeMap.mainLinks.dashboardIndex,
		},
	};

	return data;
};

/**
 * Verify Endpoints Handlers for the Dashboard API
 */
export const VerifyEndpointsHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'verifyEndpoints',
	(handlers) =>
		handlers
			.handle(
				'verifyEmail',
				Effect.fn(
					function* ({ urlParams: { token, userId } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({
								error: 'Dashboard API is disabled, this action is not allowed.',
							});
						}

						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, verifyEmail, ctx] = yield* Effect.all([
							SDKCore,
							VerifyEmail,
							AstroAPIContext,
						]);

						const verificationToken = yield* verifyEmail.getEmailVerificationRequest(userId);

						if (!verificationToken) {
							return yield* new DashboardAPIError({
								error: 'Verification token not found',
							});
						}

						if (verificationToken.token !== token) {
							return yield* new DashboardAPIError({
								error: 'Invalid token',
							});
						}

						const existingUser = yield* sdk.GET.users.byId(userId);

						if (!existingUser) {
							return yield* new DashboardAPIError({
								error: 'User not found',
							});
						}

						yield* Effect.all([
							sdk.AUTH.user.update({
								userId,
								userData: {
									id: userId,
									name: existingUser.name,
									username: existingUser.username,
									emailVerified: true,
									updatedAt: new Date().toISOString(),
									createdAt: undefined,
								},
							}),
							sdk.AUTH.verifyEmail.delete(userId),
						]);

						if (!ctx.site) {
							return yield* new DashboardAPIError({
								error: 'Site configuration not found',
							});
						}

						return HttpServerResponse.redirect(
							new URL(ctx.locals.StudioCMS.routeMap.mainLinks.dashboardIndex, ctx.site?.toString())
						);
					},
					VerifyEmail.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
			.handle(
				'verifySession',
				Effect.fn(function* ({ payload: { originPathname } }) {
					const [ses, sdk, ctx] = yield* Effect.all([
						Session.pipe(
							Effect.catchAll(
								() => new DashboardAPIError({ error: 'Failed to initialize session' })
							)
						),
						SDKCore,
						AstroAPIContext,
					]);

					if (!dashboardAPIEnabled) {
						return responseBuilder(ctx, false, null, 'unknown');
					}

					const { cookies } = ctx;

					const sessionToken = cookies.get(AuthSessionCookieName)?.value ?? null;

					if (!sessionToken) {
						yield* Effect.logInfo(
							`No session token found in cookies, returning unknown session status. Origin: ${originPathname}`
						);
						return responseBuilder(ctx, false, null, 'unknown');
					}

					const { session, user } = yield* ses
						.validateSessionToken(sessionToken)
						.pipe(
							Effect.catchAll(
								() => new DashboardAPIError({ error: 'Failed to validate session token' })
							)
						);

					if (session === null) {
						yield* ses.deleteSessionTokenCookie(ctx).pipe(
							Effect.catchAll(
								() =>
									new DashboardAPIError({
										error: 'Failed to delete invalid session token cookie',
									})
							)
						);
						yield* Effect.logInfo(
							`Session token is invalid or expired, deleting cookie. Origin: ${originPathname}`
						);
						return responseBuilder(ctx, false, null, 'unknown');
					}

					if (!user || user === null) {
						yield* Effect.logInfo(
							`No user found for session token, returning unknown session status. Origin: ${originPathname}`
						);
						return responseBuilder(ctx, false, null, 'unknown');
					}

					const result = yield* sdk.AUTH.permission.currentStatus(user.id);

					if (!result) {
						yield* Effect.logInfo(
							`Failed to retrieve permission status for user ${user.id}, returning unknown session status. Origin: ${originPathname}`
						);
						return responseBuilder(ctx, true, user, 'unknown');
					}

					const permissionLevel: UserSessionData['permissionLevel'] = result.rank;
					return responseBuilder(ctx, true, user, permissionLevel);
				}, Effect.catchTags(sharedDBErrors))
			)
			.handle(
				'resendVerifyEmail',
				Effect.fn(
					function* ({ payload: { userId } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({
								error: 'Dashboard API is disabled, this action is not allowed.',
							});
						}

						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, verifier, ctx, userData] = yield* Effect.all([
							SDKCore,
							VerifyEmail,
							AstroAPIContext,
							CurrentUser,
						]);

						if (!ctx.locals.StudioCMS.siteConfig.data.enableMailer) {
							return yield* new DashboardAPIError({
								error: 'Mailer is disabled, this action is disabled.',
							});
						}

						if (!userData.isLoggedIn || !userData.userPermissionLevel.isAdmin) {
							return yield* new DashboardAPIError({
								error: 'Unauthorized',
							});
						}

						const newToken = yield* sdk.AUTH.verifyEmail.create(userId);

						if (!newToken) {
							return yield* new DashboardAPIError({
								error: 'Failed to create verification token',
							});
						}

						const response = yield* verifier
							.sendVerificationEmail(userId)
							.pipe(
								Effect.catchAll(
									() => new DashboardAPIError({ error: 'Failed to send verification email' })
								)
							);

						if (!response) {
							return yield* new DashboardAPIError({
								error: 'Failed to send verification email',
							});
						}

						if ('error' in response) {
							return yield* new DashboardAPIError({
								error: response.error,
							});
						}

						return {
							message: response.message,
						};
					},
					VerifyEmail.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						GeneratorError: () => new DashboardAPIError({ error: 'An unknown error occurred' }),
					})
				)
			)
);
