import { Password, User } from 'studiocms:auth/lib';
import { developerConfig } from 'studiocms:config';
import { Mailer } from 'studiocms:mailer';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import templateEngine from 'studiocms:template-engine';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { AstroAPIContext, CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { availablePermissionRanks } from '@withstudiocms/auth-kit/types';
import { appendSearchParamsToUrl } from '@withstudiocms/effect/effect';
import type { APIContext } from 'astro';
import { Effect, pipe } from 'effect';
import { ValidRanks } from '#consts';
import { isValidEmail } from '#schemas';
import { sharedDBErrors, sharedNotifierErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Type definition for the token object returned when creating a password reset link. This includes the token ID, the user ID it is associated with, and the token string itself. This type is used to ensure that the correct data structure is returned and handled when generating password reset links for users.
 */
type Token = {
	id: string;
	userId: string;
	token: string;
};

/**
 * Generates a password reset URL for a user based on the provided token information. This function constructs a URL that includes the necessary query parameters for resetting a user's password, such as the user ID, token, and token ID. The URL is built using the base URL of the application and the specific route for password resets in the dashboard. This allows users to securely reset their passwords by following the generated link.
 */
const generateResetUrl = (
	{
		locals: {
			StudioCMS: {
				routeMap: {
					mainLinks: { dashboardIndex },
				},
			},
		},
	}: APIContext,
	baseUrl: string,
	{ id, userId, token }: Token
) => {
	const resetURL = new URL(`${dashboardIndex}/password-reset`, baseUrl);
	return pipe(
		resetURL,
		appendSearchParamsToUrl('userid', userId),
		appendSearchParamsToUrl('token', token),
		appendSearchParamsToUrl('id', id)
	);
};

/**
 * Create Handlers for the Dashboard API - This group of handlers includes endpoints for creating resources in the dashboard, such as users and password reset links. Each handler checks if the Dashboard API is enabled, verifies user permissions, validates input data, and interacts with the SDK to perform the necessary actions. The handlers also include error handling to return appropriate error messages for various failure scenarios, such as unauthorized access, invalid input, or internal server errors. Additionally, notifications are sent for certain actions, such as when a new user is created or when a user's password is updated.
 */
export const CreateHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'create',
	(handlers) =>
		handlers
			.handle(
				'createPasswordResetLink',
				Effect.fn(
					function* ({ payload: { userId } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData, notifier] = yield* Effect.all([
							SDKCore,
							CurrentUser,
							Notifications,
						]);

						const isAuthorized = userData.userPermissionLevel.isAdmin;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						const [token, user] = yield* Effect.all([
							sdk.resetTokenBucket.new(userId),
							sdk.GET.users.byId(userId),
						]);

						if (!token || !user) {
							return yield* new DashboardAPIError({ error: 'User not found' });
						}

						yield* notifier
							.sendAdminNotification('user_updated', user.username)
							.pipe(
								Effect.catchAll(
									() => new DashboardAPIError({ error: 'Failed to send notification' })
								)
							);

						return token;
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						GeneratorError: () => new DashboardAPIError({ error: 'Internal Server Error' }),
					})
				)
			)
			.handle(
				'createUser',
				Effect.fn(
					function* ({ payload }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [pass, userHelper, sdk, userData, notifier] = yield* Effect.all([
							Password,
							User.pipe(
								Effect.catchAll(
									() => new DashboardAPIError({ error: 'Failed to access User module' })
								)
							),
							SDKCore,
							CurrentUser,
							Notifications,
						]);

						const isAuthorized = userData.userPermissionLevel.isAdmin;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						let { username, password, email, displayname, rank } = payload;

						if (!username) {
							return yield* new DashboardAPIError({ error: 'Missing field: Username is required' });
						}

						if (!password) {
							password = yield* sdk.UTIL.Generators.generateRandomPassword(12);
						}

						if (!email) {
							return yield* new DashboardAPIError({ error: 'Missing field: Email is required' });
						}

						if (!displayname) {
							return yield* new DashboardAPIError({
								error: 'Missing field: Display name is required',
							});
						}

						if (!rank) {
							return yield* new DashboardAPIError({ error: 'Missing field: Rank is required' });
						}

						if (!ValidRanks.has(rank) || rank === 'unknown') {
							return yield* new DashboardAPIError({ error: 'Invalid rank' });
						}

						const callerPerm = availablePermissionRanks.indexOf(userData.permissionLevel);
						const targetPerm = availablePermissionRanks.indexOf(rank);

						if (targetPerm >= callerPerm) {
							return yield* new DashboardAPIError({
								error: 'Unauthorized: insufficient permissions to assign target rank',
							});
						}

						const checkEmail = isValidEmail(email);

						if (!checkEmail.success) {
							return yield* new DashboardAPIError({
								error: `Invalid email: ${checkEmail.error.message}`,
							});
						}

						const [
							verifyUsernameResponse,
							verifyPasswordResponse,
							{ usernameSearch, emailSearch },
						] = yield* Effect.all([
							userHelper.verifyUsernameInput(username).pipe(
								Effect.catchAll(
									(err) =>
										new DashboardAPIError({
											error: 'message' in err ? (err.message as string) : 'Invalid username',
										})
								)
							),
							pass.verifyPasswordStrength(password).pipe(
								Effect.catchAll(
									(err) =>
										new DashboardAPIError({
											error: 'message' in err ? (err.message as string) : 'Invalid password',
										})
								)
							),
							sdk.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data),
						]);

						if (verifyUsernameResponse !== true) {
							return yield* new DashboardAPIError({ error: verifyUsernameResponse });
						}

						if (verifyPasswordResponse !== true) {
							return yield* new DashboardAPIError({ error: verifyPasswordResponse });
						}

						if (usernameSearch.length > 0) {
							return yield* new DashboardAPIError({
								error: 'Invalid username: Username is already in use',
							});
						}

						if (emailSearch.length > 0) {
							return yield* new DashboardAPIError({
								error: 'Invalid email: Email is already in use',
							});
						}

						yield* userHelper.createLocalUser(displayname, username, email, password).pipe(
							Effect.catchAll(
								(err) =>
									new DashboardAPIError({
										error: 'message' in err ? (err.message as string) : 'Failed to create user',
									})
							),
							Effect.flatMap((newUser) =>
								sdk.UPDATE.permissions({
									user: newUser.id,
									rank: rank,
								})
							)
						);

						yield* notifier
							.sendAdminNotification('new_user', username)
							.pipe(
								Effect.catchAll(
									() => new DashboardAPIError({ error: 'Failed to send notification' })
								)
							);

						return {
							message: 'User created successfully.',
						};
					},
					Notifications.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						GeneratorError: () => new DashboardAPIError({ error: 'Internal Server Error' }),
					})
				)
			)
			.handle(
				'createUserInvite',
				Effect.fn(
					function* ({ payload }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userHelper, userData, notifier, mailer, ctx] = yield* Effect.all([
							SDKCore,
							User.pipe(
								Effect.catchAll(
									() => new DashboardAPIError({ error: 'Failed to access User module' })
								)
							),
							CurrentUser,
							Notifications,
							Mailer,
							AstroAPIContext,
						]);

						const siteConfig = ctx.locals.StudioCMS.siteConfig.data;

						if (!siteConfig) {
							return yield* new DashboardAPIError({ error: 'Site configuration not found' });
						}

						const isAuthorized = userData.userPermissionLevel.isAdmin;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						const { username, email, displayname, rank, originalUrl } = payload;

						if (!ValidRanks.has(rank) || rank === 'unknown') {
							return yield* new DashboardAPIError({ error: 'Invalid rank' });
						}

						const callerPerm = availablePermissionRanks.indexOf(userData.permissionLevel);
						const targetPerm = availablePermissionRanks.indexOf(rank);

						if (targetPerm >= callerPerm) {
							return yield* new DashboardAPIError({
								error: 'Unauthorized: insufficient permissions to assign target rank',
							});
						}

						const checkEmail = isValidEmail(email);

						if (!checkEmail.success) {
							return yield* new DashboardAPIError({
								error: `Invalid email: ${checkEmail.error.message}`,
							});
						}

						const [verifyUsernameResponse, { usernameSearch, emailSearch }] = yield* Effect.all([
							userHelper.verifyUsernameInput(username).pipe(
								Effect.catchAll(
									(err) =>
										new DashboardAPIError({
											error:
												'Invalid username: ' +
												('message' in err ? (err.message as string) : 'Failed to verify username'),
										})
								)
							),
							sdk.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data),
						]);

						if (verifyUsernameResponse !== true) {
							return yield* new DashboardAPIError({ error: verifyUsernameResponse });
						}

						if (usernameSearch.length > 0) {
							return yield* new DashboardAPIError({
								error: 'Invalid username: Username is already in use',
							});
						}

						if (emailSearch.length > 0) {
							return yield* new DashboardAPIError({
								error: 'Invalid email: Email is already in use',
							});
						}

						// Creates a new user invite
						const token = yield* sdk.AUTH.user
							.create(
								{
									username,
									email: checkEmail.data,
									name: displayname,
									createdAt: new Date().toISOString(),
									id: crypto.randomUUID(),
									avatar: undefined,
									emailVerified: false,
									notifications: undefined,
									password: undefined,
									updatedAt: new Date().toISOString(),
									url: undefined,
								},
								rank
							)
							.pipe(Effect.flatMap((newUser) => sdk.resetTokenBucket.new(newUser.id)));

						if (!token) {
							return yield* new DashboardAPIError({ error: 'Failed to create user invite' });
						}

						const resetLink = generateResetUrl(ctx, originalUrl, token);

						yield* notifier
							.sendAdminNotification('new_user', username)
							.pipe(
								Effect.catchAll(
									() => new DashboardAPIError({ error: 'Failed to send notification' })
								)
							);

						if (siteConfig.enableMailer) {
							const checkMailConnection = yield* mailer.verifyMailConnection.pipe(
								Effect.catchAll(
									() => new DashboardAPIError({ error: 'Failed to connect to mail server' })
								)
							);

							if (!checkMailConnection) {
								return yield* new DashboardAPIError({
									error: 'Failed to send invite email: Mailer connection failed',
								});
							}

							if ('error' in checkMailConnection) {
								return yield* new DashboardAPIError({
									error: 'Failed to send invite email: Mailer connection error',
								});
							}

							const engine = yield* templateEngine;
							const { title: siteTitle, description, siteIcon } = siteConfig;

							const userInviteTemplate = yield* engine.render('userInvite', {
								site: { title: siteTitle, description, icon: siteIcon ?? undefined },
								data: { link: resetLink.toString() },
							});

							const mailResponse = yield* mailer
								.sendMail({
									to: checkEmail.data,
									subject: `You have been invited to join ${siteConfig.title}!`,
									html: userInviteTemplate,
								})
								.pipe(
									Effect.catchAll(
										(err) =>
											new DashboardAPIError({
												error:
													'Failed to send invite email: ' +
													('message' in err
														? (err.message as string)
														: 'Mailer error during sending'),
											})
									)
								);

							if (!mailResponse) {
								return yield* new DashboardAPIError({
									error: 'Failed to send invite email: Mailer failed to send email',
								});
							}

							if ('error' in mailResponse) {
								return yield* new DashboardAPIError({
									error: 'Failed to send invite email: Mailer error during sending',
								});
							}

							return {
								message: 'User invite created and email sent',
							};
						}

						return {
							message: resetLink.toString(),
						};
					},
					Notifications.Provide,
					Mailer.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
						GeneratorError: () => new DashboardAPIError({ error: 'Internal Server Error' }),
						TemplateEngineError: () =>
							new DashboardAPIError({ error: 'Failed to render email template' }),
					})
				)
			)
);
