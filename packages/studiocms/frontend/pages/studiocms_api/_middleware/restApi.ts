import { SDKCore } from 'studiocms:sdk';
import {
	RestAPIAuthorization,
	RestAPIError,
	type RestAPIUser,
	Unauthorized,
} from '@withstudiocms/api-spec/rest-api';
import { Effect, Layer, Redacted } from 'effect';

/**
 * Utility function to check if the provided user object is a valid RestAPIUser.
 *
 * This function takes a user object that may be `false` or a valid `RestAPIUser`.
 * If the user is valid, it returns an Effect that succeeds with the user.
 * If the user is `false`, it returns an Effect that fails with an `Unauthorized` error.
 *
 * @param user - The user object to validate, which can be `false` or a `RestAPIUser`.
 * @returns An Effect that either succeeds with the valid RestAPIUser or fails with an Unauthorized error.
 */
const isUser = (
	user: false | typeof RestAPIUser.Type
): Effect.Effect<RestAPIUser, Unauthorized, never> =>
	user ? Effect.succeed(user) : Effect.fail(new Unauthorized());

/**
 * Live implementation of the RestAPIAuthorization middleware.
 */
export const RestAPIAuthorizationLive = Layer.effect(
	RestAPIAuthorization,
	Effect.gen(function* () {
		return {
			restApiToken: Effect.fn(
				(token: Redacted.Redacted<string>) =>
					SDKCore.pipe(
						Effect.flatMap(({ REST_API }) => REST_API.tokens.verify(Redacted.value(token))),
						Effect.flatMap(isUser)
					),
				Effect.catchTags({
					DBClientInitializationError: () =>
						new RestAPIError({
							error: 'Database client initialization failed during token verification',
						}),
					DBCallbackFailure: () =>
						new RestAPIError({ error: 'Database error during token verification' }),
					SDKInitializationError: () =>
						new RestAPIError({ error: 'SDK initialization error during token verification' }),
					NotFoundError: () => new RestAPIError({ error: 'Token error during verification' }),
					QueryError: () =>
						new RestAPIError({ error: 'Database query error during token verification' }),
					QueryParseError: () =>
						new RestAPIError({ error: 'Database query parse error during token verification' }),
				})
			),
		};
	})
);
