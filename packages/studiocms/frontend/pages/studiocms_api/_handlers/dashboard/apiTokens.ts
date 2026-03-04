import { developerConfig } from 'studiocms:config';
import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { Effect } from 'effect';
import { sharedDBErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Dashboard API Handlers - API Tokens group
 */
export const ApiTokensHandler = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'apiTokens',
	(handlers) =>
		handlers
			.handle(
				'createApiToken',
				Effect.fn(
					function* ({ payload: { user, description } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [sdk, userData] = yield* Effect.all([SDKCore, CurrentUser]);

						const isAuthorized = userData.userPermissionLevel.isEditor;

						if (!userData.isLoggedIn || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						const newToken = yield* sdk.REST_API.tokens.new(user, description);

						return { token: newToken.key };
					},
					Effect.catchTags({
						...sharedDBErrors,
						GeneratorError: () => new DashboardAPIError({ error: 'Internal Server Error' }),
					})
				)
			)
			.handle(
				'revokeApiToken',
				Effect.fn(function* ({ payload: { tokenID, userID } }) {
					if (!dashboardAPIEnabled) {
						return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
					}

					if (developerConfig.demoMode !== false) {
						return yield* new DashboardAPIError({
							error: 'Demo mode is enabled, this action is not allowed.',
						});
					}

					const [sdk, userData] = yield* Effect.all([SDKCore, CurrentUser]);

					const isAuthorized = userData.userPermissionLevel.isEditor;

					if (!userData.isLoggedIn || !isAuthorized) {
						return yield* new DashboardAPIError({ error: 'Unauthorized' });
					}

					yield* sdk.REST_API.tokens.delete({ tokenId: tokenID, userId: userID });

					return {
						message: 'Token deleted',
					};
				}, Effect.catchTags(sharedDBErrors))
			)
);
