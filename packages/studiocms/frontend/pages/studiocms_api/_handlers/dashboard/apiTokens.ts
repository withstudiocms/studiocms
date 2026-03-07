import { developerConfig } from 'studiocms:config';
import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { Effect } from 'effect';
import { sharedDBErrors } from './_shared.js';

// TODO: Implement Admin level API token revocation that allows revoking any token, not just tokens owned by the user. This will require additional permission checks to ensure only Admin users can revoke tokens that they do not own.

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
					function* ({ payload: { description } }) {
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

						if (!userData.isLoggedIn || !userData.user || !isAuthorized) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						const newToken = yield* sdk.REST_API.tokens.new(userData.user.id, description);

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
				Effect.fn(function* ({ payload: { tokenID } }) {
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

					if (!userData.isLoggedIn || !userData.user || !isAuthorized) {
						return yield* new DashboardAPIError({ error: 'Unauthorized' });
					}

					const tokenData = yield* sdk.REST_API.tokens.get(userData.user.id);

					if (!tokenData || tokenData.length === 0) {
						return yield* new DashboardAPIError({ error: 'Token not found' });
					}

					const tokenExists = tokenData.some((token) => token.id === tokenID);
					const tokenBelongsToUser = tokenData.some(
						// biome-ignore lint/style/noNonNullAssertion: we check for userData.user above, so this is safe to do
						(token) => token.id === tokenID && token.userId === userData.user!.id
					);

					if (!tokenExists || !tokenBelongsToUser) {
						return yield* new DashboardAPIError({ error: 'Unauthorized' });
					}

					yield* sdk.REST_API.tokens.delete({ tokenId: tokenID, userId: userData.user.id });

					return {
						message: 'Token deleted',
					};
				}, Effect.catchTags(sharedDBErrors))
			)
);
